import { ParticipantRegistration } from "./types";
import { KEYS, DEFAULT_REGISTRATIONS } from "./defaults";
import { getTableData, saveTableData } from "./core";

export async function getRegistrations(
  defaultData: ParticipantRegistration[] = DEFAULT_REGISTRATIONS
): Promise<ParticipantRegistration[]> {
  const data = await getTableData<ParticipantRegistration>("pendaftaran", KEYS.REGISTRATIONS, defaultData);
  const cleaned = data.filter(item => !["reg-101", "reg-102", "reg-103", "reg-104", "reg-105", "reg-106"].includes(item.id));
  if (cleaned.length !== data.length && typeof window !== "undefined") {
    try {
      localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(cleaned));
    } catch (e) {
      console.warn("Failed to sync cleaned registrations to localStorage", e);
    }
  }
  return cleaned;
}

export async function saveRegistrations(regsList: ParticipantRegistration[]): Promise<boolean> {
  const normalized = regsList.map(r => ({
    ...r,
    eventId: r.eventId,
    created_at: (r as any).created_at || new Date().toISOString()
  }));
  return saveTableData<ParticipantRegistration>("pendaftaran", KEYS.REGISTRATIONS, normalized);
}
