import { PengajuanSK, StatusPengajuanSK } from "./types";
import { KEYS, DEFAULT_PENGAJUAN_SK } from "./defaults";
import { getTableData, saveTableData, deleteTableRow } from "./core";
import { deleteStorageFile } from "../supabase";

export async function getPengajuanSK(): Promise<PengajuanSK[]> {
  return getTableData<PengajuanSK>(
    "pengajuan_sk",
    KEYS.PENGAJUAN_SK,
    DEFAULT_PENGAJUAN_SK
  );
}

export async function savePengajuanSK(items: PengajuanSK[]): Promise<boolean> {
  const normalized = items.map((item) => ({
    ...item,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  return saveTableData<PengajuanSK>(
    "pengajuan_sk",
    KEYS.PENGAJUAN_SK,
    normalized
  );
}

export async function deletePengajuanSK(
  id: string,
  fileUrls?: (string | undefined)[]
): Promise<boolean> {
  if (fileUrls && Array.isArray(fileUrls)) {
    for (const url of fileUrls) {
      if (url) {
        try {
          await deleteStorageFile(url);
        } catch (e) {
          console.warn("Gagal menghapus file lampiran pengajuan SK:", e);
        }
      }
    }
  }
  return deleteTableRow("pengajuan_sk", id, KEYS.PENGAJUAN_SK);
}
