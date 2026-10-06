import { supabase, isSupabaseConfigured, deleteStorageFile } from "../supabase";
import { isValidUUID, generateUUID } from "../utils";

export function normalizeKomisariat(comm: string | undefined): string {
  if (!comm) return "Ki Ageng Getas Pendawa";
  const c = comm.trim().toLowerCase();
  if (c.includes("getas") || c.includes("pendawa")) return "Ki Ageng Getas Pendawa";
  if (c.includes("walisongo")) return "Ki Ageng Getas Pendawa";
  if (c.includes("diponegoro") || c.includes("undip")) return "Universitas Diponegoro";
  if (c.includes("sunan kalijaga") || c.includes("kalijaga")) return "UIN Sunan Kalijaga";
  if (c.includes("negeri semarang") || c.includes("unnes")) return "Universitas Negeri Semarang";
  return comm;
}

export function normalizeDateString(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  // Indonesian / English month mappings
  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", mei: "05", may: "05", jun: "06", 
    jul: "07", ags: "08", aug: "08", sep: "09", okt: "10", oct: "10", nov: "11", des: "12", dec: "12"
  };

  const match = trimmed.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (match) {
    const monthName = match[1].toLowerCase().slice(0, 3);
    const year = match[2];
    const monthCode = monthMap[monthName];
    if (monthCode) {
      return `${year}-${monthCode}-01`;
    }
  }

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return null;
}

let _resolvedAnggotaTable: string | null = null;

export async function getEffectiveTableName(tableName: string): Promise<string> {
  if (tableName !== "anggota" && tableName !== "kader") return tableName;
  if (_resolvedAnggotaTable) return _resolvedAnggotaTable;
  if (!isSupabaseConfigured || !supabase) return "anggota";
  try {
    const { error } = await supabase.from("anggota").select("id").limit(1);
    if (!error) {
      _resolvedAnggotaTable = "anggota";
      return "anggota";
    }
  } catch {}
  _resolvedAnggotaTable = "kader";
  return "kader";
}

export function extractMissingColumn(errorMessage: string): string | null {
  const match1 = errorMessage.match(/Could not find the '([^']+)' column/i);
  if (match1) return match1[1];

  const match2 = errorMessage.match(/column "([^"]+)" of relation/i);
  if (match2) return match2[1];

  const match3 = errorMessage.match(/column "([^"]+)" does not exist/i);
  if (match3) return match3[1];

  return null;
}

/**
 * Generic Read with Resilient Multi-Layer Sync (Supabase <-> LocalStorage)
 */
export async function getTableData<T>(
  tableName: string,
  localStorageKey: string,
  defaultData: T[] = []
): Promise<T[]> {
  const effectiveTable = await getEffectiveTableName(tableName);

  if (isSupabaseConfigured && supabase) {
    try {
      let { data, error } = await supabase.from(effectiveTable).select("*");
      if (error && (effectiveTable === "anggota" || effectiveTable === "kader")) {
        const altTable = effectiveTable === "anggota" ? "kader" : "anggota";
        const altRes = await supabase.from(altTable).select("*");
        if (!altRes.error && altRes.data) {
          data = altRes.data;
          error = null;
          _resolvedAnggotaTable = altTable;
        }
      }

      if (error) {
        console.warn(`[Supabase Read Warning] ${effectiveTable}: ${error.message}. Menggunakan cache lokal.`);
      } else if (data) {
        let mergedData = data;
        if (localStorageKey && typeof window !== "undefined") {
          if (effectiveTable === "surat" || effectiveTable === "surat_templates") {
            // For surat & surat_templates, remote database is authoritative; do not resurrect stale local caches
            mergedData = data;
            localStorage.setItem(localStorageKey, JSON.stringify(data));
          } else {
            const stored = localStorage.getItem(localStorageKey);
            if (stored) {
              try {
                const localList = JSON.parse(stored) as any[];
                // Merge remote with local while preserving local-only uncommitted additions
                const remoteIdSet = new Set(data.map((r: any) => String(r.id)));
                
                const reconciledRemote = data.map((remoteItem: any) => {
                  const localItem = localList.find(l => String(l.id) === String(remoteItem.id));
                  return {
                    ...localItem,
                    ...remoteItem
                  };
                });

                // Keep local items that are newly created and not yet synced to remote
                const localOnlyItems = localList.filter(l => l.id && !remoteIdSet.has(String(l.id)));
                mergedData = [...reconciledRemote, ...localOnlyItems];
              } catch (e) {
                console.warn(`[Data Merge Warning] Gagal menggabungkan cache lokal untuk ${tableName}:`, e);
              }
            }
            localStorage.setItem(localStorageKey, JSON.stringify(mergedData));
          }
        }

        if (tableName === "articles" && Array.isArray(mergedData)) {
          mergedData = mergedData.map((item: any) => {
            const dateVal = item.createdAt || item.created_at || item.date || new Date().toISOString();
            return {
              ...item,
              createdAt: dateVal,
              created_at: dateVal,
            };
          });
        }
        return mergedData as T[];
      }
    } catch (err: any) {
      console.warn(`[Supabase Connection Notice] ${tableName}: ${err?.message || err}. Mengalihkan ke cache lokal.`);
    }
  }

  // Fallback to LocalStorage
  if (localStorageKey && typeof window !== "undefined") {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      try {
        let parsed = JSON.parse(stored) as any[];
        if (tableName === "articles" && Array.isArray(parsed)) {
          parsed = parsed.map((item: any) => {
            const dateVal = item.createdAt || item.created_at || item.date || new Date().toISOString();
            return {
              ...item,
              createdAt: dateVal,
              created_at: dateVal,
            };
          });
        }
        return parsed as T[];
      } catch (e) {
        console.error(`[LocalStorage Parse Error] ${localStorageKey}:`, e);
      }
    }
  }

  if (tableName === "articles" && Array.isArray(defaultData)) {
    return defaultData.map((item: any) => {
      const dateVal = item.createdAt || item.created_at || item.date || new Date().toISOString();
      return {
        ...item,
        createdAt: dateVal,
        created_at: dateVal,
      };
    }) as unknown as T[];
  }

  return defaultData;
}

/**
 * Generic Write with Safe Upsert, Storage File Cleanup, and Schema Self-Healing
 */
export interface SaveTableOptions {
  scopeCommissariat?: string;
  allowDeletion?: boolean;
  forceWipeAll?: boolean;
}

export async function deleteTableRow(
  tableName: string,
  id: string,
  localStorageKey?: string
): Promise<boolean> {
  const effectiveTable = await getEffectiveTableName(tableName);

  // Update local cache
  if (localStorageKey && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        const list = JSON.parse(stored) as any[];
        const filtered = list.filter((item) => String(item.id) !== String(id));
        localStorage.setItem(localStorageKey, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(`Error updating local cache for ${localStorageKey}:`, e);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // Clean up files before deleting record
      if (effectiveTable === "anggota" || effectiveTable === "kader") {
        const { data: c } = await supabase
          .from(effectiveTable)
          .select('id, avatar, "ktpFileUrl", "ktmFileUrl"')
          .eq("id", id)
          .single();
        if (c) {
          if (c.avatar) await deleteStorageFile(c.avatar);
          if (c.ktpFileUrl) await deleteStorageFile(c.ktpFileUrl);
          if (c.ktmFileUrl) await deleteStorageFile(c.ktmFileUrl);
        }
      } else if (effectiveTable === "arsip") {
        const { data: doc } = await supabase
          .from("arsip")
          .select("id, description, url")
          .eq("id", id)
          .single();
        if (doc) {
          if (doc.url) await deleteStorageFile(doc.url);
          if (doc.description) {
            try {
              const parsed = JSON.parse(doc.description);
              if (parsed.fileUrl) await deleteStorageFile(parsed.fileUrl);
            } catch {}
          }
        }
      }

      const { error } = await supabase.from(effectiveTable).delete().eq("id", id);
      if (error) {
        console.error(`Supabase error deleting ${id} from ${effectiveTable}:`, error);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`Error deleting ${id} from ${effectiveTable}:`, err);
      return false;
    }
  }

  return true;
}

export async function upsertTableRow<T extends { id: string | number }>(
  tableName: string,
  localStorageKey: string,
  record: T
): Promise<boolean> {
  return saveTableData(tableName, localStorageKey, [record], { allowDeletion: false });
}

export async function saveTableData<T extends { id: string | number }>(
  tableName: string,
  localStorageKey: string,
  dataList: T[],
  options?: SaveTableOptions
): Promise<boolean> {
  const effectiveTable = await getEffectiveTableName(tableName);

  // Guarantee UUID consistency
  const sanitizedList = dataList.map((item) => ({
    ...item,
    id: isValidUUID(String(item.id)) ? String(item.id) : generateUUID()
  })) as T[];

  // Always update local cache first
  if (localStorageKey && typeof window !== "undefined") {
    localStorage.setItem(localStorageKey, JSON.stringify(sanitizedList));
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const newIds = sanitizedList.map((item) => String(item.id));
      // Safe default: NEVER delete records unless explicitly opted-in AND scoped/forced
      const allowDeletion = options?.allowDeletion === true;

      if (allowDeletion && (options?.scopeCommissariat || options?.forceWipeAll)) {
        const formattedIds =
          newIds.length > 0
            ? `(${newIds.map((id) => `"${id}"`).join(",")})`
            : '("00000000-0000-0000-0000-000000000000")';

        // Auto-cleanup storage files for arsip
        if (effectiveTable === "arsip") {
          try {
            const { data: toDeleteDocs } = await supabase
              .from("arsip")
              .select("id, description, url")
              .not("id", "in", formattedIds);

            if (toDeleteDocs && toDeleteDocs.length > 0) {
              for (const doc of toDeleteDocs) {
                const urls: string[] = [];
                if (doc.url) urls.push(doc.url);
                if (doc.description && doc.description.startsWith("{")) {
                  try {
                    const parsed = JSON.parse(doc.description);
                    if (parsed.fileUrl) urls.push(parsed.fileUrl);
                  } catch {}
                } else if (
                  doc.description &&
                  (doc.description.startsWith("http://") || doc.description.startsWith("https://"))
                ) {
                  urls.push(doc.description);
                }
                for (const u of urls) {
                  await deleteStorageFile(u);
                }
              }
            }
          } catch (storageCleanupErr) {
            console.warn("Storage auto-cleanup notice pada arsip:", storageCleanupErr);
          }
        }

        // Auto-cleanup storage files for anggota / kader
        if (effectiveTable === "anggota" || effectiveTable === "kader") {
          try {
            const { data: toDeleteCadres } = await supabase
              .from(effectiveTable)
              .select('id, avatar, "ktpFileUrl", "ktmFileUrl"')
              .not("id", "in", formattedIds);

            if (toDeleteCadres && toDeleteCadres.length > 0) {
              for (const c of toDeleteCadres) {
                if (c.avatar) await deleteStorageFile(c.avatar);
                if (c.ktpFileUrl) await deleteStorageFile(c.ktpFileUrl);
                if (c.ktmFileUrl) await deleteStorageFile(c.ktmFileUrl);
              }
            }
          } catch (cadreCleanupErr) {
            console.warn("Storage auto-cleanup notice pada kader/anggota:", cadreCleanupErr);
          }
        }

        // Auto-cleanup avatar for users
        if (effectiveTable === "users") {
          try {
            const { data: toDeleteUsers } = await supabase
              .from("users")
              .select("id, avatar")
              .not("id", "in", formattedIds);

            if (toDeleteUsers && toDeleteUsers.length > 0) {
              for (const u of toDeleteUsers) {
                if (u.avatar) await deleteStorageFile(u.avatar);
              }
            }
          } catch (userCleanupErr) {
            console.warn("Storage auto-cleanup notice pada users:", userCleanupErr);
          }
        }

        if (newIds.length > 0) {
          let deleteQuery = supabase
            .from(effectiveTable)
            .delete()
            .not("id", "in", formattedIds);

          if (options?.scopeCommissariat) {
            deleteQuery = deleteQuery.eq("commissariat", options.scopeCommissariat);
          }

          const { error: deleteError } = await deleteQuery;
          if (deleteError) {
            console.warn(`Supabase sync delete notice on ${effectiveTable}:`, deleteError.message);
          }
        } else if (options?.forceWipeAll) {
          let deleteQuery = supabase
            .from(effectiveTable)
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

          if (options?.scopeCommissariat) {
            deleteQuery = deleteQuery.eq("commissariat", options.scopeCommissariat);
          }

          const { error: deleteError } = await deleteQuery;
          if (deleteError) {
            console.warn(`Supabase sync delete notice on ${effectiveTable}:`, deleteError.message);
          }
        }
      }

      // Upsert remaining list with automatic column self-healing
      if (sanitizedList.length > 0) {
        let currentList = sanitizedList.map((item: any) => {
          if (effectiveTable === "articles") {
            const copy = { ...item };
            copy.created_at = copy.created_at || copy.createdAt || new Date().toISOString();
            copy.updated_at = copy.updated_at || copy.updatedAt || new Date().toISOString();
            delete copy.createdAt;
            delete copy.updatedAt;
            delete copy.date;
            delete copy.readTime;
            return copy;
          }
          if (effectiveTable === "arsip") {
            const copy = { ...item };
            copy.created_at = copy.created_at || new Date().toISOString();
            return copy;
          }
          if (effectiveTable === "kader" || effectiveTable === "anggota" || tableName === "kader" || tableName === "anggota") {
            const copy = { ...item };
            delete copy.allowedMenus;
            return copy;
          }
          if (effectiveTable === "evaluations") {
            const copy = { ...item };
            if (copy.sessionScores && typeof copy.sessionScores === "object") {
              const cleanedScores = { ...copy.sessionScores };
              delete cleanedScores.__quizMeta;
              copy.sessionScores = cleanedScores;
            }
            return copy;
          }
          return { ...item };
        });

        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
          const { error: upsertError } = await supabase
            .from(effectiveTable)
            .upsert(currentList, { onConflict: "id" });

          if (!upsertError) {
            return true;
          }

          const isSchemaError = 
            upsertError.message.includes("column") || 
            upsertError.code === "P0002" || 
            upsertError.code === "42703";

          if (isSchemaError) {
            const missingColumn = extractMissingColumn(upsertError.message);
            if (missingColumn) {
              console.warn(`[Schema Healing] ${effectiveTable}: Kolom '${missingColumn}' tidak ada di skema remote, mencoba ulang tanpa kolom ini...`);
              currentList = currentList.map((item) => {
                const copy = { ...item };
                delete copy[missingColumn];
                return copy;
              });
              attempts++;
              continue;
            }
          }

          // Self-healing for unique constraint violations on evaluations
          if (
            effectiveTable === "evaluations" &&
            (upsertError.code === "23505" || upsertError.message.includes("unique constraint") || upsertError.message.includes("duplicate key"))
          ) {
            console.warn(`[Unique Conflict Resolution] Konflik pada tabel evaluations, menyinkronkan ID dengan data database remote...`);
            try {
              const { data: dbRecords } = await supabase
                .from("evaluations")
                .select("id, activityId, cadreId, participantName");
              if (dbRecords && dbRecords.length > 0) {
                currentList = currentList.map((item: any) => {
                  const cadreIdClean = (item.cadreId || "").trim().toLowerCase();
                  const nameClean = (item.participantName || "").trim().toLowerCase();
                  const dbMatch = dbRecords.find((r: any) => {
                    if (r.activityId !== item.activityId) return false;
                    const rCadreId = (r.cadreId || "").trim().toLowerCase();
                    const rName = (r.participantName || "").trim().toLowerCase();
                    if (cadreIdClean && rCadreId && cadreIdClean === rCadreId) return true;
                    if (nameClean && rName && nameClean === rName) return true;
                    return false;
                  });
                  if (dbMatch) {
                    return { ...item, id: dbMatch.id };
                  }
                  return item;
                });

                const idMap = new Map<string, any>();
                for (const item of currentList) {
                  idMap.set(String(item.id), item);
                }
                currentList = Array.from(idMap.values());
                attempts++;
                continue;
              }
            } catch (resolveErr) {
              console.warn("Gagal auto-resolve unique constraint IDs:", resolveErr);
            }
          }

          console.error(`[Supabase Write Error] ${effectiveTable}:`, upsertError.message);
          break;
        }
      } else {
        return true;
      }
    } catch (err) {
      console.error(`Gagal melakukan upsert ke Supabase untuk ${effectiveTable}:`, err);
    }
  }

  return true;
}
