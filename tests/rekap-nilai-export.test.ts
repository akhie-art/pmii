import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
  getParticipantAllSessions,
  formatYudisiumStatus,
  buildRekapExportFilename,
  buildRekapNilaiWorkbook,
} from "@/app/dashboard/rekap-nilai/_components/rekapExportHelpers";
import type { EventActivity, ParticipantEvaluation } from "@/lib/db";

describe("Rekap Nilai Export Excel Helpers (1-Sheet Web-Matching Layout)", () => {
  const sampleActivity: EventActivity = {
    id: "act-1",
    name: "MAPABA Raya Komisariat Ajisaka 2026",
    description: "Masa Penerimaan Anggota Baru",
    date: "2026-11-20",
    location: "Aula Kampus STAI Grobogan",
    level: "MAPABA",
    status: "OPEN",
    commissariat: "Komisariat Ajisaka",
    sessions: ["1. Aswaja", "2. Ke-PMII-an", "3. Nilai Dasar Pergerakan"],
  };

  const sampleEvaluations: ParticipantEvaluation[] = [
    {
      id: "ev-1",
      activityId: "act-1",
      cadreId: "c-1",
      participantName: "Ahmad Fauzi",
      gender: "Laki-laki",
      university: "STAI Grobogan",
      commissariat: "Komisariat Ajisaka",
      level: "MAPABA",
      kognitif: 88,
      afektif: 90,
      psikomotorik: 86,
      finalScore: 88,
      grade: "A",
      status: "LULUS",
      preTestAverage: 72,
      postTestAverage: 92,
      notes: "Sangat aktif berdiskusi di forum.",
      careerAssessment: {
        mbtiCode: "ENTJ",
        talent: "Kepemimpinan Strategis",
        interest: "Advokasi & Organisasi",
        strategicRole: "Kaderisasi & Pengembangan SDM",
      },
      sessionScores: {
        Aswaja: {
          materiId: "m-1",
          materiTitle: "1. Aswaja",
          kognitif: 90,
          afektif: 92,
          psikomotorik: 88,
          score: 90,
          preTestScore: 70,
          postTestScore: 95,
          notes: "Paham konsep tawasuth.",
        },
        "Ke-PMII-an": {
          materiId: "m-2",
          materiTitle: "Ke-PMII-an",
          kognitif: 86,
          afektif: 88,
          psikomotorik: 84,
          score: 86,
        },
        __meta: {
          materiId: "meta",
          materiTitle: "__meta",
          kognitif: 0,
          afektif: 0,
          psikomotorik: 0,
        },
      },
      quizResults: {
        "2. Ke-PMII-an": { preTest: 74, postTest: 89 },
        __internal: { preTest: 0, postTest: 0 },
      },
    },
    {
      id: "ev-2",
      activityId: "act-1",
      cadreId: "c-2",
      participantName: "Siti Aminah",
      gender: "Perempuan",
      university: "STAI Grobogan",
      commissariat: "Komisariat Ajisaka",
      level: "MAPABA",
      kognitif: 0,
      afektif: 0,
      psikomotorik: 0,
      finalScore: 0,
      grade: "E",
      status: "BELUM_DINILAI",
      sessionScores: {},
    },
  ];

  it("merges curriculum sessions, sessionScores, and quizResults while ignoring __ metadata keys", () => {
    const sessions = getParticipantAllSessions(sampleEvaluations[0], sampleActivity.sessions);

    expect(sessions).toHaveLength(3);
    expect(sessions[0]).toMatchObject({
      title: "Aswaja",
      preTest: 70,
      postTest: 95,
      kognitif: 90,
      afektif: 92,
      psikomotorik: 88,
      score: 90,
      notes: "Paham konsep tawasuth.",
      isGraded: true,
    });
    expect(sessions[1]).toMatchObject({
      title: "Ke-PMII-an",
      preTest: 74,
      postTest: 89,
      score: 86,
      isGraded: true,
    });
    expect(sessions[2]).toMatchObject({
      title: "Nilai Dasar Pergerakan",
      isGraded: false,
    });
  });

  it("formats status labels and generates clean sanitized .xlsx filenames", () => {
    expect(formatYudisiumStatus("LULUS")).toBe("Lulus");
    expect(formatYudisiumStatus("LULUS_BERSYARAT")).toBe("Bersyarat");
    expect(formatYudisiumStatus("TIDAK_LULUS")).toBe("Tidak Lulus");
    expect(formatYudisiumStatus("BELUM_DINILAI")).toBe("Belum Dinilai");

    const fileName = buildRekapExportFilename(
      "MAPABA / PKD: Komisariat Ajisaka (2026)!",
      new Date("2026-11-25T00:00:00Z")
    );
    expect(fileName).toBe("Rekap_Nilai_Yudisium_MAPABA_PKD_Komisariat_Ajisaka_2026_2026-11-25.xlsx");
  });

  it("builds a 1-sheet .xlsx workbook matching YudisiumTable with vertical merges, per-materi rows, and Rata-rata Akumulasi", async () => {
    const wb = await buildRekapNilaiWorkbook({
      evaluations: sampleEvaluations,
      activity: sampleActivity,
      statusFilter: "SEMUA",
      searchQuery: "",
      exportedAt: new Date("2026-11-25T00:00:00Z"),
    });

    // Tepat 1 sheet
    expect(wb.worksheets).toHaveLength(1);
    const ws = wb.getWorksheet("Rekap Nilai Yudisium")!;
    expect(ws).toBeDefined();

    // Header di baris 4 (11 kolom sesuai tabel web tanpa kolom Detail)
    expect(ws.getRow(4).values).toEqual([
      undefined,
      "No",
      "Nama Peserta",
      "Materi / Sesi",
      "Pre-Test (1-100)",
      "Post-Test (1-100)",
      "Kognitif (30%)",
      "Afektif (35%)",
      "Motorik (35%)",
      "Skor (1-100)",
      "Predikat",
      "Status Kelulusan",
    ]);

    // Peserta #1: 3 materi + 1 Rata-rata Akumulasi = baris 5..8
    expect(ws.getCell("A5").value).toBe(1);
    expect(ws.getCell("B5").text).toContain("Ahmad Fauzi");
    expect(ws.getCell("B5").text).toContain("2/3 Materi Dinilai");
    expect(ws.getCell("B5").text).toContain("ENTJ");
    expect(ws.getCell("C5").value).toBe("Aswaja");
    expect(ws.getCell("D5").value).toBe(70);
    expect(ws.getCell("E5").value).toBe(95);
    expect(ws.getCell("F5").value).toBe(90);
    expect(ws.getCell("G5").value).toBe(92);
    expect(ws.getCell("H5").value).toBe(88);
    expect(ws.getCell("I5").value).toBe(90);
    expect(ws.getCell("J5").value).toBe("A");
    expect(ws.getCell("K5").value).toBe("Lulus");

    expect(ws.getCell("C6").value).toBe("Ke-PMII-an");
    expect(ws.getCell("I6").value).toBe(86);

    expect(ws.getCell("C7").value).toBe("Nilai Dasar Pergerakan");
    expect(ws.getCell("I7").value).toBe("-");

    // Baris Rata-rata Akumulasi Peserta #1 di baris 8
    expect(ws.getCell("C8").value).toBe("Rata-rata Akumulasi");
    expect(ws.getCell("D8").value).toBe(72);
    expect(ws.getCell("E8").value).toBe(92);
    expect(ws.getCell("F8").value).toBe(88);
    expect(ws.getCell("G8").value).toBe(90);
    expect(ws.getCell("H8").value).toBe(86);
    expect(ws.getCell("I8").value).toBe(88);

    // Pastikan sel A5:A8, B5:B8, J5:J8, K5:K8 ter-merge vertikal
    expect(ws.getCell("A8").master.address).toBe("A5");
    expect(ws.getCell("B8").master.address).toBe("B5");
    expect(ws.getCell("J8").master.address).toBe("J5");
    expect(ws.getCell("K8").master.address).toBe("K5");

    // Peserta #2 (BELUM_DINILAI): baris 9..12
    expect(ws.getCell("A9").value).toBe(2);
    expect(ws.getCell("B9").text).toContain("Siti Aminah");
    expect(ws.getCell("C12").value).toBe("Rata-rata Akumulasi");
    expect(ws.getCell("I12").value).toBe("-");
    expect(ws.getCell("J9").value).toBe("-");
    expect(ws.getCell("K9").value).toBe("Belum Dinilai");
    expect(ws.getCell("A12").master.address).toBe("A9");

    // Roundtrip serialize -> reload .xlsx buffer dengan ExcelJS
    const buf = await wb.xlsx.writeBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);

    const reloaded = new ExcelJS.Workbook();
    await reloaded.xlsx.load(buf as ArrayBuffer);
    const reloadedWs = reloaded.getWorksheet("Rekap Nilai Yudisium")!;
    expect(reloadedWs.rowCount).toBe(12);
    expect(reloadedWs.getCell("C8").value).toBe("Rata-rata Akumulasi");
    expect(reloadedWs.getCell("I8").value).toBe(88);
    expect(reloadedWs.getCell("A8").master.address).toBe("A5");
  });

  it("handles activities with zero sessions cleanly using fallback row without invalid merges", async () => {
    const noSessionActivity: EventActivity = { ...sampleActivity, sessions: [] };
    const wb = await buildRekapNilaiWorkbook({
      evaluations: [sampleEvaluations[1]],
      activity: noSessionActivity,
      exportedAt: new Date("2026-11-25T00:00:00Z"),
    });

    const ws = wb.getWorksheet("Rekap Nilai Yudisium")!;
    expect(ws.rowCount).toBe(5);
    expect(ws.getCell("A5").value).toBe(1);
    expect(ws.getCell("C5").value).toBe("Belum ada materi");
    expect(ws.getCell("K5").value).toBe("Belum Dinilai");
  });
});
