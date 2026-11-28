import { ParticipantRegistration } from "./types";
import { KEYS } from "./defaults";
import { getTableData, saveTableData } from "./core";
import { supabase, isSupabaseConfigured } from "../supabase";
import type { PaginatedResult } from "./anggota";

export interface RegistrationQueryParams {
  page?: number;
  pageSize?: number;
  eventId?: string;
  tenantId?: string | null;
  status?: string;
  search?: string;
}

export async function getRegistrations(
  defaultData: ParticipantRegistration[] = []
): Promise<ParticipantRegistration[]> {
  const data = await getTableData<ParticipantRegistration>("pendaftaran", KEYS.REGISTRATIONS, defaultData);
  const cleaned = data.filter(
    (item) => !["reg-101", "reg-102", "reg-103", "reg-104", "reg-105", "reg-106"].includes(item.id)
  );
  if (cleaned.length !== data.length && typeof window !== "undefined") {
    try {
      localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(cleaned));
    } catch (e) {
      console.warn("Failed to sync cleaned registrations to localStorage", e);
    }
  }
  return cleaned;
}

/**
 * Query pendaftaran terpaginasi di sisi server menggunakan `.range()` & filter DB.
 */
export async function getRegistrationsPaginated(
  params: RegistrationQueryParams = {}
): Promise<PaginatedResult<ParticipantRegistration>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("pendaftaran")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.eventId && params.eventId !== "ALL") {
      query = query.eq("eventId", params.eventId);
    }
    if (params.tenantId) {
      query = query.eq("tenant_id", params.tenantId);
    }
    if (params.status && params.status !== "ALL") {
      query = query.eq("status", params.status);
    }
    if (params.search && params.search.trim()) {
      const safeQ = params.search.trim().replace(/[%_,]/g, "");
      if (safeQ) {
        query = query.or(
          `"cadreName".ilike.%${safeQ}%,"cadreEmail".ilike.%${safeQ}%,"registrationNumber".ilike.%${safeQ}%`
        );
      }
    }

    const { data, count, error } = await query.range(from, to);
    if (!error && Array.isArray(data)) {
      const total = count ?? data.length;
      return {
        data: data as ParticipantRegistration[],
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }
  }

  const all = await getRegistrations([]);
  const filtered = all.filter((r) => {
    if (params.eventId && params.eventId !== "ALL" && r.eventId !== params.eventId) return false;
    if (params.status && params.status !== "ALL" && r.status !== params.status) return false;
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      return (
        (r.cadreName || "").toLowerCase().includes(q) ||
        (r.cadreEmail || "").toLowerCase().includes(q) ||
        (r.registrationNumber || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return {
    data: filtered.slice(from, to + 1),
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

export async function saveRegistrations(regsList: ParticipantRegistration[]): Promise<boolean> {
  const normalized = regsList.map((r) => ({
    ...r,
    eventId: r.eventId,
    created_at: (r as ParticipantRegistration & { created_at?: string }).created_at || new Date().toISOString(),
  }));
  return saveTableData<ParticipantRegistration>("pendaftaran", KEYS.REGISTRATIONS, normalized);
}

/**
 * Delta upsert O(1) untuk 1 baris pendaftaran tanpa menimpa baris milik peserta/tenant lain
 * dan mencegah penolakan RLS batch upsert.
 */
export async function upsertRegistration(reg: ParticipantRegistration): Promise<boolean> {
  const normalized = {
    ...reg,
    eventId: String(reg.eventId || "").trim(),
    created_at:
      (reg as ParticipantRegistration & { created_at?: string }).created_at ||
      new Date().toISOString(),
  };
  return saveTableData<ParticipantRegistration>("pendaftaran", KEYS.REGISTRATIONS, [normalized], {
    allowDeletion: false,
    mergeLocalCache: true,
  });
}

export async function updateRegistration(
  id: string,
  updates: Partial<ParticipantRegistration>
): Promise<boolean> {
  const { updateTableRow } = await import("./core");
  return updateTableRow("pendaftaran", id, updates as Record<string, any>, KEYS.REGISTRATIONS);
}

export async function deleteRegistration(id: string): Promise<boolean> {
  const { deleteTableRow } = await import("./core");
  return deleteTableRow("pendaftaran", id, KEYS.REGISTRATIONS);
}
