import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isUserAdmin,
  isUserInstruktur,
  isUserPengurus,
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

const MEMBER_PREFIXES = ["/anggota", "/kader", "/peserta", "/onboarding"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
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
    return applySecurityHeaders(response);
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
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Baca peran otoritatif dari app_metadata (tidak bisa dimodifikasi user dari klien)
  const rawRole = String(
    user.app_metadata?.role || user.user_metadata?.role || "anggota"
  )
    .toLowerCase()
    .trim();

  const isAdmin = isUserAdmin(rawRole);
  const isPengurus = isUserPengurus(rawRole);
  const isInstruktur = isUserInstruktur(rawRole);
  const isStaff = isAdmin || isPengurus || isInstruktur;

  if (isStaffRoute) {
    if (!isStaff) {
      const target = rawRole === "peserta" ? "/peserta" : "/anggota";
      return applySecurityHeaders(NextResponse.redirect(new URL(target, request.url)));
    }

    const staffPrefix = getTargetStaffPrefix(rawRole);

    if (isInstruktur && (pathname.startsWith("/admin") || pathname.startsWith("/pengurus"))) {
      const rewritten = pathname.replace(/^\/(admin|pengurus)/, "/instruktur");
      return applySecurityHeaders(NextResponse.redirect(new URL(`${rewritten}${search}`, request.url)));
    }

    if (isPengurus && (pathname.startsWith("/admin") || pathname.startsWith("/instruktur"))) {
      const rewritten = pathname.replace(/^\/(admin|instruktur)/, "/pengurus");
      return applySecurityHeaders(NextResponse.redirect(new URL(`${rewritten}${search}`, request.url)));
    }

    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return applySecurityHeaders(NextResponse.redirect(new URL(staffPrefix, request.url)));
    }
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|docx|pdf)$).*)",
  ],
};
