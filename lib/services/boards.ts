import { BoardMember } from "./types";
import { KEYS, DEFAULT_BOARDS } from "./defaults";
import { getTableData, saveTableData, normalizeKomisariat } from "./core";

export async function getBoards(defaultData: BoardMember[] = DEFAULT_BOARDS): Promise<BoardMember[]> {
  const list = await getTableData<BoardMember>("pengurus", KEYS.BOARDS, defaultData);
  return list.map(b => ({
    ...b,
    commissariat: b.commissariat ? normalizeKomisariat(b.commissariat) : ""
  }));
}

export async function saveBoards(boardsList: BoardMember[]): Promise<boolean> {
  const normalized = boardsList.map(b => ({
    ...b,
    created_at: (b as any).created_at || new Date().toISOString(),
    commissariat: b.commissariat ? normalizeKomisariat(b.commissariat) : ""
  }));
  return saveTableData<BoardMember>("pengurus", KEYS.BOARDS, normalized);
}
