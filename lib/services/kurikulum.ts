import { KaderisasiLevel } from "./types";
import { KEYS } from "./defaults";
import { supabase, isSupabaseConfigured, deleteStorageFile } from "../supabase";

export async function getKurikulum(): Promise<Record<string, KaderisasiLevel> | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("kurikulum")
        .select("id, name, syllabus, materials, quiz");
      if (!error && data) {
        const result: Record<string, KaderisasiLevel> = {};
        if (data.length > 0) {
          data.forEach((row: any) => {
            const key = row.name || row.id;
            result[key] = {
              id: row.id,
              name: row.name,
              syllabus: row.syllabus || [],
              materials: row.materials || [],
              quiz: row.quiz || []
            };
          });
        }
        if (typeof window !== "undefined") {
          localStorage.setItem(KEYS.KURIKULUM, JSON.stringify(result));
        }
        return result;
      }
      if (error) {
        console.error("Supabase read error on kurikulum:", error.message);
      }
    } catch (err) {
      console.error("Failed to fetch from Supabase for kurikulum:", err);
    }
  }

  // LocalStorage Fallback
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(KEYS.KURIKULUM);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed) {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing local kurikulum", e);
      }
    }
  }
  return null;
}

export async function saveKurikulum(kurikulumData: Record<string, KaderisasiLevel>): Promise<boolean> {
  // Save to LocalStorage first
  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.KURIKULUM, JSON.stringify(kurikulumData));
  }

  if (isSupabaseConfigured && supabase) {
    const client = supabase;
    try {
      // Auto-cleanup deleted material files in Supabase Storage
      try {
        const { data: remoteLevels } = await client.from("kurikulum").select("materials");
        if (remoteLevels && Array.isArray(remoteLevels)) {
          const activeUrls = new Set<string>();
          Object.values(kurikulumData).forEach((lvl: any) => {
            (lvl.materials || []).forEach((m: any) => {
              if (m.fileUrl) activeUrls.add(m.fileUrl);
              m.materialFiles?.forEach((f: any) => { if (f.url) activeUrls.add(f.url); });
              m.referensiFiles?.forEach((f: any) => { if (f.url) activeUrls.add(f.url); });
            });
          });

          for (const row of remoteLevels) {
            const remoteMaterials: any[] = row.materials || [];
            for (const m of remoteMaterials) {
              const urls: string[] = [];
              if (m.fileUrl) urls.push(m.fileUrl);
              m.materialFiles?.forEach((f: any) => { if (f.url) urls.push(f.url); });
              m.referensiFiles?.forEach((f: any) => { if (f.url) urls.push(f.url); });

              for (const u of urls) {
                if (!activeUrls.has(u)) {
                  await deleteStorageFile(u);
                }
              }
            }
          }
        }
      } catch (cleanupErr) {
        console.warn("Storage auto-cleanup error in saveKurikulum:", cleanupErr);
      }

      const promises = Object.keys(kurikulumData).map(async (key) => {
        const level = kurikulumData[key];
        const payload: any = {
          name: level.name || key,
          syllabus: level.syllabus || [],
          materials: level.materials || [],
          quiz: level.quiz || []
        };
        if (level.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(level.id)) {
          payload.id = level.id;
        }
        return client
          .from("kurikulum")
          .upsert(payload, { onConflict: "name" });
      });
      const results = await Promise.all(promises);
      const hasError = results.some(r => r.error);
      if (!hasError) return true;
      console.error("Supabase write error on kurikulum:", results.filter(r => r.error).map(r => r.error?.message));
    } catch (err) {
      console.error("Failed to save to Supabase for kurikulum:", err);
    }
  }
  return true;
}
