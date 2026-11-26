import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isUserAdmin,
  isUserInstruktur,
  isUserPengurus,
  isUserSuperAdmin,
  getTargetStaffPrefix,
} from "@/lib/auth-helpers";

const STAFF_PREFIXES = [
  "/dashboard",
  "/admin",
  "/cabang",
  "/pc",
  "/pengurus",
  "/instruktur",
  "/superadmin",
  "/super_admin",
];

const CABANG_ONLY_PREFIXES = ["/admin", "/cabang", "/pc", "/superadmin", "/super_admin"];
const SUPERADMIN_ONLY_PREFIXES = ["/superadmin", "/super_admin"];

const MEMBER_PREFIXES = ["/anggota", "/kader", "/peserta", "/onboarding"];

export function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function buildContentSecurityPolicy(supabaseUrl?: string): string {
  const isDev = process.env.NODE_ENV === "development";
  let supabaseOrigin = "";
  try {
    if (supabaseUrl) {
      supabaseOrigin = new URL(supabaseUrl).origin;
    }
  } catch {
    supabaseOrigin = "";
  }

  const supabaseHttps = supabaseOrigin || "https://*.supabase.co";
  const supabaseWs = supabaseOrigin ? supabaseOrigin.replace(/^http/, "ws") : "wss://*.supabase.co";

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: https://*.supabase.co ${supabaseOrigin} https://lh3.googleusercontent.com`.trim(),
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${supabaseHttps} ${supabaseWs} https://*.supabase.co wss://*.supabase.co`,
    `frame-src 'self' blob: data: ${supabaseHttps} https://*.supabase.co`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];

  return directives.join("; ");
}

export function applySecurityHeaders(response: NextResponse, supabaseUrl?: string): NextResponse {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(supabaseUrl));
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isStaffRoute = matchesPrefix(pathname, STAFF_PREFIXES);
  const isMemberRoute = matchesPrefix(pathname, MEMBER_PREFIXES);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !supabaseAnonKey || (!isStaffRoute && !isMemberRoute)) {
    return applySecurityHeaders(response, supabaseUrl);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Validasi JWT di server menggunakan getUser() (bukan getSession)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return applySecurityHeaders(NextResponse.redirect(loginUrl), supabaseUrl);
  }

  // Baca peran HANYA dari app_metadata yang tamper-proof (TIDAK pernah fallback ke user_metadata!)
  const rawRole = String(user.app_metadata?.role || "anggota")
    .toLowerCase()
    .trim();

  const isSuperAdmin = isUserSuperAdmin(rawRole);
  const isAdmin = isUserAdmin(rawRole);
  const isPengurus = isUserPengurus(rawRole);
  const isInstruktur = isUserInstruktur(rawRole);
  const isStaff = isAdmin || isPengurus || isInstruktur;

  if (isStaffRoute) {
    if (!isStaff) {
      const target = rawRole === "peserta" ? "/peserta" : "/anggota";
      return applySecurityHeaders(NextResponse.redirect(new URL(target, request.url)), supabaseUrl);
    }

    const staffPrefix = getTargetStaffPrefix(rawRole);

    // Blokir prefix khusus superadmin bagi non-superadmin
    if (!isSuperAdmin && matchesPrefix(pathname, SUPERADMIN_ONLY_PREFIXES)) {
      const rewritten = pathname.replace(/^\/(superadmin|super_admin)/, staffPrefix);
      return applySecurityHeaders(
        NextResponse.redirect(new URL(`${rewritten}${search}`, request.url)),
        supabaseUrl
      );
    }

    // Instruktur tidak boleh mengakses prefix cabang/admin/pengurus
    if (isInstruktur && (matchesPrefix(pathname, CABANG_ONLY_PREFIXES) || matchesPrefix(pathname, ["/pengurus"]))) {
      const rewritten = pathname.replace(
        /^\/(admin|cabang|pc|superadmin|super_admin|pengurus)/,
        "/instruktur"
      );
      return applySecurityHeaders(
        NextResponse.redirect(new URL(`${rewritten}${search}`, request.url)),
        supabaseUrl
      );
    }

    // Pengurus komisariat tidak boleh mengakses prefix cabang/admin/instruktur
    if (isPengurus && (matchesPrefix(pathname, CABANG_ONLY_PREFIXES) || matchesPrefix(pathname, ["/instruktur"]))) {
      const rewritten = pathname.replace(
        /^\/(admin|cabang|pc|superadmin|super_admin|instruktur)/,
        "/pengurus"
      );
      return applySecurityHeaders(
        NextResponse.redirect(new URL(`${rewritten}${search}`, request.url)),
        supabaseUrl
      );
    }

    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return applySecurityHeaders(NextResponse.redirect(new URL(staffPrefix, request.url)), supabaseUrl);
    }
  }

  return applySecurityHeaders(response, supabaseUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|docx|pdf)$).*)",
  ],
};
