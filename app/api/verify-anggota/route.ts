import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Kata kunci pencarian minimal 2 karakter" },
        { status: 400 }
      );
    }

    const queryLower = query.toLowerCase();
    const anggotaList = await db.getAnggota();

    const matches = anggotaList.filter(
      (c: any) =>
        (c.name && String(c.name).toLowerCase().includes(queryLower)) ||
        (c.nim && String(c.nim).toLowerCase().includes(queryLower)) ||
        (c.nik && String(c.nik).toLowerCase() === queryLower) ||
        (c.id && String(c.id).toLowerCase() === queryLower)
    );

    if (matches.length === 0) {
      return NextResponse.json({ found: false, results: [] });
    }

    const mappedResults = matches.slice(0, 5).map((match: any) => ({
      name: match.name,
      level: match.level || "Anggota",
      commissariat: match.commissariat || "PC PMII Grobogan",
      status: match.status || "Aktif",
    }));

    // Hanya kembalikan data publik yang aman untuk verifikasi
    return NextResponse.json({
      found: true,
      anggota: mappedResults[0],
      cadre: mappedResults[0],
      results: mappedResults,
      totalMatches: matches.length,
    });
  } catch (error) {
    console.error("[API Verify Anggota Error]:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi anggota" },
      { status: 500 }
    );
  }
}
