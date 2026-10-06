import { Requirement } from "./types";
import { KEYS, DEFAULT_REQUIREMENTS } from "./defaults";
import { getTableData, saveTableData } from "./core";

export async function getRequirements(
  defaultData: Requirement[] = DEFAULT_REQUIREMENTS
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
