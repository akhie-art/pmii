import { supabase, isSupabaseConfigured } from "./supabase";
import { isValidUUID, generateUUID } from "./utils";

// LocalStorage Keys
const KEYS = {
  CADRES: "PMII_FOLLOWUP_CADRES",
  REQUIREMENTS: "PMII_FOLLOWUP_REQUIREMENTS",
  EVENTS: "PMII_KOMISARIAT_EVENTS",
  REGISTRATIONS: "PMII_KOMISARIAT_REGISTRATIONS",
  BOARDS: "PMII_KOMISARIAT_BOARD",
  COMMISSARIATS: "PMII_KOMISARIAT_LIST",
  USERS: "PMII_USER_ACCOUNTS",
  KADERISASI: "PMII_KADERISASI",
  KURIKULUM: "PMII_KURIKULUM",
  ARTICLES: "PMII_ARTICLES_DATA",
};

// Normalization Helpers
export function normalizeKomisariat(comm: string | undefined): string {
  if (!comm) return "";
  const c = comm.trim().toLowerCase();
  if (c.includes("getas") || c.includes("pendawa") || c.includes("ki ageng") || c.includes("kgp")) return "Ki Ageng Getas Pendawa";
  if (c.includes("walisongo")) return "Ki Ageng Getas Pendawa";
  if (c.includes("diponegoro") || c.includes("undip")) return "Universitas Diponegoro";
  if (c.includes("sunan kalijaga") || c.includes("kalijaga")) return "UIN Sunan Kalijaga";
  if (c.includes("negeri semarang") || c.includes("unnes")) return "Universitas Negeri Semarang";
  return comm;
}

export function normalizeRayon(ray: string | undefined): string {
  if (!ray) return "";
  const r = ray.trim().toLowerCase();
  if (r.includes("tarbiyah")) return "Tarbiyah & Keguruan";
  if (r.includes("syariah")) return "Syariah & Hukum";
  if (r.includes("ekonomi")) return "Ekonomi & Bisnis";
  if (r.includes("adab")) return "Adab & Humaniora";
  if (r.includes("dakwah")) return "Dakwah & Komunikasi";
  if (r.includes("bahasa")) return "Bahasa & Seni";
  if (r.includes("sosial") || r.includes("fisip") || r.includes("politik")) return "Ilmu Sosial & Ilmu Politik";
  if (r.includes("ushuluddin")) return "Ushuluddin & Humaniora";
  return ray;
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

  // e.g. "Mar 2022" or "March 2022" or "Maret 2022"
  const match = trimmed.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (match) {
    const monthName = match[1].toLowerCase().slice(0, 3);
    const year = match[2];
    const monthCode = monthMap[monthName];
    if (monthCode) {
      return `${year}-${monthCode}-01`;
    }
  }

  // Attempt standard Date parsing
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

// Generic Fetch/Save Helpers with Fallbacks and Auto-Seeding
async function getTableData<T>(tableName: string, localStorageKey: string, defaultData: T[] = []): Promise<T[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) {
        console.error(`Supabase read error on ${tableName}:`, error.message);
      } else if (data) {
        let mergedData = data;
        if (localStorageKey && typeof window !== "undefined") {
          const stored = localStorage.getItem(localStorageKey);
          if (stored) {
            try {
              const localList = JSON.parse(stored) as any[];
              mergedData = data.map((remoteItem: any) => {
                const localItem = localList.find(l => l.id === remoteItem.id);
                return {
                  ...localItem, // Preserve local-only fields
                  ...remoteItem  // Apply remote changes
                };
              });
            } catch (e) {
              console.error(`Error merging local data for ${tableName}:`, e);
            }
          }
          localStorage.setItem(localStorageKey, JSON.stringify(mergedData));
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
    } catch (err) {
      console.error(`Failed to connect to Supabase for ${tableName}:`, err);
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
        console.error(`Error parsing localStorage for ${localStorageKey}:`, e);
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

function extractMissingColumn(errorMessage: string): string | null {
  // Pattern 1: Could not find the 'column_name' column of 'table_name' in the schema cache
  const match1 = errorMessage.match(/Could not find the '([^']+)' column/i);
  if (match1) return match1[1];

  // Pattern 2: column "column_name" of relation "table_name" does not exist
  const match2 = errorMessage.match(/column "([^"]+)" of relation/i);
  if (match2) return match2[1];

  // Pattern 3: column "column_name" does not exist
  const match3 = errorMessage.match(/column "([^"]+)" does not exist/i);
  if (match3) return match3[1];

  return null;
}

async function saveTableData<T extends { id: string | number }>(
  tableName: string,
  localStorageKey: string,
  dataList: T[]
): Promise<boolean> {
  // Ensure every record has a valid UUID for PostgreSQL UUID primary key compatibility
  const sanitizedList = dataList.map(item => ({
    ...item,
    id: isValidUUID(String(item.id)) ? String(item.id) : generateUUID()
  })) as T[];

  // Always save to LocalStorage first to guarantee fallback persistence
  if (localStorageKey && typeof window !== "undefined") {
    localStorage.setItem(localStorageKey, JSON.stringify(sanitizedList));
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const newIds = sanitizedList.map(item => item.id);

      if (newIds.length > 0) {
        const formattedIds = `(${newIds.map(id => `"${id}"`).join(",")})`;
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .not("id", "in", formattedIds);
        if (deleteError) {
          console.error(`Supabase sync delete error on ${tableName}:`, deleteError.message);
        }
      } else {
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (deleteError) {
          console.error(`Supabase sync clear error on ${tableName}:`, deleteError.message);
        }
      }

      // Upsert the remaining list with automatic column self-healing
      if (sanitizedList.length > 0) {
        let currentList = sanitizedList.map((item: any) => {
          if (tableName === "articles") {
            const copy = { ...item };
            copy.created_at = copy.created_at || copy.createdAt || new Date().toISOString();
            copy.updated_at = copy.updated_at || copy.updatedAt || new Date().toISOString();
            delete copy.createdAt;
            delete copy.updatedAt;
            delete copy.date;
            delete copy.readTime;
            return copy;
          }
          return { ...item };
        });
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
          const { error: upsertError } = await supabase
            .from(tableName)
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
              console.warn(`Supabase write warning on ${tableName}: column '${missingColumn}' not found in schema cache. Retrying without it...`);
              currentList = currentList.map((item) => {
                const copy = { ...item };
                delete copy[missingColumn];
                return copy;
              });
              attempts++;
              continue;
            }
          }
          
          console.error(`Supabase write error on ${tableName}:`, upsertError.message);
          break; // Non-schema or unresolvable error, abort loop
        }
      } else {
        return true;
      }
    } catch (err) {
      console.error(`Failed to upsert to Supabase for ${tableName}:`, err);
    }
  }
  return true; // Succeeded in LocalStorage fallback
}

// -------------------------------------------------------------
// Database Interfaces
// -------------------------------------------------------------

export interface CadreSubmission {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  fileLink: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback: string;
}

export interface CadreFollowUp {
  id: string;
  name: string;
  level: "MAPABA" | "PKD" | "PKL";
  commissariat: string;
  rayon?: string;
  startDate: string;
  status: "AKTIF" | "SELESAI" | "REVISI";
  submissions: CadreSubmission[];
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
  isGraduated?: boolean;
  nta?: string;
  nipa?: string;
  registrationNumber?: string;
  created_at?: string;
  password?: string;
  role?: UserRole;

  // Rich member profile fields
  angkatan?: string;
  memberStatus?: "Aktif" | "Alumni" | "Pasif";
  jabatan?: string;
  gender?: "Laki-laki" | "Perempuan";
  history?: CadreHistory[];
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  nik?: string;
  ktpName?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamatRumah?: string;
  alamatDomisili?: string;
  pendidikanSD?: string;
  pendidikanSMP?: string;
  pendidikanSMA?: string;
  perguruanTinggi?: string;
  fakultas?: string;
  jurusan?: string;
  ktmName?: string;
  twitter?: string;
  facebook?: string;
  pasFotoName?: string;
  avatar?: string;
  riwayatPenyakit?: string;
  golonganDarah?: string;
  organisasiSD?: string;
  organisasiSMP?: string;
  organisasiSMA?: string;
  organisasiPT?: string;
  orientasiProfetik?: string;
  minatPassion?: string;
  motivasiMapaba?: string;
}

export interface CadreHistory {
  level: string;
  date: string;
  location: string;
  status: string;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "file";
  required: boolean;
  options?: string[];
}

export interface EventActivity {
  id: string;
  name: string;
  level: string;
  date: string;
  commissariat: string;
  description: string;
  status: "OPEN" | "CLOSED";
  formFields?: FormField[];
  sessions?: string[];
}

export interface ParticipantRegistration {
  id: string;
  eventId: string;
  cadreName: string;
  cadreRayon?: string;
  cadreEmail: string;
  dateApplied: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string;
  answers: Record<string, string>;
  verificationStatus: Record<string, boolean>;
  attendance?: string[];
  isGraduated?: boolean;
  registrationNumber?: string;
}

export interface Requirement {
  id: string;
  level: "MAPABA" | "PKD" | "PKL";
  title: string;
  description: string;
  type?: string;
  category?: string;
  minSubmissions?: number;
}

export interface BoardMember {
  id: string;
  name: string;
  period: string;
  phone?: string;
  email?: string;
  commissariat?: string;
  rayon?: string;
  role?: string;
  position?: string;
  department?: string;
  gender?: string;
  status?: string;
  avatar?: string;
}

export interface KomisariatRayon {
  id: string;
  name: string;
  memberCount: number;
}

export interface KomisariatStructure {
  chairman: string;
  secretary: string;
  treasurer: string;
  period: string;
}

export interface CommissariatList {
  id: string;
  name: string;
  university: string;
  establishedDate: string;
  status: "AKTIF" | "PERSUPERVISION" | "INAKTIF";
  logoInitial: string;
  contactEmail: string;
  accreditation: "A" | "B" | "C" | "Belum Akreditasi";
  structure: KomisariatStructure;
  rayons: KomisariatRayon[];
}

export type UserRole = 
  | "admin" 
  | "pengurus" 
  | "anggota" 
  | "peserta" 
  | "ADMIN" 
  | "PENGURUS" 
  | "ANGGOTA" 
  | "PESERTA" 
  | "KOMISARIAT";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  commissariat?: string;
  rayon?: string;
  status: "AKTIF" | "NONAKTIF";
  createdAt: string;
  allowedMenus?: string[];
  avatar?: string;
}

export interface KaderisasiFile {
  fileUrl: string;
  fileName: string;
  fileSize: string;
}

export interface KaderisasiMateri {
  id: string;
  judul: string;
  deskripsi?: string;
  durasi?: number; // dalam menit
}

export interface Kaderisasi {
  id: string;
  nama: string;
  tipe: "FORMAL" | "INFORMAL" | "NON_FORMAL";
  createdAt: string;
  formFields?: FormField[];
  materi?: KaderisasiMateri[];
  syllabus?: KaderisasiFile;
  modul?: KaderisasiFile;
}

export interface SyllabusItem {
  id: string;
  subjectName: string;
  durationHours: number;
  description?: string;
  goal?: string;
  category?: "Doktrin Ideologi" | "Keorganisasian" | "Keindonesiaan & Kebangsaan" | "Wacana Kontemporer" | "Keterampilan Gerakan" | string;
  tujuan?: string[];
  pokokPembahasan?: string[];
  metode?: string[];
  prosesKegiatan?: string[];
  harapan?: string[];
}

export interface FileAttachment {
  name: string;
  size: string;
  url: string;
}

export interface MaterialFile {
  id: string;
  title?: string;
  fileName: string;
  fileSize: string;
  downloadCount: number;
  description?: string;
  fileUrl?: string;
  referensi?: string;
  materialFiles?: FileAttachment[];
  referensiFiles?: FileAttachment[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  subjectName?: string;
  materialTitle?: string;
}

export interface KaderisasiLevel {
  id: string;
  name: string;
  syllabus: SyllabusItem[];
  materials: MaterialFile[];
  quiz: QuizQuestion[];
}

// -------------------------------------------------------------
// Database Operations
// -------------------------------------------------------------

export const db = {
  // Cadres FollowUp
  getCadres: async (defaultData: CadreFollowUp[] = DEFAULT_CADRES): Promise<CadreFollowUp[]> => {
    let list = await getTableData<CadreFollowUp>("kader", KEYS.CADRES, defaultData);
    // Filter out dummy cadres if any exist in local storage cache
    list = list.filter(c => 
      c.id !== "cadre-1" && 
      c.id !== "cadre-2" && 
      c.id !== "user-anggota" && 
      c.id !== "user-peserta" &&
      c.name !== "Sahabat Anggota" && 
      c.name !== "Calon Anggota"
    );
    // Normalize fields on read
    return list.map(c => ({
      ...c,
      commissariat: normalizeKomisariat(c.commissariat),
      rayon: normalizeRayon(c.rayon)
    }));
  },
  saveCadres: async (cadresList: CadreFollowUp[]): Promise<boolean> => {
    const normalized = cadresList.map(c => {
      return {
        ...c,
        created_at: c.created_at || new Date().toISOString(),
        commissariat: normalizeKomisariat(c.commissariat),
        rayon: normalizeRayon(c.rayon),
        startDate: normalizeDateString(c.startDate)
      };
    });
    return saveTableData<any>("kader", KEYS.CADRES, normalized);
  },

  // Events/Activities
  getEvents: async (defaultData: EventActivity[] = DEFAULT_EVENTS): Promise<EventActivity[]> => {
    const list = await getTableData<EventActivity>("kegiatan", KEYS.EVENTS, defaultData);
    return list.map(e => ({
      ...e,
      formFields: e.formFields || (e as any).formfields || [],
      commissariat: normalizeKomisariat(e.commissariat)
    }));
  },
  saveEvents: async (eventsList: EventActivity[]): Promise<boolean> => {
    const normalized = eventsList.map(e => {
      const { formFields, ...rest } = e as any;
      return {
        ...rest,
        created_at: (e as any).created_at || new Date().toISOString(),
        commissariat: normalizeKomisariat(e.commissariat)
      };
    });
    return saveTableData<EventActivity>("kegiatan", KEYS.EVENTS, normalized as any);
  },

  // Event Registrations
  getRegistrations: async (defaultData: ParticipantRegistration[] = DEFAULT_REGISTRATIONS): Promise<ParticipantRegistration[]> => {
    const list = await getTableData<ParticipantRegistration>("pendaftaran", KEYS.REGISTRATIONS, defaultData);
    return list.map(r => ({
      ...r,
      cadreRayon: normalizeRayon(r.cadreRayon)
    }));
  },
  saveRegistrations: async (regsList: ParticipantRegistration[]): Promise<boolean> => {
    const normalized = regsList.map(r => ({
      ...r,
      eventId: isValidUUID(r.eventId) ? r.eventId : generateUUID(),
      created_at: (r as any).created_at || new Date().toISOString(),
      cadreRayon: normalizeRayon(r.cadreRayon)
    }));
    return saveTableData<ParticipantRegistration>("pendaftaran", KEYS.REGISTRATIONS, normalized);
  },

  // Requirements (Tugas RKTL)
  getRequirements: async (defaultData: Requirement[] = DEFAULT_REQUIREMENTS): Promise<Requirement[]> => {
    return getTableData<Requirement>("persyaratan", KEYS.REQUIREMENTS, defaultData);
  },
  saveRequirements: async (reqsList: Requirement[]): Promise<boolean> => {
    const normalized = reqsList.map(req => ({
      ...req,
      created_at: (req as any).created_at || new Date().toISOString()
    }));
    return saveTableData<Requirement>("persyaratan", KEYS.REQUIREMENTS, normalized);
  },

  // Board Members
  getBoards: async (defaultData: BoardMember[] = DEFAULT_BOARDS): Promise<BoardMember[]> => {
    const list = await getTableData<BoardMember>("pengurus", KEYS.BOARDS, defaultData);
    return list.map(b => ({
      ...b,
      commissariat: b.commissariat ? normalizeKomisariat(b.commissariat) : "",
      rayon: b.rayon ? normalizeRayon(b.rayon) : ""
    }));
  },
  saveBoards: async (boardsList: BoardMember[]): Promise<boolean> => {
    const normalized = boardsList.map(b => ({
      ...b,
      created_at: (b as any).created_at || new Date().toISOString(),
      commissariat: b.commissariat ? normalizeKomisariat(b.commissariat) : "",
      rayon: b.rayon ? normalizeRayon(b.rayon) : ""
    }));
    return saveTableData<BoardMember>("pengurus", KEYS.BOARDS, normalized);
  },

  // Commissariat List
  getCommissariats: async (defaultData: CommissariatList[] = DEFAULT_COMMISSARIATS): Promise<CommissariatList[]> => {
    return getTableData<CommissariatList>("komisariat", KEYS.COMMISSARIATS, defaultData);
  },
  saveCommissariats: async (commList: CommissariatList[]): Promise<boolean> => {
    const normalized = commList.map(c => ({
      ...c,
      created_at: (c as any).created_at || new Date().toISOString()
    }));
    return saveTableData<CommissariatList>("komisariat", KEYS.COMMISSARIATS, normalized);
  },

  // User Accounts
  getUsers: async (defaultData: UserAccount[] = DEFAULT_USERS): Promise<UserAccount[]> => {
    let list = await getTableData<UserAccount>("pengguna", KEYS.USERS, defaultData);
    
    // Filter out old dummy accounts
    list = list.filter(u => 
      !u.email.includes("pk.walisongo@") && 
      !u.email.includes("pr.tarbiyah@") && 
      !u.email.includes("cabang@") &&
      u.id !== "user-komisariat" &&
      u.id !== "user-rayon" &&
      u.id !== "user-anggota" &&
      u.id !== "user-peserta" &&
      u.email !== "anggota@pmii.org" &&
      u.email !== "peserta@pmii.org"
    );

    // If list becomes empty, ensure single admin account is active
    if (list.length === 0) {
      list = [...DEFAULT_USERS];
    }

    return list.map(u => ({
      ...u,
      role: (u.role as any) === "CABANG" ? "ADMIN" : u.role,
      commissariat: u.commissariat ? normalizeKomisariat(u.commissariat) : "Ki Ageng Getas Pendawa",
      rayon: u.rayon ? normalizeRayon(u.rayon) : ""
    }));
  },
  saveUsers: async (usersList: UserAccount[]): Promise<boolean> => {
    const normalized = usersList.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      commissariat: u.commissariat ? normalizeKomisariat(u.commissariat) : "",
      rayon: u.rayon ? normalizeRayon(u.rayon) : "",
      status: u.status,
      allowedMenus: u.allowedMenus || [],
      avatar: u.avatar,
      createdAt: u.createdAt || (u as any).created_at || new Date().toISOString()
    }));
    return saveTableData<UserAccount>("pengguna", KEYS.USERS, normalized);
  },

  // Kaderisasi
  getKaderisasi: async (): Promise<Kaderisasi[]> => {
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
            materi: d.materi || []
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
            materi: d.materi || []
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
  },
  saveKaderisasi: async (kaderisasiList: Kaderisasi[]): Promise<boolean> => {
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
          createdAt: k.createdAt || (k as any).created_at || new Date().toISOString()
        }));

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
            .neq("id", "_none_");
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
    return true; // Return true because it succeeded in LocalStorage fallback
  },
  // Surat (Mail)
  getSurat: async (): Promise<any[]> => {
    return getTableData<any>("surat", "");
  },
  saveSurat: async (suratList: any[]): Promise<boolean> => {
    const normalized = suratList.map(s => ({
      ...s,
      created_at: s.created_at || new Date().toISOString()
    }));
    return saveTableData<any>("surat", "", normalized);
  },

  // Arsip (Drive Documents)
  getArsip: async (): Promise<any[]> => {
    return getTableData<any>("arsip", "");
  },
  saveArsip: async (arsipList: any[]): Promise<boolean> => {
    const normalized = arsipList.map(a => ({
      ...a,
      created_at: a.created_at || new Date().toISOString()
    }));
    return saveTableData<any>("arsip", "", normalized);
  },
  getKurikulum: async (): Promise<Record<string, KaderisasiLevel> | null> => {
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
    // LocalStorage Fallback (only if Supabase is not configured or failed to connect)
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
  },
  saveKurikulum: async (kurikulumData: Record<string, KaderisasiLevel>): Promise<boolean> => {
    // Save to LocalStorage first to guarantee persistence in fallback mode
    if (typeof window !== "undefined") {
      localStorage.setItem(KEYS.KURIKULUM, JSON.stringify(kurikulumData));
    }

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      try {
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
  },
  getArticles: async (): Promise<Article[]> => {
    const list = await getTableData<Article>("articles", KEYS.ARTICLES, DEFAULT_ARTICLES);
    return list.map((item: any) => {
      const dateVal = item.createdAt || item.created_at || item.date || new Date().toISOString();
      return {
        ...item,
        createdAt: dateVal,
        created_at: dateVal,
      };
    });
  },
  saveArticles: async (articles: Article[]): Promise<boolean> => {
    const sanitized = articles.map((item: any) => {
      const dateVal = item.createdAt || item.created_at || item.date || new Date().toISOString();
      return {
        ...item,
        createdAt: dateVal,
        created_at: dateVal,
      };
    });
    return saveTableData<Article>("articles", KEYS.ARTICLES, sanitized);
  },
  likeArticle: async (articleId: string): Promise<number> => {
    const articles = await getTableData<Article>("articles", KEYS.ARTICLES, DEFAULT_ARTICLES);
    let newLikes = 0;
    const updated = articles.map((a) => {
      if (a.id === articleId || a.slug === articleId) {
        newLikes = (a.likes || 0) + 1;
        return { ...a, likes: newLikes };
      }
      return a;
    });
    await saveTableData<Article>("articles", KEYS.ARTICLES, updated);
    return newLikes;
  },
};

// -------------------------------------------------------------
// Centralized Default Seed Data
// -------------------------------------------------------------

export const DEFAULT_CADRES: CadreFollowUp[] = [];
export const DEFAULT_EVENTS: EventActivity[] = [];
export const DEFAULT_REGISTRATIONS: ParticipantRegistration[] = [];
export const DEFAULT_REQUIREMENTS: Requirement[] = [];
export const DEFAULT_COMMISSARIATS: CommissariatList[] = [
  {
    id: "kom-kgp",
    name: "PK PMII Ki Ageng Getas Pendawa",
    university: "Komisariat Ki Ageng Getas Pendawa",
    establishedDate: "1970-04-17",
    status: "AKTIF",
    logoInitial: "KGP",
    contactEmail: "-",
    accreditation: "A",
    structure: {
      chairman: "-",
      secretary: "-",
      treasurer: "-",
      period: "2026 - 2027"
    },
    rayons: []
  }
];

export const DEFAULT_BOARDS: BoardMember[] = [];
export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "user-admin",
    name: "Admin PK PMII Ki Ageng Getas Pendawa",
    email: "admin@pmii.org",
    password: "password",
    role: "admin",
    commissariat: "Ki Ageng Getas Pendawa",
    status: "AKTIF",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "user-pengurus",
    name: "Pengurus PK PMII Ki Ageng Getas Pendawa",
    email: "pengurus@pmii.org",
    password: "password",
    role: "pengurus",
    commissariat: "Ki Ageng Getas Pendawa",
    status: "AKTIF",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];

export const DEFAULT_KADERISASI: Kaderisasi[] = [];

export function formatArticleDate(input?: any): string {
  let dateVal: any = input;
  if (typeof input === "object" && input !== null && !(input instanceof Date)) {
    dateVal = input.createdAt || input.created_at || input.date || input.establishedDate;
  }

  if (!dateVal) {
    dateVal = new Date();
  }

  try {
    let d: Date;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else {
      d = new Date(String(dateVal));
    }

    if (isNaN(d.getTime())) {
      const parsed = Date.parse(String(dateVal));
      if (!isNaN(parsed)) {
        d = new Date(parsed);
      } else {
        return String(dateVal);
      }
    }

    const dayName = d.toLocaleDateString("id-ID", { weekday: "long" });
    const dateFormatted = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${dayName}, ${dateFormatted}, pukul ${hours}.${minutes} WIB`;
  } catch {
    return String(dateVal || "");
  }
}

export interface Article {
  id: string;
  slug?: string;
  title: string;
  category: string;
  excerpt: string;
  content: string[];
  authorName: string;
  authorRole: string;
  authorInitials: string;
  image: string;
  tags: string[];
  status: "DITAMPILKAN" | "DRAFT" | "ARSIP";
  views?: number;
  likes?: number;
  commissariat?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  date?: string;
}

export const DEFAULT_ARTICLES: Article[] = [
  {
    id: "art-1",
    slug: "refleksi-mapaba-menumbuhkan-daya-kritis",
    title: "Refleksi Mapaba: Menumbuhkan Daya Kritis & Komitmen Nilai Kader Ulul Albab",
    category: "Kaderisasi",
    excerpt: "Masa Penerimaan Anggota Baru (Mapaba) bukan sekadar gerbang masuk, melainkan ruang pembongkaran stagnasi berpikir mahasiswa.",
    content: [
      "Masa Penerimaan Anggota Baru (Mapaba) merupakan fase inisiasi paling sakral dalam perjalanan seorang kader PMII. Di sini, nilai-nilai dasar pergerakan (NDP) diperkenalkan bukan hanya sebagai doktrin teks kaku, melainkan sebagai kacamata analitis dalam membedah realitas sosial-kemasyarakatan.",
      "Tantangan generasi muda di era serbuan informasi menuntut kader PMII untuk memiliki daya saring intelektual yang kokoh. Paradigma kritis transformatif mendorong setiap anggota untuk tidak pasif menerima narasi dominan, melainkan senantiasa bertanya dan menghadirkan solusi konkret.",
      "Melalui kaderisasi yang terstruktur dan pendampingan pasca-Mapaba, PK PMII Ki Ageng Getas Pendawa berkomitmen melahirkan pribadi Ulul Albab yang memadukan kedalaman spiritual, keluasan ilmu pengetahuan, dan ketulusan pengabdian sosial."
    ],
    authorName: "Ahmad Farisi",
    authorRole: "Biro Kaderisasi & Litbang",
    authorInitials: "AF",
    image: "/image/kaderisasi.jpg",
    tags: ["Mapaba", "Kaderisasi", "Ulul Albab"],
    status: "DITAMPILKAN",
    views: 342,
    likes: 48,
    commissariat: "Ki Ageng Getas Pendawa",
    createdAt: "2026-09-18T08:00:00.000Z",
    created_at: "2026-09-18T08:00:00.000Z"
  },
  {
    id: "art-2",
    slug: "meneguhkan-aswaja-an-nahdliyah",
    title: "Meneguhkan Aswaja An-Nahdliyah dalam Dinamika Kebangsaan Kontemporer",
    category: "Opini & Pergerakan",
    excerpt: "Prinsip tawasuth, tawazun, tasamuh, dan i'tidal menjadi kompas moral kader pergerakan dalam mengawal keutuhan bangsa dan keadilan sosial.",
    content: [
      "Ahlussunnah wal Jama'ah (Aswaja) bukan sekadar madzhab pemikiran keagamaan, melainkan manhaj al-fikr (metodologi berpikir) yang lentur namun kokoh dalam merespons dinamika perubahan zaman.",
      "Kader PMII Ki Ageng Getas Pendawa senantiasa menginternalisasikan empat pilar Aswaja: Tawasuth (moderat), Tawazun (seimbang), Tasamuh (toleran), dan I'tidal (adil). Keempat nilai ini menjadi benteng penangkal ekstremisme sekaligus pendorong perjuangan membela kaum mustadh'afin.",
      "Di tengah polarisasi wacana dan tantangan kebangsaan, kehadiran kader PMII yang inklusif dan berakar pada tradisi keilmuan pesantren merupakan modal sosial penting bagi peradaban kemanusiaan."
    ],
    authorName: "M. Zulkarnain",
    authorRole: "Ketua Komisariat",
    authorInitials: "MZ",
    image: "/image/landing_page.png",
    tags: ["Aswaja", "Ideologi", "Kebangsaan"],
    status: "DITAMPILKAN",
    views: 520,
    likes: 64,
    commissariat: "Ki Ageng Getas Pendawa",
    createdAt: "2026-09-12T09:30:00.000Z",
    created_at: "2026-09-12T09:30:00.000Z"
  },
  {
    id: "art-3",
    slug: "modernisasi-persuratan-digital",
    title: "Modernisasi Persuratan Digital: Efisiensi Birokrasi Menuju Organisasi Adaptif",
    category: "Tata Kelola",
    excerpt: "Transformasi pengelolaan arsip, nomor surat digital, dan verifikasi sertifikat mempercepat akselerasi kerja-kerja organisasi di tingkat komisariat dan rayon.",
    content: [
      "Era digital mengharuskan organisasi pergerakan untuk mereformasi tata kelola administrasinya. Ketertiban surat-menyurat dan keabsahan dokumen adalah cerminan profesionalisme sebuah organisasi kader yang maju.",
      "Dengan implementasi portal digital terpadu di PK PMII Ki Ageng Getas Pendawa, proses penerbitan nomor surat resmi, legalisir sertifikat pelatihan, dan pencatatan inventaris kini dapat diselesaikan secara terverifikasi dalam hitungan menit.",
      "Sistem ini tidak hanya menghemat penggunaan kertas dan ruang arsip fisik, namun juga menghadirkan keterbukaan data riwayat kader yang transparan dan akuntabel bagi seluruh pengurus."
    ],
    authorName: "Siti Rahmawati",
    authorRole: "Sekretaris Komisariat",
    authorInitials: "SR",
    image: "/image/administrasi.jpg",
    tags: ["Digitalisasi", "Administrasi", "Tata Kelola"],
    status: "DITAMPILKAN",
    views: 285,
    likes: 35,
    commissariat: "Ki Ageng Getas Pendawa",
    createdAt: "2026-09-08T14:15:00.000Z",
    created_at: "2026-09-08T14:15:00.000Z"
  }
];


