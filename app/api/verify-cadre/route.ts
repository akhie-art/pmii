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
    const cadres = await db.getCadres();

    const match = cadres.find(
      (c) =>
        (c.name && c.name.toLowerCase().includes(queryLower)) ||
        (c.id && c.id.toLowerCase() === queryLower)
    );

    if (!match) {
      return NextResponse.json({ found: false });
    }

    // Hanya kembalikan data publik yang aman untuk verifikasi
    return NextResponse.json({
      found: true,
      cadre: {
        name: match.name,
        level: match.level || "Anggota",
        commissariat: match.commissariat || "PC PMII Grobogan",
        status: match.status || "Aktif",
      },
    });
  } catch (error) {
    console.error("[API Verify Cadre Error]:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi kader" },
      { status: 500 }
    );
  }
}
