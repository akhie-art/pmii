import type {
  EventActivity,
  ParticipantRegistration,
  Requirement,
  CertificateLayoutConfig,
  CertificateFieldConfig
} from "@/lib/db";

export type {
  EventActivity,
  ParticipantRegistration,
  Requirement,
  CertificateLayoutConfig,
  CertificateFieldConfig
};

export const formatDateTimeIndo = (dateTimeStr?: string): string | null => {
  if (!dateTimeStr) return null;
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return (
      d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) + " WIB"
    );
  } catch {
    return dateTimeStr;
  }
};

export const formatDateIndo = (dateStr?: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
};

export const formatEventDateIndo = (dateStr?: string): string => {
  if (!dateStr) return "Jadwal menyusul";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric"
        });
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

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

