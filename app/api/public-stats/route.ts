import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rate = checkRateLimit(`public-stats:${ip}`, { limit: 60, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        }
      );
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc("get_public_stats");
      if (!error && data) {
        return NextResponse.json(
          {
            cadresCount: typeof data.cadresCount === "number" ? data.cadresCount : 0,
            tenantCounts: data.tenantCounts || {},
            stagesCount: data.stagesCount ?? 3,
            digitalArchivePercent: data.digitalArchivePercent ?? 100,
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
            },
          }
        );
      }
    }

    return NextResponse.json({
      cadresCount: 0,
      tenantCounts: {},
      stagesCount: 3,
      digitalArchivePercent: 100,
    });
  } catch (error) {
    console.error("[API Public Stats Error]:", error);
    return NextResponse.json({
      cadresCount: 0,
      tenantCounts: {},
      stagesCount: 3,
      digitalArchivePercent: 100,
    });
  }
}
