import { CadreFollowUp } from "./types";
import { KEYS, DEFAULT_CADRES } from "./defaults";
import { getTableData, saveTableData, normalizeKomisariat, normalizeDateString } from "./core";
import { getUserPassword, setUserPassword } from "./credentials";

export async function getCadres(defaultData: CadreFollowUp[] = DEFAULT_CADRES): Promise<CadreFollowUp[]> {
  let list = await getTableData<CadreFollowUp>("anggota", KEYS.CADRES, defaultData);
  // Filter out dummy cadres if any exist in local storage cache
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

export async function saveCadres(cadresList: CadreFollowUp[]): Promise<boolean> {
  // Record any passwords into credentials store
  cadresList.forEach(c => {
    if (c.password) {
      setUserPassword([c.id, c.user_id, c.email, c.nik, c.name], c.password);
    }
  });

  const normalized = cadresList.map(c => {
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

// Aliases for Anggota
export const getAnggota = getCadres;
export const saveAnggota = saveCadres;
