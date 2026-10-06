import { Kaderisasi } from "./types";
import { KEYS } from "./defaults";
import { supabase, isSupabaseConfigured, deleteStorageFile } from "../supabase";

export async function getKaderisasi(): Promise<Kaderisasi[]> {
  let supabaseList: Kaderisasi[] = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("kaderisasi")
        .select("*")
        .order("createdAt", { ascending: false });
      if (!error && data) {
        supabaseList = data.map((d: any) => ({
          ...d,
          formFields: d.formFields || d.formfields || [],
          materi: d.materi || [],
          certificateTemplate: d.certificateTemplate || d.certificatetemplate || undefined,
          certificateConfig: d.certificateConfig || d.certificateconfig || undefined
        }));
      } else if (error) {
        console.error("Supabase read error on kaderisasi:", error.message);
      }
    } catch (err) {
      console.error("Failed to fetch from Supabase for kaderisasi:", err);
    }
  }

  // Load local storage fallback list
  let localList: Kaderisasi[] = [];
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(KEYS.KADERISASI);
    if (stored) {
      try {
        localList = JSON.parse(stored).map((d: any) => ({
          ...d,
          formFields: d.formFields || [],
          materi: d.materi || [],
          certificateTemplate: d.certificateTemplate || undefined,
          certificateConfig: d.certificateConfig || undefined
        }));
      } catch (e) {
        console.error("Error parsing local kaderisasi", e);
      }
    }
  }

  // If we fetched successfully from Supabase, sync back to local storage
  if (supabaseList.length > 0) {
    if (typeof window !== "undefined") {
      localStorage.setItem(KEYS.KADERISASI, JSON.stringify(supabaseList));
    }
    return supabaseList;
  }

  return localList;
}

export async function saveKaderisasi(kaderisasiList: Kaderisasi[]): Promise<boolean> {
  // Save to LocalStorage first to guarantee persistence in fallback mode
  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.KADERISASI, JSON.stringify(kaderisasiList));
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const newIds = kaderisasiList.map(k => k.id);
      const normalized = kaderisasiList.map(k => ({
        id: k.id,
        nama: k.nama,
        tipe: k.tipe,
        formFields: k.formFields || [],
        materi: k.materi || [],
        certificateTemplate: k.certificateTemplate || null,
        certificateConfig: k.certificateConfig || null,
        createdAt: k.createdAt || (k as any).created_at || new Date().toISOString()
      }));

      // Auto-cleanup storage files if deleting kaderisasi agenda
      try {
        const formattedIds = newIds.length > 0 ? `(${newIds.map(id => `"${id}"`).join(",")})` : '("00000000-0000-0000-0000-000000000000")';
        const { data: toDeleteAgendas } = await supabase
          .from("kaderisasi")
          .select("id, certificateTemplate, syllabus, modul")
          .not("id", "in", formattedIds);

        if (toDeleteAgendas && toDeleteAgendas.length > 0) {
          for (const a of toDeleteAgendas) {
            if (a.certificateTemplate) await deleteStorageFile(a.certificateTemplate);
            if (a.syllabus?.fileUrl) await deleteStorageFile(a.syllabus.fileUrl);
            if (a.modul?.fileUrl) await deleteStorageFile(a.modul.fileUrl);
          }
        }
      } catch (cleanupErr) {
        console.warn("Storage auto-cleanup error on kaderisasi agenda deletion:", cleanupErr);
      }

      // Delete records from Supabase that are no longer in the list
      if (newIds.length > 0) {
        const formattedIds = `(${newIds.map(id => `"${id}"`).join(",")})`;
        const { error: deleteError } = await supabase
          .from("kaderisasi")
          .delete()
          .not("id", "in", formattedIds);
        if (deleteError) {
          console.error(`Supabase sync delete error on kaderisasi:`, deleteError.message);
        }
      } else {
        const { error: deleteError } = await supabase
          .from("kaderisasi")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (deleteError) {
          console.error(`Supabase sync clear error on kaderisasi:`, deleteError.message);
        }
      }

      // Upsert updated list
      if (normalized.length > 0) {
        const { error: upsertError } = await supabase
          .from("kaderisasi")
          .upsert(normalized, { onConflict: "id" });
        if (!upsertError) {
          return true;
        }
        console.error(`Supabase write error on kaderisasi:`, upsertError.message);
      } else {
        return true;
      }
    } catch (err) {
      console.error("Failed to save to Supabase for kaderisasi:", err);
    }
  }
  return true;
}
