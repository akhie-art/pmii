import { BoardMember } from "./types";
import { KEYS, DEFAULT_BOARDS } from "./defaults";
import { getTableData, saveTableData, deleteTableRow, normalizeKomisariat } from "./core";
import { supabase, isSupabaseConfigured } from "../supabase";
import { isValidUUID } from "../utils";

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

export async function deleteBoard(id: string, name?: string): Promise<boolean> {
  const success = await deleteTableRow("pengurus", id, KEYS.BOARDS);
  if (isSupabaseConfigured && supabase) {
    try {
      if (id && isValidUUID(id)) {
        await supabase.from("pengurus").delete().eq("id", id);
      }
      if (name) {
        await supabase.from("pengurus").delete().eq("name", name);
      }
    } catch (e) {
      console.warn("Direct Supabase delete notice for pengurus:", e);
    }
  }
  return success;
}

export const deletePengurus = deleteBoard;
