import type { KaderisasiLevel, SyllabusItem, MaterialFile, QuizQuestion } from "@/lib/db";

export type LevelId = "MAPABA" | "PKD" | "PKL" | "PKN";

export const LEVEL_ORDER: Record<LevelId, number> = {
  MAPABA: 1,
  PKD: 2,
  PKL: 3,
  PKN: 4,
};

export interface LevelMeta {
  id: LevelId;
  order: number;
  title: string;
  fullName: string;
  scope: string;
  badgeColor: string;
  accentColor: string;
  description: string;
}

export const LEVEL_METAS: Record<LevelId, LevelMeta> = {
  MAPABA: {
    id: "MAPABA",
    order: 1,
    title: "MAPABA",
    fullName: "Masa Penerimaan Anggota Baru",
    scope: "Tingkat Rayon / Komisariat",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    accentColor: "from-blue-600 to-indigo-600",
    description: "Fase orientasi dan penanaman komitmen nilai dasar pergerakan PMII.",
  },
  PKD: {
    id: "PKD",
    order: 2,
    title: "PKD",
    fullName: "Pelatihan Kader Dasar",
    scope: "Tingkat Komisariat / Cabang",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    accentColor: "from-emerald-600 to-teal-600",
    description: "Fase pembentukan kader militan berintegritas ideologis dan keorganisasian.",
  },
  PKL: {
    id: "PKL",
    order: 3,
    title: "PKL",
    fullName: "Pelatihan Kader Lanjut",
    scope: "Tingkat Cabang / Korcab",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    accentColor: "from-amber-600 to-orange-600",
    description: "Fase kepemimpinan strategis, analisis sosial-politik dan kapasitas gerakan.",
  },
  PKN: {
    id: "PKN",
    order: 4,
    title: "PKN",
    fullName: "Pelatihan Kader Nasional",
    scope: "Tingkat Pengurus Besar (PB)",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    accentColor: "from-purple-600 to-pink-600",
    description: "Fase perumusan gagasan kebangsaan, transformasi global dan kepemimpinan nasional.",
  },
};

export interface FileItem {
  name: string;
  size?: string;
  url?: string;
  type?: string;
}

export function getFileTypeBadge(fileName: string): { label: string; color: string } {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") {
    return { label: "PDF", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
  }
  if (["doc", "docx"].includes(ext)) {
    return { label: "DOC", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
  }
  if (["ppt", "pptx"].includes(ext)) {
    return { label: "SLIDE", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" };
  }
  if (["xls", "xlsx"].includes(ext)) {
    return { label: "EXCEL", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
  }
  return { label: "FILE", color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20" };
}
