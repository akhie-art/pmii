import { getTableData, saveTableData, deleteTableRow } from "./core";
import { KEYS, DEFAULT_SURAT_TEMPLATES } from "./defaults";
import { SuratTemplate } from "./types";
import { deleteStorageFile } from "../supabase";

export async function getSurat(): Promise<any[]> {
  return getTableData<any>("surat", KEYS.SURAT);
}

export async function saveSurat(suratList: any[]): Promise<boolean> {
  const normalized = suratList.map(s => ({
    ...s,
    created_at: s.created_at || new Date().toISOString()
  }));
  return saveTableData<any>("surat", KEYS.SURAT, normalized);
}

export async function deleteSurat(id: string, fileUrl?: string): Promise<boolean> {
  if (fileUrl) {
    try {
      await deleteStorageFile(fileUrl);
    } catch {}
  }
  return deleteTableRow("surat", id, KEYS.SURAT);
}

export async function getSuratTemplates(): Promise<SuratTemplate[]> {
  return getTableData<SuratTemplate>("surat_templates", KEYS.SURAT_TEMPLATES, DEFAULT_SURAT_TEMPLATES);
}

export async function saveSuratTemplates(templates: SuratTemplate[]): Promise<boolean> {
  const normalized = templates.map(t => ({
    ...t,
    created_at: t.created_at || new Date().toISOString()
  }));
  return saveTableData<SuratTemplate>("surat_templates", KEYS.SURAT_TEMPLATES, normalized);
}

export async function deleteSuratTemplate(id: string, fileUrl?: string): Promise<boolean> {
  if (fileUrl) {
    try {
      await deleteStorageFile(fileUrl);
    } catch {}
  }
  return deleteTableRow("surat_templates", id, KEYS.SURAT_TEMPLATES);
}
