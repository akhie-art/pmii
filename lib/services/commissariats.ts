import { CommissariatList } from "./types";
import { KEYS, DEFAULT_COMMISSARIATS } from "./defaults";
import { getTableData, saveTableData, deleteTableRow, upsertTableRow } from "./core";

export async function getCommissariats(
  defaultData: CommissariatList[] = DEFAULT_COMMISSARIATS
): Promise<CommissariatList[]> {
  const data = await getTableData<CommissariatList>("komisariat", KEYS.COMMISSARIATS, defaultData);
  return data.map((c) => {
    const uni = c.university || (c as any).campusName || "";
    const name = c.name || "";
    const autoInitial =
      c.logoInitial ||
      name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 3)
        .join("")
        .toUpperCase() ||
      "PK";

    return {
      ...c,
      university: uni,
      campusName: uni,
      logoInitial: autoInitial,
      establishedYear: c.establishedYear || undefined,
    };
  });
}

export async function saveCommissariats(commList: CommissariatList[]): Promise<boolean> {
  const normalized = commList.map((c) => ({
    id: c.id,
    name: c.name,
    university: c.university || (c as any).campusName || "",
    contactEmail: c.contactEmail || "",
    structure: c.structure || {},
    establishedYear: c.establishedYear ? Number(c.establishedYear) : null,
    logo: c.logo || null,
    rayons: c.rayons || [],
    created_at: (c as any).created_at || new Date().toISOString(),
  })) as unknown as CommissariatList[];
  return saveTableData<CommissariatList>("komisariat", KEYS.COMMISSARIATS, normalized, {
    allowDeletion: true,
    forceWipeAll: true
  });
}

export async function upsertCommissariat(comm: CommissariatList): Promise<boolean> {
  const normalized = {
    id: comm.id,
    name: comm.name,
    university: comm.university || (comm as any).campusName || "",
    contactEmail: comm.contactEmail || "",
    structure: comm.structure || {},
    establishedYear: comm.establishedYear ? Number(comm.establishedYear) : null,
    logo: comm.logo || null,
    rayons: comm.rayons || [],
  } as unknown as CommissariatList;
  return upsertTableRow<CommissariatList>("komisariat", KEYS.COMMISSARIATS, normalized);
}

export async function deleteCommissariat(id: string): Promise<boolean> {
  return deleteTableRow("komisariat", id, KEYS.COMMISSARIATS);
}

