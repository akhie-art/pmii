import type ExcelJS from "exceljs";
import type { ParticipantEvaluation, EventActivity } from "@/lib/db";

export interface ParticipantSessionRow {
  title: string;
  preTest?: number;
  postTest?: number;
  kognitif?: number;
  afektif?: number;
  psikomotorik?: number;
  score?: number;
  notes?: string;
  isGraded: boolean;
}

export function getParticipantAllSessions(
  item: ParticipantEvaluation,
  activitySessions?: string[]
): ParticipantSessionRow[] {
  const sessionMap = new Map<string, ParticipantSessionRow>();

  // 1. Pre-populate from planned activity sessions in curriculum order
  if (activitySessions && activitySessions.length > 0) {
    activitySessions.forEach((s) => {
      const clean = s.replace(/^\d+\.\s*/, "").trim();
      if (!clean) return;
      sessionMap.set(clean, {
        title: clean,
        isGraded: false,
      });
    });
  }

  // 2. Populate scores from item.sessionScores
  if (item.sessionScores && typeof item.sessionScores === "object") {
    Object.entries(item.sessionScores).forEach(([materi, rawSession]) => {
      if (materi.startsWith("__")) return;
      const s = rawSession as Partial<{
        materiTitle: string;
        kognitif: number;
        afektif: number;
        psikomotorik: number;
        score: number;
        preTestScore: number;
        postTestScore: number;
        notes: string;
      }>;
      const clean = (s?.materiTitle || materi).replace(/^\d+\.\s*/, "").trim();
      if (!clean) return;
      const existing: ParticipantSessionRow = sessionMap.get(clean) || {
        title: clean,
        isGraded: false,
      };

      const hasKog = typeof s?.kognitif === "number" && !Number.isNaN(s.kognitif);
      const hasAfk = typeof s?.afektif === "number" && !Number.isNaN(s.afektif);
      const hasPsi = typeof s?.psikomotorik === "number" && !Number.isNaN(s.psikomotorik);
      const hasScore = typeof s?.score === "number" && !Number.isNaN(s.score);

      existing.kognitif = hasKog ? s.kognitif : existing.kognitif;
      existing.afektif = hasAfk ? s.afektif : existing.afektif;
      existing.psikomotorik = hasPsi ? s.psikomotorik : existing.psikomotorik;
      existing.score = hasScore ? s.score : existing.score;
      if (hasKog || hasAfk || hasPsi || hasScore) {
        existing.isGraded = true;
      }

      if (typeof s?.preTestScore === "number" && !Number.isNaN(s.preTestScore)) {
        existing.preTest = s.preTestScore;
      }
      if (typeof s?.postTestScore === "number" && !Number.isNaN(s.postTestScore)) {
        existing.postTest = s.postTestScore;
      }
      if (typeof s?.notes === "string" && s.notes.trim()) {
        existing.notes = s.notes.trim();
      }

      sessionMap.set(clean, existing);
    });
  }

  // 3. Populate quiz scores from item.quizResults
  if (item.quizResults && typeof item.quizResults === "object") {
    Object.entries(item.quizResults).forEach(([materi, rawQuiz]) => {
      if (materi.startsWith("__")) return;
      const q = rawQuiz as Partial<{ preTest: number; postTest: number }>;
      const clean = materi.replace(/^\d+\.\s*/, "").trim();
      if (!clean) return;
      const existing: ParticipantSessionRow = sessionMap.get(clean) || {
        title: clean,
        isGraded: false,
      };

      if (typeof q?.preTest === "number" && !Number.isNaN(q.preTest)) {
        existing.preTest = q.preTest;
      }
      if (typeof q?.postTest === "number" && !Number.isNaN(q.postTest)) {
        existing.postTest = q.postTest;
      }

      sessionMap.set(clean, existing);
    });
  }

  return Array.from(sessionMap.values());
}

export function formatYudisiumStatus(status?: string): string {
  switch (status) {
    case "LULUS":
      return "Lulus";
    case "LULUS_BERSYARAT":
      return "Bersyarat";
    case "TIDAK_LULUS":
      return "Tidak Lulus";
    case "BELUM_DINILAI":
      return "Belum Dinilai";
    default:
      return status || "Belum Dinilai";
  }
}

export function buildRekapExportFilename(
  activityName?: string | null,
  date: Date = new Date()
): string {
  const dateStr = date.toISOString().split("T")[0];
  const slug = (activityName || "Kegiatan")
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);

  return `Rekap_Nilai_Yudisium_${slug || "Kegiatan"}_${dateStr}.xlsx`;
}

export interface RekapExcelExportParams {
  evaluations: ParticipantEvaluation[];
  activity: EventActivity | null;
  statusFilter?: string;
  searchQuery?: string;
  exportedAt?: Date;
}

const THIN_BORDER_COLOR = { argb: "FFE4E4E7" };
const BLOCK_BOTTOM_BORDER_COLOR = { argb: "FFA1A1AA" };
const SUMMARY_TOP_BORDER_COLOR = { argb: "FFBFDBFE" };

const TABLE_HEADERS = [
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
];

const COLUMN_WIDTHS = [6, 34, 30, 15, 15, 15, 15, 15, 14, 11, 17];

function getGradeStyle(grade?: string, isEvaluated?: boolean): {
  bgArgb: string;
  textArgb: string;
} {
  if (!isEvaluated) return { bgArgb: "FFFFFFFF", textArgb: "FFA1A1AA" };
  switch (grade) {
    case "A":
      return { bgArgb: "FFECFDF5", textArgb: "FF065F46" };
    case "B":
      return { bgArgb: "FFEFF6FF", textArgb: "FF1E40AF" };
    case "C":
      return { bgArgb: "FFFFFBEB", textArgb: "FF92400E" };
    case "D":
      return { bgArgb: "FFFFF7ED", textArgb: "FF9A3412" };
    default:
      return { bgArgb: "FFFFF1F2", textArgb: "FF9F1239" };
  }
}

function getStatusStyle(status?: string): {
  bgArgb: string;
  textArgb: string;
} {
  switch (status) {
    case "LULUS":
      return { bgArgb: "FFECFDF5", textArgb: "FF047857" };
    case "LULUS_BERSYARAT":
      return { bgArgb: "FFFFFBEB", textArgb: "FFB45309" };
    case "TIDAK_LULUS":
      return { bgArgb: "FFFFF1F2", textArgb: "FFBE123C" };
    default:
      return { bgArgb: "FFFAFAFA", textArgb: "FF71717A" };
  }
}

function buildParticipantRichText(
  item: ParticipantEvaluation,
  activity: EventActivity | null,
  gradedCount: number,
  totalSessions: number
): ExcelJS.CellRichTextValue {
  const gender = item.gender || "-";
  const commissariat = item.commissariat || activity?.commissariat || "-";
  const university = item.university || "-";
  const materiLabel =
    totalSessions > 0 ? `${gradedCount}/${totalSessions} Materi Dinilai` : `${gradedCount} Materi`;
  const mbtiSuffix = item.careerAssessment?.mbtiCode
    ? ` • MBTI: ${item.careerAssessment.mbtiCode}`
    : "";

  return {
    richText: [
      {
        font: { name: "Calibri", size: 10, bold: true, color: { argb: "FF18181B" } },
        text: `${item.participantName || "-"}\n`,
      },
      {
        font: { name: "Calibri", size: 9, color: { argb: "FF71717A" } },
        text: `${gender} • ${commissariat}\n${university}\n`,
      },
      {
        font: { name: "Calibri", size: 9, bold: true, color: { argb: "FF2563EB" } },
        text: `${materiLabel}${mbtiSuffix}`,
      },
    ],
  };
}

/**
 * Membangun 1-sheet ExcelJS Workbook yang strukturnya persis dengan tabel Yudisium di web:
 * - Kolom No, Nama Peserta, Predikat, dan Status Kelulusan di-merge vertikal per peserta
 * - Sub-baris per materi / sesi
 * - Baris "Rata-rata Akumulasi" di bagian bawah setiap blok peserta
 */
export async function buildRekapNilaiWorkbook({
  evaluations,
  activity,
  statusFilter = "SEMUA",
  searchQuery = "",
  exportedAt = new Date(),
}: RekapExcelExportParams): Promise<ExcelJS.Workbook> {
  const ExcelJSModule = (await import("exceljs")).default;
  const workbook = new ExcelJSModule.Workbook();
  workbook.creator = "PMII Digital Platform";
  workbook.created = exportedAt;

  const ws = workbook.addWorksheet("Rekap Nilai Yudisium", {
    views: [{ state: "frozen", ySplit: 4 }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // Set column widths
  COLUMN_WIDTHS.forEach((width, idx) => {
    ws.getColumn(idx + 1).width = width;
  });

  // Row 1: Judul Utama
  ws.mergeCells("A1:K1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `REKAPITULASI NILAI & YUDISIUM${activity?.name ? ` — ${activity.name.toUpperCase()}` : ""}`;
  titleCell.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FF0A2A5C" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 26;

  // Row 2: Subjudul Metadata Kegiatan & Filter
  const metaParts: string[] = [];
  if (activity?.commissariat) metaParts.push(activity.commissariat);
  if (activity?.level) metaParts.push(`Jenjang: ${activity.level}`);
  if (activity?.date) metaParts.push(`Tanggal: ${activity.date}`);
  if (statusFilter && statusFilter !== "SEMUA") {
    metaParts.push(`Filter Status: ${formatYudisiumStatus(statusFilter)}`);
  }
  if (searchQuery.trim()) {
    metaParts.push(`Pencarian: "${searchQuery.trim()}"`);
  }
  metaParts.push(`Diekspor: ${exportedAt.toISOString().split("T")[0]}`);

  ws.mergeCells("A2:K2");
  const subtitleCell = ws.getCell("A2");
  subtitleCell.value = metaParts.join("  •  ");
  subtitleCell.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF52525B" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 18;

  // Row 3: Spacer
  ws.getRow(3).height = 8;

  // Row 4: Table Header (11 kolom sesuai tabel web tanpa kolom aksi Detail)
  const headerRow = ws.getRow(4);
  headerRow.values = TABLE_HEADERS;
  headerRow.height = 28;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0A2A5C" },
    };
    cell.alignment = {
      horizontal: colNumber === 2 || colNumber === 3 ? "left" : "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0A2A5C" } },
      bottom: { style: "medium", color: { argb: "FF0A2A5C" } },
      left: { style: "thin", color: { argb: "FF1E3A8A" } },
      right: { style: "thin", color: { argb: "FF1E3A8A" } },
    };
  });

  // Row 5+: Blok data tiap peserta (merge vertikal + sub-baris materi + baris Rata-rata Akumulasi)
  let currentRowNum = 5;

  evaluations.forEach((item, index) => {
    const isEvaluated = item.status !== "BELUM_DINILAI";
    const sessions = getParticipantAllSessions(item, activity?.sessions);
    const hasSessions = sessions.length > 0;
    const totalRows = hasSessions ? sessions.length + 1 : 1;
    const gradedCount = sessions.filter((s) => s.isGraded).length;
    const totalSessions = activity?.sessions?.length || sessions.length;

    const startRow = currentRowNum;
    const endRow = startRow + totalRows - 1;
    const gradeStyle = getGradeStyle(item.grade, isEvaluated);
    const statusStyle = getStatusStyle(item.status);
    const participantCellValue = buildParticipantRichText(item, activity, gradedCount, totalSessions);
    const gradeValue = isEvaluated ? item.grade || "-" : "-";
    const statusLabel = formatYudisiumStatus(item.status);

    const minPerRowHeight = totalRows < 4 ? Math.ceil(66 / totalRows) : 21;

    if (hasSessions) {
      // Sub-baris per materi
      sessions.forEach((session, sIdx) => {
        const row = ws.getRow(currentRowNum);
        row.height = Math.max(21, minPerRowHeight);

        row.values = [
          sIdx === 0 ? index + 1 : null,
          sIdx === 0 ? participantCellValue : null,
          session.title,
          session.preTest !== undefined ? session.preTest : "-",
          session.postTest !== undefined ? session.postTest : "-",
          session.kognitif !== undefined ? session.kognitif : "-",
          session.afektif !== undefined ? session.afektif : "-",
          session.psikomotorik !== undefined ? session.psikomotorik : "-",
          session.score !== undefined ? session.score : "-",
          sIdx === 0 ? gradeValue : null,
          sIdx === 0 ? statusLabel : null,
        ];

        for (let col = 1; col <= 11; col++) {
          const cell = row.getCell(col);
          cell.font = {
            name: "Calibri",
            size: 10,
            bold: col === 3 || col === 9,
            color: {
              argb:
                col === 4 && session.preTest !== undefined
                  ? "FFB45309"
                  : col === 5 && session.postTest !== undefined
                  ? "FF047857"
                  : col >= 4 && col <= 9 && cell.value === "-"
                  ? "FFA1A1AA"
                  : "FF27272A",
            },
          };

          if (col === 4 && session.preTest !== undefined) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } };
          } else if (col === 5 && session.postTest !== undefined) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
          }

          cell.alignment = {
            horizontal: col === 2 || col === 3 ? "left" : "center",
            vertical: col === 1 || col === 2 ? "top" : "middle",
            wrapText: col === 2 || col === 3,
          };

          cell.border = {
            top: { style: "thin", color: THIN_BORDER_COLOR },
            bottom: { style: "thin", color: THIN_BORDER_COLOR },
            left: { style: "thin", color: THIN_BORDER_COLOR },
            right: { style: "thin", color: THIN_BORDER_COLOR },
          };
        }

        currentRowNum++;
      });

      // Baris Ringkasan: Rata-rata Akumulasi
      const summaryRow = ws.getRow(currentRowNum);
      summaryRow.height = Math.max(23, minPerRowHeight);

      summaryRow.values = [
        null,
        null,
        "Rata-rata Akumulasi",
        typeof item.preTestAverage === "number" ? item.preTestAverage : "-",
        typeof item.postTestAverage === "number" ? item.postTestAverage : "-",
        isEvaluated ? item.kognitif : "-",
        isEvaluated ? item.afektif : "-",
        isEvaluated ? item.psikomotorik : "-",
        isEvaluated ? item.finalScore : "-",
        null,
        null,
      ];

      for (let col = 1; col <= 11; col++) {
        const cell = summaryRow.getCell(col);
        if (col >= 3 && col <= 9) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEFF6FF" },
          };
          cell.font = {
            name: "Calibri",
            size: col === 9 ? 11 : 10,
            bold: true,
            color: {
              argb:
                col === 3 || col === 9
                  ? "FF1D4ED8"
                  : col === 4 && typeof item.preTestAverage === "number"
                  ? "FF92400E"
                  : col === 5 && typeof item.postTestAverage === "number"
                  ? "FF065F46"
                  : cell.value === "-"
                  ? "FFA1A1AA"
                  : "FF18181B",
            },
          };
          cell.alignment = {
            horizontal: col === 3 ? "left" : "center",
            vertical: "middle",
            wrapText: col === 3,
          };
        }

        cell.border = {
          top: {
            style: "thin",
            color: col >= 3 && col <= 9 ? SUMMARY_TOP_BORDER_COLOR : THIN_BORDER_COLOR,
          },
          bottom: { style: "medium", color: BLOCK_BOTTOM_BORDER_COLOR },
          left: { style: "thin", color: THIN_BORDER_COLOR },
          right: { style: "thin", color: THIN_BORDER_COLOR },
        };
      }

      // Merge vertikal kolom No (A), Nama Peserta (B), Predikat (J), Status Kelulusan (K)
      ws.mergeCells(startRow, 1, endRow, 1);
      ws.mergeCells(startRow, 2, endRow, 2);
      ws.mergeCells(startRow, 10, endRow, 10);
      ws.mergeCells(startRow, 11, endRow, 11);

      currentRowNum++;
    } else {
      // Fallback row jika kegiatan belum memiliki materi
      const row = ws.getRow(currentRowNum);
      row.height = 64;

      row.values = [
        index + 1,
        participantCellValue,
        "Belum ada materi",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        gradeValue,
        statusLabel,
      ];

      for (let col = 1; col <= 11; col++) {
        const cell = row.getCell(col);
        cell.font = {
          name: "Calibri",
          size: 10,
          italic: col === 3,
          color: { argb: col >= 3 && col <= 9 ? "FFA1A1AA" : "FF27272A" },
        };
        cell.alignment = {
          horizontal: col === 2 || col === 3 ? "left" : "center",
          vertical: col === 1 || col === 2 ? "top" : "middle",
          wrapText: col === 2 || col === 3,
        };
        cell.border = {
          top: { style: "thin", color: THIN_BORDER_COLOR },
          bottom: { style: "medium", color: BLOCK_BOTTOM_BORDER_COLOR },
          left: { style: "thin", color: THIN_BORDER_COLOR },
          right: { style: "thin", color: THIN_BORDER_COLOR },
        };
      }

      currentRowNum++;
    }

    // Styling konsisten untuk sel spanning: No, Nama Peserta, Predikat, Status Kelulusan
    const noCell = ws.getCell(startRow, 1);
    noCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF71717A" } };
    noCell.alignment = { horizontal: "center", vertical: "top" };

    const nameCell = ws.getCell(startRow, 2);
    nameCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };

    const gradeCell = ws.getCell(startRow, 10);
    gradeCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: gradeStyle.textArgb } };
    gradeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: gradeStyle.bgArgb } };
    gradeCell.alignment = { horizontal: "center", vertical: "middle" };

    const statusCell = ws.getCell(startRow, 11);
    statusCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: statusStyle.textArgb } };
    statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusStyle.bgArgb } };
    statusCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  return workbook;
}

export async function exportRekapNilaiToExcel(
  params: RekapExcelExportParams
): Promise<{ fileName: string; rowCount: number }> {
  const fileName = buildRekapExportFilename(params.activity?.name, params.exportedAt);
  const workbook = await buildRekapNilaiWorkbook(params);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { fileName, rowCount: params.evaluations.length };
}
