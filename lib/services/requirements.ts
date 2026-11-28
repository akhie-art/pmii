import { Requirement } from "./types";
import { KEYS } from "./defaults";
import { getTableData, saveTableData, deleteTableRow } from "./core";
import { deleteStorageFile } from "../supabase";

export async function getRequirements(
  defaultData: Requirement[] = []
): Promise<Requirement[]> {
  const list = await getTableData<Requirement>("persyaratan", KEYS.REQUIREMENTS, defaultData);
  if ((!list || list.length === 0) && defaultData && defaultData.length > 0) {
    return defaultData;
  }
  return list;
}

export async function saveRequirements(reqsList: Requirement[]): Promise<boolean> {
  const normalized = reqsList.map(req => ({
    ...req,
    created_at: (req as any).created_at || new Date().toISOString()
  }));
  return saveTableData<Requirement>("persyaratan", KEYS.REQUIREMENTS, normalized);
}

/**
 * Delta upsert untuk 1 tugas/persyaratan RTL tanpa menimpa baris milik tenant lain
 * sehingga aman dari bentrok RLS lintas-komisariat & race condition.
 */
export async function upsertRequirement(req: Requirement): Promise<boolean> {
  const normalized = {
    ...req,
    created_at: (req as any).created_at || new Date().toISOString(),
  };
  return saveTableData<Requirement>("persyaratan", KEYS.REQUIREMENTS, [normalized], {
    allowDeletion: false,
    mergeLocalCache: true,
  });
}

/**
 * Menghapus 1 tugas/persyaratan RTL secara permanen di Supabase & local cache,
 * sekaligus membersihkan berkas panduan terkait dari Storage bila ada.
 */
export async function deleteRequirement(
  id: string,
  fileUrl?: string | null
): Promise<boolean> {
  if (fileUrl) {
    try {
      await deleteStorageFile(fileUrl);
    } catch {
      // Abaikan kegagalan cleanup berkas lama agar penghapusan record tetap lanjut
    }
  }
  return deleteTableRow("persyaratan", id, KEYS.REQUIREMENTS);
}
