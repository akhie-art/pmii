import { supabase, isSupabaseConfigured, deleteStorageFile, clearSupabaseStorage } from "../supabase";
import { isValidUUID, generateUUID } from "../utils";
import { getTenantIdByName, getTenantNameById, CABANG_TENANT_ID, getKomisariatIdByName, getKomisariatNameById } from "../tenancy";

export function normalizeKomisariat(comm: string | undefined): string {
  if (!comm || !comm.trim()) {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("PMII_ACTIVE_TENANT_COMMISSARIAT");
      if (active && active !== "ALL" && active !== "Semua Komisariat") return active;
      const userStr = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.commissariat) return u.commissariat;
        } catch {}
      }
    }
    return "Komisariat Ki Ageng Getas Pendawa";
  }
  const c = comm.trim().toLowerCase();
  if (c.includes("cabang") || c.includes("pc pmii")) return "Pengurus Cabang Grobogan";
  if (c.includes("tarub")) return "Komisariat Ki Ageng Tarub";
  if (c.includes("ajisaka")) return "Komisariat Ajisaka";
  if (c.includes("joko") || c.includes("suro")) return "Komisariat Joko Suro";
  if (c.includes("getas") || c.includes("pendawa")) return "Komisariat Ki Ageng Getas Pendawa";
  if (c.includes("walisongo") && !c.includes("semarang")) return "Komisariat Ki Ageng Getas Pendawa";
  return comm.trim();
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
  if (tableName === "anggota" || tableName === "kader") return "anggota";
  if (tableName === "komisariat" || tableName === "commissariats" || tableName === "tenant" || tableName === "tenants") return "tenant";
  return tableName;
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

export const TABLES_WITHOUT_COMMISSARIAT = [
  "kegiatan",
  "pengurus",
  "surat",
  "arsip",
  "articles",
  "evaluations",
  "surat_templates",
  "anggota",
  "kader",
  "pendaftaran",
  "persyaratan",
  "kaderisasi"
];

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
        console.warn(`[Supabase Read Warning] ${effectiveTable}: ${error.message}. Mencoba REST anon key...`);
        const errMsg = (error.message || "").toLowerCase();
        if (errMsg.includes("jwt") || errMsg.includes("expired") || errMsg.includes("token")) {
          clearSupabaseStorage();
        }

        // Coba direct REST fetch anon sebagai fallback
        try {
          const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
          const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
          if (rawUrl && anonKey) {
            const restRes = await fetch(`${rawUrl}/rest/v1/${effectiveTable}?select=*`, {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
              },
            });
            if (restRes.ok) {
              const restData = await restRes.json();
              if (Array.isArray(restData)) {
                data = restData;
                error = null;
              }
            }
          }
        } catch (restErr) {
          console.warn(`[Supabase REST fallback error] ${effectiveTable}:`, restErr);
        }
      }

      if (data) {
        let mergedData = data;
        if (localStorageKey && typeof window !== "undefined") {
          const authoritativeTables = [
            "anggota",
            "kader",
            "pengguna",
            "users",
            "pendaftaran",
            "kegiatan",
            "surat",
            "surat_templates",
            "komisariat",
            "tenant",
            "tenants",
            "articles",
            "arsip",
            "evaluations",
            "kaderisasi",
            "kurikulum",
            "persyaratan",
            "board_members",
            "pengurus"
          ];
          if (authoritativeTables.includes(effectiveTable) || authoritativeTables.includes(tableName)) {
            // Database Supabase adalah sumber data tunggal yang otoritatif.
            // Jangan hidupkan kembali sisa cache lokal (phantom/ghost local items).
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

        // Resolusi dinamis nama tenant/komisariat dari Foreign Key tenant_id/komisariat_id untuk UI & Tenancy
        if (Array.isArray(mergedData) && (TABLES_WITHOUT_COMMISSARIAT.includes(effectiveTable) || TABLES_WITHOUT_COMMISSARIAT.includes(tableName))) {
          mergedData = mergedData.map((item: any) => {
            const tid = item.tenant_id || item.komisariat_id;
            return {
              ...item,
              tenant_id: tid,
              komisariat_id: tid,
              commissariat: item.commissariat || (tid ? getTenantNameById(tid) : "Pengurus Cabang Grobogan")
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
          const ghostTitles = [
            "meneguhkan aswaja",
            "refleksi mapaba",
            "modernisasi persuratan"
          ];
          const cleaned = parsed.filter((item: any) => {
            const t = (item.title || "").toLowerCase();
            const id = String(item.id || "");
            const isGhost =
              ghostTitles.some((g) => t.includes(g)) ||
              id.startsWith("art-") ||
              id.startsWith("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a2");
            return !isGhost;
          });
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(localStorageKey, JSON.stringify(cleaned));
            parsed = cleaned;
          }
          parsed = parsed.map((item: any) => {
            const dateVal = item.createdAt || item.created_at || item.date || new Date().toISOString();
            return {
              ...item,
              createdAt: dateVal,
              created_at: dateVal,
            };
          });
        }

        if (Array.isArray(parsed) && (TABLES_WITHOUT_COMMISSARIAT.includes(effectiveTable) || TABLES_WITHOUT_COMMISSARIAT.includes(tableName))) {
          parsed = parsed.map((item: any) => {
            const tid = item.tenant_id || item.komisariat_id;
            return {
              ...item,
              tenant_id: tid,
              komisariat_id: tid,
              commissariat: item.commissariat || (tid ? getTenantNameById(tid) : "Pengurus Cabang Grobogan")
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
      } else if (effectiveTable === "surat") {
        const { data: s } = await supabase
          .from("surat")
          .select('id, "fileUrl"')
          .eq("id", id)
          .single();
        if (s && s.fileUrl) {
          await deleteStorageFile(s.fileUrl);
        }
      } else if (effectiveTable === "surat_templates") {
        const { data: t } = await supabase
          .from("surat_templates")
          .select('id, "fileUrl"')
          .eq("id", id)
          .single();
        if (t && t.fileUrl) {
          await deleteStorageFile(t.fileUrl);
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
            if (TABLES_WITHOUT_COMMISSARIAT.includes(effectiveTable) || TABLES_WITHOUT_COMMISSARIAT.includes(tableName)) {
              const tid = getTenantIdByName(options.scopeCommissariat);
              if (tid) {
                deleteQuery = deleteQuery.eq("tenant_id", tid);
              }
            } else {
              deleteQuery = deleteQuery.eq("commissariat", options.scopeCommissariat);
            }
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
            if (TABLES_WITHOUT_COMMISSARIAT.includes(effectiveTable) || TABLES_WITHOUT_COMMISSARIAT.includes(tableName)) {
              const tid = getTenantIdByName(options.scopeCommissariat);
              if (tid) {
                deleteQuery = deleteQuery.eq("tenant_id", tid);
              }
            } else {
              deleteQuery = deleteQuery.eq("commissariat", options.scopeCommissariat);
            }
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
          const copy = { ...item };

          // 1. Table-specific adjustments
          if (effectiveTable === "articles") {
            copy.created_at = copy.created_at || copy.createdAt || new Date().toISOString();
            copy.updated_at = copy.updated_at || copy.updatedAt || new Date().toISOString();
            delete copy.createdAt;
            delete copy.updatedAt;
            delete copy.date;
            delete copy.readTime;
          } else if (effectiveTable === "arsip") {
            copy.created_at = copy.created_at || new Date().toISOString();
          } else if (effectiveTable === "kader" || effectiveTable === "anggota" || tableName === "kader" || tableName === "anggota") {
            delete copy.allowedMenus;
            delete copy.role_detail;
            delete copy.needsOnboarding;
            delete copy.password;
          } else if (effectiveTable === "evaluations") {
            if (copy.sessionScores && typeof copy.sessionScores === "object") {
              const cleanedScores = { ...copy.sessionScores };
              delete cleanedScores.__quizMeta;
              copy.sessionScores = cleanedScores;
            }
            delete copy.created_at;
            delete copy.createdAt;
            if (copy.catatanFasilitator) {
              copy.notes = copy.notes || copy.catatanFasilitator;
              delete copy.catatanFasilitator;
            }
          } else if (effectiveTable === "komisariat") {
            if (copy.establishedDate === "" || (typeof copy.establishedDate === "string" && !copy.establishedDate.trim())) {
              copy.establishedDate = null;
            }
          }

          // 2. General date sanitization: convert empty date strings to null
          for (const key of Object.keys(copy)) {
            if (
              (key.toLowerCase().includes("date") || key.toLowerCase().includes("tanggal")) &&
              typeof copy[key] === "string" &&
              copy[key].trim() === ""
            ) {
              copy[key] = null;
            }
          }

          // 3. Sinkronisasi otomatis relasi Foreign Key tenant_id untuk multi-tenant
          if (effectiveTable !== "tenant" && effectiveTable !== "komisariat") {
            const commStr = typeof copy.commissariat === "string" ? copy.commissariat.toLowerCase() : "";
            const isCabang =
              copy.tenant_id === CABANG_TENANT_ID ||
              copy.komisariat_id === CABANG_TENANT_ID ||
              copy.tenant_id === "c0000000-0000-0000-0000-000000000001" ||
              copy.komisariat_id === "c0000000-0000-0000-0000-000000000001" ||
              commStr.includes("cabang") ||
              commStr.includes("pc pmii") ||
              commStr.includes("pc grobogan");

            if (isCabang) {
              copy.tenant_id = CABANG_TENANT_ID;
            } else {
              const commName = copy.commissariat || copy.komisariat || copy.perguruanTinggi || copy.campus;
              let resolvedId = (commName ? getTenantIdByName(commName) : null) || copy.tenant_id || copy.komisariat_id;
              if (resolvedId === "33333333-3333-3333-3333-333333333333") resolvedId = "2342112a-7413-4151-9998-3a13e833902f";
              if (resolvedId === "44444444-4444-4444-4444-444444444444") resolvedId = "2eae53a7-28ff-40b5-95f1-69f85d179d8e";
              if (resolvedId === "c0000000-0000-0000-0000-000000000001") resolvedId = CABANG_TENANT_ID;
              if (resolvedId && isValidUUID(resolvedId)) {
                copy.tenant_id = resolvedId;
              } else {
                copy.tenant_id = CABANG_TENANT_ID;
              }
            }
          }

          // 4. Hapus kolom 'commissariat' & 'komisariat_id' untuk tabel operasional yang sudah menggunakan Foreign Key murni (tenant_id)
          if (TABLES_WITHOUT_COMMISSARIAT.includes(effectiveTable) || TABLES_WITHOUT_COMMISSARIAT.includes(tableName)) {
            delete copy.commissariat;
            delete copy.komisariat_id;
          }

          // 5. Pastikan kolom id & user_id bertipe UUID valid untuk tabel PostgreSQL bertipe UUID
          if (["anggota", "kader", "users", "tenant", "kegiatan", "surat", "arsip", "kaderisasi", "evaluations", "pengurus"].includes(effectiveTable)) {
            if (copy.id && !isValidUUID(copy.id)) {
              copy.id = generateUUID();
            }
            if (copy.user_id && !isValidUUID(copy.user_id)) {
              copy.user_id = copy.id;
            }
          }

          return copy;
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

          // Self-healing for invalid date input syntax: convert all empty strings to null
          if (upsertError.message.includes("invalid input syntax for type date")) {
            console.warn(`[Date Type Healing] ${effectiveTable}: Mendeteksi sintaks input tanggal kosong, mengonversi string kosong menjadi null...`);
            currentList = currentList.map((item: any) => {
              const copy = { ...item };
              for (const k of Object.keys(copy)) {
                if (copy[k] === "") {
                  copy[k] = null;
                }
              }
              return copy;
            });
            attempts++;
            continue;
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

          // Self-healing for foreign key constraint violations (e.g. invalid tenant_id / komisariat_id)
          if (
            upsertError.code === "23503" ||
            upsertError.message.includes("violates foreign key constraint")
          ) {
            console.warn(
              `[Foreign Key Healing] ${effectiveTable}: Pelanggaran foreign key terdeteksi (${upsertError.message}), mereset tenant_id menjadi null untuk mencoba ulang...`
            );
            currentList = currentList.map((item: any) => {
              const copy = { ...item };
              copy.tenant_id = null;
              delete copy.komisariat_id;
              return copy;
            });
            attempts++;
            continue;
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
