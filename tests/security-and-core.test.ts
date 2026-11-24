import { describe, it, expect } from "vitest";
import { sanitizeHtml, escapeHtml } from "@/lib/sanitize";
import {
  isUserSuperAdmin,
  isUserAdmin,
  isUserPengurus,
  isUserInstruktur,
  normalizeRole,
  getTargetStaffPrefix,
  isMenuAllowed,
} from "@/lib/auth-helpers";
import {
  normalizeTenantName,
  getKomisariatSlug,
  isCabangOrAdmin,
  CABANG_TENANT_ID,
} from "@/lib/tenancy";
import {
  getUserCredentials,
  getUserPassword,
  setUserPassword,
} from "@/lib/services/credentials";
import {
  readSpreadsheetTo2DArray,
  spreadsheetBufferToSafeHtml,
} from "@/lib/excel";

describe("Security: HTML Sanitization & XSS Prevention", () => {
  it("strips script tags, event handlers, and javascript: URIs", () => {
    const malicious =
      '<p>Halo</p><script>alert(1)</script><img src=x onerror="alert(2)" /><a href="javascript:alert(3)">Klik</a><iframe src="https://evil.com"></iframe>';
    const clean = sanitizeHtml(malicious);

    expect(clean).toContain("<p>Halo</p>");
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("<iframe");
  });

  it("preserves safe formatting tags for articles and official letters", () => {
    const safeHtml =
      '<h2>Judul</h2><p>Paragraf <strong>tebal</strong> dan <em>miring</em>.</p><table><tr><td>Sel</td></tr></table>';
    const clean = sanitizeHtml(safeHtml);

    expect(clean).toContain("<h2>Judul</h2>");
    expect(clean).toContain("<strong>tebal</strong>");
    expect(clean).toContain("<table>");
  });

  it("escapes plain text properly in escapeHtml", () => {
    expect(escapeHtml('<script>"test" & \'x\'</script>')).toBe(
      "&lt;script&gt;&quot;test&quot; &amp; &#39;x&#39;&lt;/script&gt;"
    );
  });
});

describe("Security: Credentials Store Hardening", () => {
  it("never exposes hardcoded passwords or stores plaintext passwords", () => {
    setUserPassword(["admin@pmii.org", "user-1"], "secret123");
    expect(getUserCredentials()).toEqual({});
    expect(getUserPassword("admin@pmii.org")).toBeUndefined();
    expect(getUserPassword({ email: "admin@pmii.org" })).toBeUndefined();
  });
});

describe("Auth Helpers & Role Normalization", () => {
  it("identifies roles accurately", () => {
    expect(isUserSuperAdmin("superadmin")).toBe(true);
    expect(isUserSuperAdmin("pengurus")).toBe(false);
    expect(isUserAdmin("ketua_cabang")).toBe(true);
    expect(isUserAdmin("pengurus_komisariat")).toBe(false);
    expect(isUserPengurus("pengurus_komisariat")).toBe(true);
    expect(isUserPengurus("admin")).toBe(false);
    expect(isUserInstruktur("instruktur")).toBe(true);
  });

  it("normalizes roles and staff route prefixes", () => {
    expect(normalizeRole("superadmin")).toBe("admin");
    expect(normalizeRole("ketua_komisariat")).toBe("pengurus");
    expect(normalizeRole("instruktur")).toBe("instruktur");
    expect(normalizeRole("calon")).toBe("peserta");
    expect(normalizeRole("anggota")).toBe("anggota");

    expect(getTargetStaffPrefix("admin")).toBe("/admin");
    expect(getTargetStaffPrefix("instruktur")).toBe("/instruktur");
    expect(getTargetStaffPrefix("pengurus")).toBe("/pengurus");
  });

  it("enforces menu access controls", () => {
    expect(isMenuAllowed("/admin/pengguna", null, "/admin")).toBe(false);
    expect(
      isMenuAllowed(
        "/admin/pengguna",
        { role: "superadmin", allowedMenus: [] },
        "/admin"
      )
    ).toBe(true);
    expect(
      isMenuAllowed(
        "/pengurus/pengguna",
        { role: "pengurus", allowedMenus: ["/pengurus/anggota"] },
        "/pengurus"
      )
    ).toBe(false);
    expect(
      isMenuAllowed(
        "/pengurus/anggota",
        { role: "pengurus", allowedMenus: ["/pengurus/anggota"] },
        "/pengurus"
      )
    ).toBe(true);
  });
});

describe("Multi-Tenancy Helpers", () => {
  it("normalizes tenant names and generates clean slugs", () => {
    expect(normalizeTenantName("Komisariat Ki Ageng Getas Pendawa")).toBe(
      "kiagenggetaspendawa"
    );
    expect(getKomisariatSlug("Komisariat Ki Ageng Getas Pendawa")).toBe(
      "ki-ageng-getas-pendawa"
    );
  });

  it("distinguishes cabang admins from komisariat staff", () => {
    expect(
      isCabangOrAdmin({
        id: "1",
        name: "Ketua Cabang",
        email: "cabang@pmii.org",
        role: "admin",
        commissariat: "Pengurus Cabang PMII Grobogan",
        tenant_id: CABANG_TENANT_ID,
        status: "AKTIF",
        createdAt: "",
      })
    ).toBe(true);

    expect(
      isCabangOrAdmin({
        id: "2",
        name: "Ketua Komisariat",
        email: "komisariat@pmii.org",
        role: "pengurus",
        commissariat: "Komisariat Ajisaka",
        tenant_id: "2342112a-7413-4151-9998-3a13e833902f",
        status: "AKTIF",
        createdAt: "",
      })
    ).toBe(false);
  });
});

describe("Spreadsheet Parsing & XSS-Safe Preview (ExcelJS)", () => {
  it("parses CSV buffers cleanly and escapes malicious HTML cells", async () => {
    const csv = 'Nama,Catatan\n"Sahabat Ali","<img src=x onerror=alert(1)>"';
    const encoder = new TextEncoder();
    const buf = encoder.encode(csv).buffer;

    const parsed = await readSpreadsheetTo2DArray(buf, { fileName: "test.csv" });
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[1][0]).toBe("Sahabat Ali");

    const preview = await spreadsheetBufferToSafeHtml(buf, "test.csv");
    expect(preview.htmlTable).not.toContain("<img");
    expect(preview.htmlTable).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});
