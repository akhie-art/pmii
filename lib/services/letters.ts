import { getTableData, saveTableData, deleteTableRow, updateTableRow } from "./core";
import { KEYS } from "./defaults";
import { SuratTemplate } from "./types";
import { supabase, isSupabaseConfigured, deleteStorageFile } from "../supabase";
import { getTenantNameById } from "../tenancy";
import type { PaginatedResult } from "./anggota";

export interface SuratQueryParams {
  page?: number;
  pageSize?: number;
  type?: "MASUK" | "KELUAR" | "ALL";
  tenantId?: string | null;
  classification?: string;
  status?: string;
  search?: string;
}

function hydrateTenantFields<T extends Record<string, any>>(item: T): T {
  const tid = item.tenant_id || item.komisariat_id;
  return {
    ...item,
    tenant_id: tid,
    komisariat_id: tid,
    commissariat: item.commissariat || (tid ? getTenantNameById(tid) : "Pengurus Cabang Grobogan"),
  };
}

export async function getSurat(): Promise<any[]> {
  return getTableData<any>("surat", KEYS.SURAT);
}

/**
 * Query arsip surat terpaginasi di sisi server menggunakan `.range()` & `count: "exact"`
 * untuk menghindari pemotongan senyap PostgREST pada >1.000 baris.
 */
export async function getSuratPaginated(
  params: SuratQueryParams = {}
): Promise<PaginatedResult<any>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from("surat")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.type && params.type !== "ALL") {
      query = query.eq("type", params.type);
    }
    if (params.tenantId) {
      query = query.eq("tenant_id", params.tenantId);
    }
    if (params.classification && params.classification !== "ALL") {
      query = query.eq("classification", params.classification);
    }
    if (params.status && params.status !== "ALL") {
      query = query.eq("status", params.status);
    }
    if (params.search && params.search.trim()) {
      const safeQ = params.search.trim().replace(/[%_,]/g, "");
      if (safeQ) {
        query = query.or(
          `subject.ilike.%${safeQ}%,nomor.ilike.%${safeQ}%,"senderOrRecipient".ilike.%${safeQ}%`
        );
      }
    }

    const { data, count, error } = await query.range(from, to);
    if (!error && Array.isArray(data)) {
      const total = count ?? data.length;
      return {
        data: data.map((row) => hydrateTenantFields(row)),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }
  }

  const all = await getSurat();
  const filtered = all.filter((item) => {
    if (params.type && params.type !== "ALL" && item.type !== params.type) return false;
    if (params.tenantId && item.tenant_id !== params.tenantId && item.komisariat_id !== params.tenantId) {
      return false;
    }
    if (params.classification && params.classification !== "ALL" && item.classification !== params.classification) return false;
    if (params.status && params.status !== "ALL" && item.status !== params.status) return false;
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      return (
        String(item.subject || "").toLowerCase().includes(q) ||
        String(item.nomor || "").toLowerCase().includes(q) ||
        String(item.senderOrRecipient || "").toLowerCase().includes(q)
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

export async function saveSurat(suratList: any[]): Promise<boolean> {
  const normalized = suratList.map((s) => ({
    ...s,
    created_at: s.created_at || new Date().toISOString(),
  }));
  return saveTableData<any>("surat", KEYS.SURAT, normalized);
}

/**
 * Delta upsert untuk 1 surat (hindari mengirim ulang seluruh tabel surat ke Supabase).
 */
export async function upsertSurat(item: any): Promise<boolean> {
  const normalized = {
    ...item,
    created_at: item.created_at || new Date().toISOString(),
  };
  return saveTableData<any>("surat", KEYS.SURAT, [normalized], {
    allowDeletion: false,
    mergeLocalCache: true,
  });
}

/**
 * Delta upsert batch (misal penerbitan surat massal) tanpa menimpa baris lama lain.
 */
export async function upsertSuratBatch(items: any[]): Promise<boolean> {
  if (!Array.isArray(items) || items.length === 0) return true;
  const now = new Date().toISOString();
  const normalized = items.map((s) => ({
    ...s,
    created_at: s.created_at || now,
  }));
  return saveTableData<any>("surat", KEYS.SURAT, normalized, {
    allowDeletion: false,
    mergeLocalCache: true,
  });
}

/**
 * Update sebagian kolom surat secara O(1) (status tindak lanjut, edit metadata, dll.).
 */
export async function updateSurat(id: string, updates: Record<string, any>): Promise<boolean> {
  return updateTableRow("surat", id, updates, KEYS.SURAT);
}

export async function deleteSurat(id: string, fileUrl?: string | null): Promise<boolean> {
  if (fileUrl) {
    try {
      await deleteStorageFile(fileUrl);
    } catch {}
  }
  return deleteTableRow("surat", id, KEYS.SURAT);
}

export async function getSuratTemplates(): Promise<SuratTemplate[]> {
  return getTableData<SuratTemplate>("surat_templates", KEYS.SURAT_TEMPLATES, []);
}

export async function saveSuratTemplates(templates: SuratTemplate[]): Promise<boolean> {
  const normalized = templates.map((t) => ({
    ...t,
    created_at: t.created_at || new Date().toISOString(),
  }));
  return saveTableData<SuratTemplate>("surat_templates", KEYS.SURAT_TEMPLATES, normalized);
}

/**
 * Delta upsert untuk 1 template surat tanpa mengirim ulang seluruh daftar template.
 */
export async function upsertSuratTemplate(template: SuratTemplate): Promise<boolean> {
  const normalized = {
    ...template,
    created_at: template.created_at || new Date().toISOString(),
  };
  delete (normalized as Record<string, unknown>).subject;
  return saveTableData<SuratTemplate>("surat_templates", KEYS.SURAT_TEMPLATES, [normalized], {
    allowDeletion: false,
    mergeLocalCache: true,
  });
}

export async function deleteSuratTemplate(id: string, fileUrl?: string): Promise<boolean> {
  if (fileUrl) {
    try {
      await deleteStorageFile(fileUrl);
    } catch {}
  }
  return deleteTableRow("surat_templates", id, KEYS.SURAT_TEMPLATES);
}
