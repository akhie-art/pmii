import { CommissariatList } from "./types";
import { KEYS, DEFAULT_COMMISSARIATS } from "./defaults";
import { getTableData, saveTableData } from "./core";

export async function getCommissariats(
  defaultData: CommissariatList[] = DEFAULT_COMMISSARIATS
): Promise<CommissariatList[]> {
  return getTableData<CommissariatList>("komisariat", KEYS.COMMISSARIATS, defaultData);
}

export async function saveCommissariats(commList: CommissariatList[]): Promise<boolean> {
  const normalized = commList.map(c => ({
    ...c,
    created_at: (c as any).created_at || new Date().toISOString()
  }));
  return saveTableData<CommissariatList>("komisariat", KEYS.COMMISSARIATS, normalized);
}
