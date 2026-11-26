import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`verify-anggota:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan verifikasi. Coba lagi beberapa saat." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Kata kunci pencarian minimal 2 karakter" },
        { status: 400 }
      );
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: "Kata kunci pencarian terlalu panjang" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ found: false, results: [] });
    }

    // Gunakan RPC publik sempit yang hanya mengembalikan 4 kolom aman (maks 5 hasil), tanpa menarik seluruh tabel anggota
    const { data, error } = await supabase.rpc("verify_anggota_public", {
      p_query: query,
    });

    if (error) {
      console.error("[API Verify Anggota RPC Error]:", error.message);
      return NextResponse.json(
        { error: "Terjadi kesalahan saat memverifikasi anggota" },
        { status: 500 }
      );
    }

    const mappedResults = Array.isArray(data) ? data : [];

    if (mappedResults.length === 0) {
      return NextResponse.json({ found: false, results: [] });
    }

    return NextResponse.json(
      {
        found: true,
        anggota: mappedResults[0],
        cadre: mappedResults[0],
        results: mappedResults,
        totalMatches: mappedResults.length,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(rate.remaining),
        },
      }
    );
  } catch (error) {
    console.error("[API Verify Anggota Error]:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi anggota" },
      { status: 500 }
    );
  }
}
