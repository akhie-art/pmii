import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidUUID } from "@/lib/utils";
import { verifySuratByIdServer } from "@/lib/verify-surat-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`verify-surat:${ip}`, { limit: 30, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json(
        { valid: false, error: "Terlalu banyak permintaan verifikasi. Coba lagi beberapa saat." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds),
            "X-RateLimit-Remaining": "0",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const id = (request.nextUrl.searchParams.get("id") || "").trim();
    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { valid: false, error: "Kode verifikasi surat tidak valid." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const result = await verifySuratByIdServer(id);

    if (result.status === "unconfigured") {
      return NextResponse.json(
        { valid: false, unconfigured: true },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (result.status === "error") {
      return NextResponse.json(
        { valid: false, error: "Gagal memverifikasi keaslian surat." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (result.status !== "valid" || !result.letter) {
      return NextResponse.json(
        { valid: false },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-RateLimit-Remaining": String(rate.remaining),
          },
        }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        letter: result.letter,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Remaining": String(rate.remaining),
        },
      }
    );
  } catch (err) {
    console.warn("[API Verify Surat Notice]:", err);
    return NextResponse.json(
      { valid: false, error: "Terjadi kesalahan saat memverifikasi surat." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
