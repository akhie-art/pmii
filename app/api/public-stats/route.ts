import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cadres = await db.getCadres();
    return NextResponse.json({
      cadresCount: Array.isArray(cadres) ? cadres.length : 0,
      stagesCount: 3,
      digitalArchivePercent: 100,
    });
  } catch (error) {
    console.error("[API Public Stats Error]:", error);
    return NextResponse.json({
      cadresCount: 0,
      stagesCount: 3,
      digitalArchivePercent: 100,
    });
  }
}
