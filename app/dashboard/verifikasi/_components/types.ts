import type {
  EventActivity,
  ParticipantRegistration,
  Requirement,
  CadreFollowUp,
  CadreSubmission,
  UserAccount
} from "@/lib/db";

export interface EventParticipantProgress {
  id: string;
  registrationId: string;
  eventId: string;
  eventName: string;
  eventLevel: "MAPABA" | "PKD" | "PKL";
  cadreName: string;
  cadreEmail: string;
  phone: string;
  campus: string;
  dateApplied: string;
  regStatus: string;
  matchedCadre: CadreFollowUp | null;
  submissions: CadreSubmission[];
  applicableRequirements: Requirement[];
  status: "SELESAI" | "REVISI" | "AKTIF" | "BELUM_MULAI";
  progressPercent: number;
  approvedCount: number;
  totalRequirements: number;
  photoUrl: string | null;
}

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const formatDateTimeIndo = (dateTimeStr?: string) => {
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

export const getInitials = (name: string): string => {
  if (!name) return "KD";
  return (
    name
      .split(" ")
      .filter((w) => w.toLowerCase() !== "sahabat" && w.toLowerCase() !== "sahabati")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "KD"
  );
};

export const getParticipantPhoto = (
  cadre?: CadreFollowUp | null,
  reg?: ParticipantRegistration | null,
  userList: UserAccount[] = []
): string | null => {
  // 1. Check cadre avatar
  if (
    cadre?.avatar &&
    typeof cadre.avatar === "string" &&
    (cadre.avatar.startsWith("data:") || cadre.avatar.startsWith("http") || cadre.avatar.startsWith("/"))
  ) {
    return cadre.avatar;
  }

  // 2. Check cadre pasFotoName
  if (
    cadre?.pasFotoName &&
    typeof cadre.pasFotoName === "string" &&
    (cadre.pasFotoName.startsWith("data:") || cadre.pasFotoName.startsWith("http") || cadre.pasFotoName.startsWith("/"))
  ) {
    return cadre.pasFotoName;
  }

  // 3. Check registration answers (file answers or base64)
  if (reg?.answers && typeof reg.answers === "object") {
    const photoKeys = [
      "f-foto",
      "foto",
      "pasFoto",
      "pas_foto",
      "pasFotoName",
      "avatar",
      "photo",
      "image",
      "fileFoto",
      "foto_peserta"
    ];
    for (const k of photoKeys) {
      const v = (reg.answers as any)[k];
      if (typeof v === "string" && (v.startsWith("data:") || v.startsWith("http") || v.startsWith("/"))) {
        return v;
      }
      if (v && typeof v === "object") {
        const nested = v.url || v.fileUrl || v.dataUrl || v.base64;
        if (typeof nested === "string" && (nested.startsWith("data:") || nested.startsWith("http") || nested.startsWith("/"))) {
          return nested;
        }
      }
    }
    // Scan all answers for image data
    for (const v of Object.values(reg.answers)) {
      if (
        typeof v === "string" &&
        (v.startsWith("data:image/") ||
          ((v.startsWith("http://") || v.startsWith("https://") || v.startsWith("/")) &&
            /\.(jpg|jpeg|png|webp|gif|svg)/i.test(v)))
      ) {
        return v;
      }
      if (v && typeof v === "object") {
        const nested = (v as any).url || (v as any).fileUrl || (v as any).dataUrl;
        if (
          typeof nested === "string" &&
          (nested.startsWith("data:image/") ||
            ((nested.startsWith("http://") || nested.startsWith("https://") || nested.startsWith("/")) &&
              /\.(jpg|jpeg|png|webp|gif|svg)/i.test(nested)))
        ) {
          return nested;
        }
      }
    }
  }

  // 4. Match with UserAccounts by email or name
  const email = (cadre?.email || reg?.cadreEmail || "").toLowerCase().trim();
  const name = (cadre?.name || reg?.cadreName || "").toLowerCase().trim();
  if (email || name) {
    const matchedUser = userList.find((u) => {
      const uEmail = (u.email || "").toLowerCase().trim();
      const uName = (u.name || "").toLowerCase().trim();
      return (email && uEmail && email === uEmail) || (name && uName && name === uName);
    });
    if (
      matchedUser?.avatar &&
      typeof matchedUser.avatar === "string" &&
      (matchedUser.avatar.startsWith("data:") ||
        matchedUser.avatar.startsWith("http") ||
        matchedUser.avatar.startsWith("/"))
    ) {
      return matchedUser.avatar;
    }
  }

  return null;
};
