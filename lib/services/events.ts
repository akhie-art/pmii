import { EventActivity, EventStageTimeline } from "./types";
import { KEYS } from "./defaults";
import { getTableData, saveTableData, normalizeKomisariat } from "./core";

export function getDefaultEventTimeline(event?: Partial<EventActivity>): EventStageTimeline {
  const isEventOpen = event?.status === "OPEN";
  const baseDate = event?.date ? new Date(event.date) : new Date();
  const isValidDate = !isNaN(baseDate.getTime());
  const actualBase = isValidDate ? baseDate : new Date();

  const regStart = new Date(actualBase);
  regStart.setDate(regStart.getDate() - 14);

  const regEnd = new Date(actualBase);
  regEnd.setDate(regEnd.getDate() - 3);

  const screenStart = new Date(actualBase);
  screenStart.setDate(screenStart.getDate() - 2);

  const screenEnd = new Date(actualBase);
  screenEnd.setDate(screenEnd.getDate() - 1);

  const evStart = new Date(actualBase);

  const evEnd = new Date(actualBase);
  evEnd.setDate(evEnd.getDate() + 2);

  const gradDate = new Date(evEnd);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    registration: { isOpen: isEventOpen },
    forum: { isOpen: true },
    rtl: { isOpen: true },
    certification: { isOpen: true },
    registrationStart: formatDate(regStart),
    registrationEnd: formatDate(regEnd),
    screeningStart: formatDate(screenStart),
    screeningEnd: formatDate(screenEnd),
    eventStart: formatDate(evStart),
    eventEnd: formatDate(evEnd),
    graduationDate: formatDate(gradDate),
    activeStage: "REGISTRATION"
  };
}

export async function getEvents(defaultData: EventActivity[] = []): Promise<EventActivity[]> {
  const list = await getTableData<EventActivity>("kegiatan", KEYS.EVENTS, defaultData);
  let hadLegacy = false;
  const cleaned = (list || [])
    .filter((e) => {
      const isLegacy = ["act-mapaba-2026", "act-pkd-2026"].includes(e.id);
      if (isLegacy) hadLegacy = true;
      return !isLegacy;
    })
    .map((e) => {
      const sessions = (e.sessions || []).filter(
        (s) =>
          !s.includes("Sejarah & Ke-PMII-an") &&
          !s.includes("Analisis Sosial & Kebijakan Publik") &&
          !s.includes("Sesi Registrasi Awal")
      );
      if (sessions.length !== (e.sessions || []).length) {
        hadLegacy = true;
      }
      const waMatch = typeof e.description === "string" ? e.description.match(/<!--\s*WA_LINK:(.*?)\s*-->/) : null;
      const waGroupLink = e.waGroupLink || (waMatch ? waMatch[1]?.trim() : undefined);
      const cleanDescription = typeof e.description === "string" 
        ? e.description.replace(/\s*<!--\s*WA_LINK:.*?\s*-->/g, "").trim()
        : e.description;

      return {
        ...e,
        timeline: e.timeline || getDefaultEventTimeline(e),
        description: cleanDescription,
        waGroupLink,
        sessions,
        formFields: e.formFields || (e as any).formfields || [],
        commissariat: normalizeKomisariat(e.commissariat),
      };
    });

  if (hadLegacy && typeof window !== "undefined") {
    try {
      localStorage.setItem(KEYS.EVENTS, JSON.stringify(cleaned));
    } catch (err) {
      console.warn("Failed to sync cleaned events to localStorage", err);
    }
  }
  return cleaned;
}

export async function saveEvents(eventsList: EventActivity[]): Promise<boolean> {
  const normalized = eventsList.map(e => {
    const { formFields, ...rest } = e as any;
    const cleanDescription = typeof e.description === "string"
      ? e.description.replace(/\s*<!--\s*WA_LINK:.*?\s*-->/g, "").trim()
      : (e.description || "");
    return {
      ...rest,
      timeline: e.timeline || getDefaultEventTimeline(e),
      description: cleanDescription,
      waGroupLink: e.waGroupLink || null,
      created_at: (e as any).created_at || new Date().toISOString(),
      commissariat: normalizeKomisariat(e.commissariat)
    };
  });
  return saveTableData<EventActivity>("kegiatan", KEYS.EVENTS, normalized as any);
}
