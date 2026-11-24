import { Anggota } from "./types";
import { KEYS } from "./defaults";
import { getTableData, saveTableData, normalizeKomisariat, normalizeDateString } from "./core";
import { supabase, isSupabaseConfigured } from "../supabase";
import { getTenantNameById } from "../tenancy";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AnggotaQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tenantId?: string | null;
  level?: string;
  status?: string;
}

function normalizeAnggotaRecord(c: Anggota): Anggota {
  const copy = { ...c };
  delete copy.password;
  const tid = copy.tenant_id || copy.komisariat_id;
  return {
    ...copy,
    tenant_id: tid,
    komisariat_id: tid,
    commissariat: copy.commissariat
      ? normalizeKomisariat(copy.commissariat)
      : (tid ? getTenantNameById(tid) || "" : ""),
  };
}

export async function getAnggota(defaultData: Anggota[] = []): Promise<Anggota[]> {
  let list = await getTableData<Anggota>("anggota", KEYS.CADRES, defaultData);
  list = list.filter(
    (c) =>
      c.id !== "cadre-1" &&
      c.id !== "cadre-2" &&
      c.id !== "user-anggota" &&
      c.id !== "user-peserta" &&
      c.name !== "Sahabat Anggota" &&
      c.name !== "Calon Anggota"
  );
  return list.map(normalizeAnggotaRecord);
}

/**
 * Query anggota terpaginasi di sisi server menggunakan `.range()` & filter DB (`.ilike()`, `.eq()`).
 */
export async function getAnggotaPaginated(
  params: AnggotaQueryParams = {}
): Promise<PaginatedResult<Anggota>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("anggota")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.tenantId) {
      query = query.eq("tenant_id", params.tenantId);
    }
    if (params.level && params.level !== "ALL") {
      query = query.eq("level", params.level);
    }
    if (params.status && params.status !== "ALL") {
      query = query.eq("status", params.status);
    }
    if (params.search && params.search.trim()) {
      const safeQ = params.search.trim().replace(/[%_,]/g, "");
      if (safeQ) {
        query = query.or(
          `name.ilike.%${safeQ}%,email.ilike.%${safeQ}%,nim.ilike.%${safeQ}%,nipa.ilike.%${safeQ}%,phone.ilike.%${safeQ}%`
        );
      }
    }

    const { data, count, error } = await query.range(from, to);
    if (!error && Array.isArray(data)) {
      const total = count ?? data.length;
      return {
        data: (data as Anggota[]).map(normalizeAnggotaRecord),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }
  }

  // Fallback jika offline / tidak terkonfigurasi
  const all = await getAnggota([]);
  const filtered = all.filter((c) => {
    if (params.tenantId && c.tenant_id !== params.tenantId && c.komisariat_id !== params.tenantId) {
      return false;
    }
    if (params.level && params.level !== "ALL" && c.level !== params.level) return false;
    if (params.status && params.status !== "ALL" && c.status !== params.status) return false;
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.nim || "").toLowerCase().includes(q) ||
        (c.nipa || "").toLowerCase().includes(q)
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

export async function saveAnggota(anggotaList: Anggota[]): Promise<boolean> {
  const normalized = anggotaList.map((c) => {
    const copy: Record<string, unknown> = { ...c };
    delete copy.password;
    return {
      ...copy,
      id: c.id,
      created_at: copy.created_at || new Date().toISOString(),
      commissariat: normalizeKomisariat(copy.commissariat as string | undefined),
      startDate: normalizeDateString(copy.startDate as string | undefined),
    };
  });
  return saveTableData("anggota", KEYS.CADRES, normalized);
}

export async function updateAnggota(id: string, updates: Partial<Anggota>): Promise<boolean> {
  const { updateTableRow } = await import("./core");
  const cleanUpdates = { ...updates };
  delete cleanUpdates.password;
  if (cleanUpdates.commissariat) {
    cleanUpdates.commissariat = normalizeKomisariat(cleanUpdates.commissariat);
  }
  if (cleanUpdates.startDate) {
    cleanUpdates.startDate = normalizeDateString(cleanUpdates.startDate) || undefined;
  }
  return updateTableRow("anggota", id, cleanUpdates, KEYS.CADRES);
}

export async function deleteAnggota(id: string): Promise<boolean> {
  const { deleteTableRow } = await import("./core");
  return deleteTableRow("anggota", id, KEYS.CADRES);
}

// Backward-compatible aliases for Cadres
export const getCadres = getAnggota;
export const saveCadres = saveAnggota;
export const updateCadre = updateAnggota;
export const deleteCadre = deleteAnggota;
