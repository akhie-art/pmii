import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc("get_public_stats");
      if (!error && data) {
        return NextResponse.json({
          cadresCount: typeof data.cadresCount === "number" ? data.cadresCount : 0,
          tenantCounts: data.tenantCounts || {},
          stagesCount: data.stagesCount ?? 3,
          digitalArchivePercent: data.digitalArchivePercent ?? 100,
        });
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
