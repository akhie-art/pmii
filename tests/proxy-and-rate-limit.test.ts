import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  resetRateLimits,
} from "@/lib/rate-limit";

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

import {
  matchesPrefix,
  buildContentSecurityPolicy,
  applySecurityHeaders,
  proxy,
} from "@/proxy";
import { GET as verifyAnggotaGET } from "@/app/api/verify-anggota/route";
import { GET as publicStatsGET } from "@/app/api/public-stats/route";

describe("Security: Rate Limiter & Client IP Extraction", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("enforces sliding-window request caps and recovers after window expiry", () => {
    const config = { limit: 3, windowMs: 10_000 };
    const t0 = 1_000_000;

    expect(checkRateLimit("ip:1", config, t0).allowed).toBe(true);
    expect(checkRateLimit("ip:1", config, t0 + 1000).allowed).toBe(true);
    const third = checkRateLimit("ip:1", config, t0 + 2000);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    const blocked = checkRateLimit("ip:1", config, t0 + 3000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(7);

    // Different key stays unaffected
    expect(checkRateLimit("ip:2", config, t0 + 3000).allowed).toBe(true);

    // After first request ages out of 10s window, request is allowed again
    expect(checkRateLimit("ip:1", config, t0 + 10_001).allowed).toBe(true);
  });

  it("extracts client IP safely from proxy headers", () => {
    const h1 = new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" });
    expect(getClientIp(h1)).toBe("203.0.113.10");

    const h2 = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(getClientIp(h2)).toBe("198.51.100.7");

    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("Security: Next.js 16 Proxy, CSP & RBAC Guards", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://demo.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key-test";
  });

  it("matches exact prefixes without false positives on sibling paths", () => {
    expect(matchesPrefix("/admin", ["/admin"])).toBe(true);
    expect(matchesPrefix("/admin/pengguna", ["/admin"])).toBe(true);
    expect(matchesPrefix("/admin-portal", ["/admin"])).toBe(false);
    expect(matchesPrefix("/superadmin/tenant", ["/superadmin", "/super_admin"])).toBe(true);
  });

  it("builds strict CSP directives including Supabase origin and blocks object-src", () => {
    const csp = buildContentSecurityPolicy("https://proj.supabase.co");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("https://proj.supabase.co");
    expect(csp).toContain("wss://proj.supabase.co");
    expect(csp).toContain("https://lh3.googleusercontent.com");
  });

  it("applies defense-in-depth security headers including HSTS in production", () => {
    const originalEnv = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");
    try {
      const res = applySecurityHeaders(NextResponse.next(), "https://proj.supabase.co");
      expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
      expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
    } finally {
      vi.stubEnv("NODE_ENV", originalEnv || "test");
    }
  });

  it("passes public pages through with security headers without auth lookup", async () => {
    const req = new NextRequest("https://siakad.pmii.or.id/artikel/kaderisasi");
    const res = await proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated visitors away from protected staff routes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest("https://siakad.pmii.or.id/admin/anggota?tab=aktif");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://siakad.pmii.or.id/login?redirect=%2Fadmin%2Fanggota%3Ftab%3Daktif"
    );
  });

  it("ignores forged user_metadata.role and trusts ONLY tamper-proof app_metadata.role", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u-attacker",
          email: "attacker@example.com",
          user_metadata: { role: "superadmin" },
          app_metadata: {},
        },
      },
    });
    const req = new NextRequest("https://siakad.pmii.or.id/admin/pengguna");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://siakad.pmii.or.id/anggota");
  });

  it("blocks pengurus from accessing /superadmin, /cabang, /pc, and /admin routes", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u-pengurus",
          app_metadata: { role: "pengurus" },
        },
      },
    });

    for (const path of ["/superadmin/tenant", "/cabang/anggota", "/pc/surat", "/admin/pengguna"]) {
      const req = new NextRequest(`https://siakad.pmii.or.id${path}`);
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toMatch(/^https:\/\/siakad\.pmii\.or\.id\/pengurus/);
    }
  });

  it("blocks instruktur from accessing /admin and /pengurus routes", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "u-inst",
          app_metadata: { role: "instruktur" },
        },
      },
    });

    const req = new NextRequest("https://siakad.pmii.or.id/pengurus/pengajuan-sk");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://siakad.pmii.or.id/instruktur/pengajuan-sk");
  });

  it("blocks regular cabang admin from /superadmin but allows superadmin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u-admin", app_metadata: { role: "admin" } } },
    });
    const blockedRes = await proxy(new NextRequest("https://siakad.pmii.or.id/superadmin/tenant"));
    expect(blockedRes.status).toBe(307);
    expect(blockedRes.headers.get("location")).toBe("https://siakad.pmii.or.id/admin/tenant");

    mockGetUser.mockResolvedValue({
      data: { user: { id: "u-super", app_metadata: { role: "superadmin" } } },
    });
    const allowedRes = await proxy(new NextRequest("https://siakad.pmii.or.id/superadmin/tenant"));
    expect(allowedRes.status).toBe(200);
  });
});

describe("API Route Handlers: Validation & Rate-Limit Enforcement", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("/api/verify-anggota validates query length (min 2, max 100) and returns 429 on burst", async () => {
    const shortReq = new NextRequest("https://siakad.pmii.or.id/api/verify-anggota?q=a", {
      headers: { "x-forwarded-for": "198.51.100.1" },
    });
    const shortRes = await verifyAnggotaGET(shortReq);
    expect(shortRes.status).toBe(400);

    const longReq = new NextRequest(
      `https://siakad.pmii.or.id/api/verify-anggota?q=${"x".repeat(101)}`,
      { headers: { "x-forwarded-for": "198.51.100.1" } }
    );
    const longRes = await verifyAnggotaGET(longReq);
    expect(longRes.status).toBe(400);

    // Exhaust 20 req/min limit for a dedicated IP
    const ip = "198.51.100.99";
    for (let i = 0; i < 20; i++) {
      await verifyAnggotaGET(
        new NextRequest("https://siakad.pmii.or.id/api/verify-anggota?q=a", {
          headers: { "x-forwarded-for": ip },
        })
      );
    }
    const throttled = await verifyAnggotaGET(
      new NextRequest("https://siakad.pmii.or.id/api/verify-anggota?q=Sahabat", {
        headers: { "x-forwarded-for": ip },
      })
    );
    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("Retry-After")).toBeTruthy();
  });

  it("/api/public-stats returns expected payload shape and enforces 429 after 60 requests", async () => {
    const ip = "203.0.113.42";
    const first = await publicStatsGET(
      new NextRequest("https://siakad.pmii.or.id/api/public-stats", {
        headers: { "x-forwarded-for": ip },
      })
    );
    expect(first.status).toBe(200);
    const json = await first.json();
    expect(typeof json.cadresCount).toBe("number");
    expect(typeof json.stagesCount).toBe("number");

    for (let i = 1; i < 60; i++) {
      await publicStatsGET(
        new NextRequest("https://siakad.pmii.or.id/api/public-stats", {
          headers: { "x-forwarded-for": ip },
        })
      );
    }
    const throttled = await publicStatsGET(
      new NextRequest("https://siakad.pmii.or.id/api/public-stats", {
        headers: { "x-forwarded-for": ip },
      })
    );
    expect(throttled.status).toBe(429);
  });
});
