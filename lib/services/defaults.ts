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
  nama: { x: 148.5, y: 110, fontSize: 24, color: "#0f172a", align: "center", fontWeight: "bold" },
  nomor: { x: 148.5, y: 88, fontSize: 13, color: "#1e3a8a", align: "center", fontWeight: "normal" },
  nik: { x: 148.5, y: 122, fontSize: 12, color: "#334155", align: "center", fontWeight: "normal" },
  ttl: { x: 148.5, y: 130, fontSize: 12, color: "#334155", align: "center", fontWeight: "normal" },
  jurusan: { x: 148.5, y: 138, fontSize: 12, color: "#334155", align: "center", fontWeight: "normal" },
  kampus: { x: 148.5, y: 146, fontSize: 12, color: "#334155", align: "center", fontWeight: "bold" },
  fontFamily: '"Arial Narrow", Arial, sans-serif',
  paperSize: "F4",
  numberSegments: ["010", "01", "091222", "001", "12", "2025"]
};

export const DEFAULT_CADRES: CadreFollowUp[] = [];
export const DEFAULT_EVENTS: EventActivity[] = [];
export const DEFAULT_REGISTRATIONS: ParticipantRegistration[] = [];

export const DEFAULT_REQUIREMENTS: Requirement[] = [];

export const DEFAULT_COMMISSARIATS: CommissariatList[] = [];

export const DEFAULT_BOARDS: BoardMember[] = [];

export const DEFAULT_USERS: UserAccount[] = [];

export const DEFAULT_EVALUATIONS: ParticipantEvaluation[] = [];
export const DEFAULT_KADERISASI: Kaderisasi[] = [];

export const DEFAULT_ARTICLES: Article[] = [];
