import { KEYS } from "./defaults";
import { getTableData, saveTableData } from "./core";
import { isValidUUID, generateUUID } from "../utils";

export async function getArsip(): Promise<any[]> {
  return getTableData<any>("arsip", KEYS.ARSIP);
}

export async function saveArsip(arsipList: any[]): Promise<boolean> {
  const normalized = arsipList.map(a => ({
    ...a,
    id: isValidUUID(String(a.id)) ? String(a.id) : generateUUID(),
    created_at: a.created_at || new Date().toISOString()
  }));
  return saveTableData<any>("arsip", KEYS.ARSIP, normalized);
}
