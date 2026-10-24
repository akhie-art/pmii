import {
  CadreFollowUp,
  EventActivity,
  ParticipantRegistration,
  Requirement,
  CommissariatList,
  BoardMember,
  UserAccount,
  ParticipantEvaluation,
  Kaderisasi,
  Article,
  CertificateLayoutConfig,
  SuratTemplate
} from "./types";

// LocalStorage Keys
export const KEYS = {
  CADRES: "PMII_FOLLOWUP_CADRES",
  REQUIREMENTS: "PMII_FOLLOWUP_REQUIREMENTS",
  EVENTS: "PMII_KOMISARIAT_EVENTS",
  REGISTRATIONS: "PMII_KOMISARIAT_REGISTRATIONS",
  BOARDS: "PMII_KOMISARIAT_BOARD",
  COMMISSARIATS: "PMII_KOMISARIAT_LIST",
  USERS: "PMII_USER_ACCOUNTS",
  CREDENTIALS: "PMII_USER_CREDENTIALS",
  KADERISASI: "PMII_KADERISASI",
  KURIKULUM: "PMII_KURIKULUM",
  ARTICLES: "PMII_ARTICLES_DATA",
  ARSIP: "PMII_ARSIP_DOCUMENTS",
  EVALUATIONS: "PMII_PARTICIPANT_EVALUATIONS",
  SURAT: "PMII_SURAT_DATA",
  SURAT_TEMPLATES: "PMII_SURAT_TEMPLATES",
};

export const DEFAULT_SURAT_TEMPLATES: SuratTemplate[] = [];

export const DEFAULT_CERT_CONFIG: CertificateLayoutConfig = {
  nama: { x: 35.0, y: 29.2, fontSize: 13, color: "#0f172a", align: "left", fontWeight: "bold", bold: true, enabled: true },
  nomor: { x: 50.0, y: 13.8, fontSize: 13, color: "#1e3a8a", align: "center", fontWeight: "normal", bold: false, enabled: true },
  nik: { x: 35.0, y: 31.4, fontSize: 12, color: "#0f172a", align: "left", fontWeight: "normal", bold: false, enabled: true },
  ttl: { x: 35.0, y: 33.6, fontSize: 12, color: "#0f172a", align: "left", fontWeight: "normal", bold: false, enabled: true },
  jurusan: { x: 35.0, y: 35.8, fontSize: 12, color: "#0f172a", align: "left", fontWeight: "normal", bold: false, enabled: true },
  kampus: { x: 35.0, y: 38.0, fontSize: 12, color: "#0f172a", align: "left", fontWeight: "normal", bold: false, enabled: true },
  fontFamily: 'Poppins, var(--font-poppins), sans-serif',
  paperSize: "A4",
  numberSegments: ["010", "01", "091222", "001", "12", "2026"]
};

export const DEFAULT_CADRES: CadreFollowUp[] = [];
export const DEFAULT_EVENTS: EventActivity[] = [];
export const DEFAULT_REGISTRATIONS: ParticipantRegistration[] = [];

export const DEFAULT_REQUIREMENTS: Requirement[] = [];

export const DEFAULT_COMMISSARIATS: CommissariatList[] = [
  {
    id: "13aea81b-ca8c-43c2-b44f-7d70cdc11f7f",
    name: "Komisariat Ki Ageng Getas Pendawa",
    university: "Universitas An Nuur",
    contactEmail: "getaspendawa@pmii.org",
    establishedYear: 2018,
    structure: {
      period: "2026 - 2027",
      chairman: "",
      secretary: "",
      treasurer: "",
      chairman_id: null,
      secretary_id: null,
      treasurer_id: null
    },
    logo: "https://fmmimbdsenazexeytuge.supabase.co/storage/v1/object/public/komisariat/komisariat-ki-ageng-getas-pendawa-1791910240206.png",
    rayons: [],
    level: "KOMISARIAT",
    type: "KOMISARIAT"
  },
  {
    id: "2342112a-7413-4151-9998-3a13e833902f",
    name: "Komisariat Ajisaka",
    university: "Sekolah Tinggi Agama Islam Grobogan",
    contactEmail: "ajisaka@pmii.org",
    establishedYear: 2020,
    structure: {
      period: "2026 - 2027",
      chairman: "",
      secretary: "",
      treasurer: "",
      chairman_id: null,
      secretary_id: null,
      treasurer_id: null
    },
    rayons: [],
    level: "KOMISARIAT",
    type: "KOMISARIAT"
  },
  {
    id: "2eae53a7-28ff-40b5-95f1-69f85d179d8e",
    name: "Komisariat Joko Suro",
    university: "Sekolah Tinggi Agama Islam Walisembilan Semarang",
    contactEmail: "jokosuro@pmii.org",
    establishedYear: 2021,
    structure: {
      period: "2026 - 2027",
      chairman: "",
      secretary: "",
      treasurer: "",
      chairman_id: null,
      secretary_id: null,
      treasurer_id: null
    },
    rayons: [],
    level: "KOMISARIAT",
    type: "KOMISARIAT"
  },
  {
    id: "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9",
    name: "Pengurus Cabang PMII Grobogan",
    university: "Kabupaten Grobogan",
    contactEmail: "pcpmiigrobogan@gmail.com",
    establishedYear: 1960,
    structure: { period: "2026 - 2027" },
    rayons: [],
    level: "KOMISARIAT",
    type: "KOMISARIAT"
  }
];

export const DEFAULT_BOARDS: BoardMember[] = [];

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "75228d23-a7f6-4bb8-9d3e-16eec5f23926",
    user_id: "75228d23-a7f6-4bb8-9d3e-16eec5f23926",
    name: "Super Administrator PMII",
    email: "admin@pmii.org",
    role: "superadmin",
    role_id: "b0000000-0000-0000-0000-000000000001",
    role_name: "superadmin",
    status: "AKTIF",
    commissariat: "Pengurus Cabang Grobogan",
    komisariat_id: "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9",
    tenant_id: "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9",
    allowedMenus: [
      "/admin",
      "/admin/kegiatan",
      "/admin/anggota",
      "/admin/kaderisasi",
      "/admin/pengurus",
      "/admin/surat",
      "/admin/arsip",
      "/admin/artikel",
      "/admin/penilaian",
      "/admin/rekap-nilai",
      "/admin/verifikasi",
      "/admin/pengguna",
      "/admin/komisariat",
      "/admin/pengaturan",
      "/admin/profil"
    ],
    createdAt: "2026-10-15T15:39:01.939562+00:00"
  }
];

export const DEFAULT_EVALUATIONS: ParticipantEvaluation[] = [];
export const DEFAULT_KADERISASI: Kaderisasi[] = [];

export const DEFAULT_ARTICLES: Article[] = [];
