export interface BoardMember {
  id: string;
  name: string;
  position: string;
  department: string;
  gender: "Sahabat" | "Sahabati";
  email: string;
  phone: string;
  status: "AKTIF" | "DEMISIONER";
  period: string;
  commissariat?: string;
  avatar?: string;
}

export const DEFAULT_DIVISIONS = [
  "Kaderisasi",
  "Keagamaan & Dakwah",
  "Advokasi & Humas",
  "Minat, Bakat & Seni"
];

export const getInitials = (name: string): string => {
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

export const getSystemPeriod = (): string => {
  if (typeof window === "undefined") return "2026 - 2027";
  try {
    const saved = localStorage.getItem("PMII_SYSTEM_SETTINGS");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.organization?.period) {
        return parsed.organization.period;
      }
    }
  } catch (e) {
    console.error("Failed to read system period", e);
  }
  return "2026 - 2027";
};
