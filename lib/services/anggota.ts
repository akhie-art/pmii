import { CadreFollowUp, Anggota } from "./types";
import { KEYS, DEFAULT_CADRES } from "./defaults";
import { getTableData, saveTableData, normalizeKomisariat, normalizeDateString } from "./core";
import { getUserPassword, setUserPassword } from "./credentials";

export async function getAnggota(defaultData: Anggota[] = DEFAULT_CADRES): Promise<Anggota[]> {
  let list = await getTableData<Anggota>("anggota", KEYS.CADRES, defaultData);
  // Filter out dummy data if any exist in local storage cache
  list = list.filter(c => 
    c.id !== "cadre-1" && 
    c.id !== "cadre-2" && 
    c.id !== "user-anggota" && 
    c.id !== "user-peserta" &&
    c.name !== "Sahabat Anggota" && 
    c.name !== "Calon Anggota"
  );
  // Normalize fields on read & attach credentials if known
  return list.map(c => ({
    ...c,
    password: getUserPassword(c) || c.password,
    commissariat: normalizeKomisariat(c.commissariat)
  }));
}

export async function saveAnggota(anggotaList: Anggota[]): Promise<boolean> {
  // Record any passwords into credentials store
  anggotaList.forEach(c => {
    if (c.password) {
      setUserPassword([c.id, c.user_id, c.email, c.nim, c.nik, c.name], c.password);
    }
  });

  const normalized = anggotaList.map(c => {
    const copy: any = { ...c };
    delete copy.password;
    return {
      ...copy,
      created_at: copy.created_at || new Date().toISOString(),
      commissariat: normalizeKomisariat(copy.commissariat),
      startDate: normalizeDateString(copy.startDate)
    };
  });
  return saveTableData<any>("anggota", KEYS.CADRES, normalized);
}

export async function updateAnggota(id: string, updates: Partial<Anggota>): Promise<boolean> {
  const { updateTableRow } = await import("./core");
  if (updates.password) {
    setUserPassword([id, updates.user_id, updates.email, updates.nim, updates.name], updates.password);
  }
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
