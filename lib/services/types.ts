import type { CareerAssessmentResult } from "../careerAssessment";

export interface CadreSubmission {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  fileLink: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  feedback?: string;
}

export interface CadreHistory {
  level: string;
  date: string;
  location: string;
  status: string;
  id?: string;
  title?: string;
  description?: string;
  author?: string;
}

export type UserRole = 
  | "admin" 
  | "pengurus" 
  | "instruktur"
  | "anggota" 
  | "peserta" 
  | "ADMIN" 
  | "PENGURUS" 
  | "INSTRUKTUR"
  | "ANGGOTA" 
  | "PESERTA" 
  | "KOMISARIAT";

export interface CadreFollowUp {
  id: string;
  user_id?: string;
  name: string;
  level: "MAPABA" | "PKD" | "PKL" | string;
  commissariat: string;
  rayon?: string;
  startDate?: string;
  status: "AKTIF" | "SELESAI" | "REVISI" | string;
  submissions: CadreSubmission[];
  phone?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  instagram?: string;
  isGraduated?: boolean;
  nta?: string;
  nipa?: string;
  registrationNumber?: string;
  created_at?: string;
  password?: string;
  role?: UserRole | string;

  // Rich member profile fields
  angkatan?: string;
  generation?: string;
  memberStatus?: "Aktif" | "Alumni" | "Pasif" | string;
  jabatan?: string;
  gender?: "Laki-laki" | "Perempuan" | string;
  history?: CadreHistory[];
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  nik?: string;
  ktpName?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  birthPlaceDate?: string;
  alamatRumah?: string;
  homeAddress?: string;
  alamatDomisili?: string;
  domicileAddress?: string;
  pendidikanSD?: string;
  pendidikanSMP?: string;
  pendidikanSMA?: string;
  perguruanTinggi?: string;
  campus?: string;
  fakultas?: string;
  faculty?: string;
  jurusan?: string;
  major?: string;
  ktmName?: string;
  ktpFileUrl?: string;
  ktmFileUrl?: string;
  twitter?: string;
  facebook?: string;
  igAccount?: string;
  twitterAccount?: string;
  facebookAccount?: string;
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
  overallStatus?: "IN_PROGRESS" | "COMPLETED";
  customFields?: Record<string, string | number | boolean>;
  careerProfile?: any;
  careerAssessment?: (CareerAssessmentResult & {
    dominantCluster?: string;
    scores?: Record<string, number>;
    completedAt?: string;
  }) | any;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "file";
  options?: string[];
  required: boolean;
}

export interface EventStageItem {
  isOpen: boolean;
  startDate?: string;
  endDate?: string;
  note?: string;
  releaseDate?: string;
}

export interface EventStageTimeline {
  registration: EventStageItem;
  forum: EventStageItem;
  rtl: EventStageItem;
  certification: EventStageItem;
  registrationStart?: string;
  registrationEnd?: string;
  screeningStart?: string;
  screeningEnd?: string;
  eventStart?: string;
  eventEnd?: string;
  graduationDate?: string;
  activeStage?: "REGISTRATION" | "SCREENING" | "EVENT" | "GRADUATION";
}

export interface EventActivity {
  id: string;
  name: string;
  title?: string;
  description: string;
  date: string;
  location?: string;
  level: "MAPABA" | "PKD" | "PKL" | "NON_FORMAL" | string;
  kaderisasiId?: string;
  quota?: number;
  status: "OPEN" | "CLOSED";
  sessions?: string[];
  formFields?: FormField[];
  commissariat: string;
  waGroupLink?: string;
  timeline?: EventStageTimeline;
  targetCadres?: string[];
  requiresGraduation?: boolean;
}

export interface ParticipantRegistration {
  id: string;
  eventId: string;
  cadreName: string;
  cadreRayon?: string;
  cadreEmail: string;
  dateApplied: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  notes: string;
  answers: Record<string, string>;
  verificationStatus: Record<string, boolean>;
  attendance?: string[];
  isGraduated?: boolean;
  registrationNumber?: string;
  name?: string;
  email?: string;
  phone?: string;
  commissariat?: string;
  major?: string;
  registeredAt?: string;
  screeningStatus?: "PENDING" | "PASSED" | "FAILED" | string;
  screeningNotes?: string;
  screeningScores?: Record<string, number>;
  attendedSessions?: string[];
  graduationStatus?: "PENDING" | "PASSED" | "FAILED" | string;
  certificateNumber?: string;
  certificateIssuedAt?: string;
  userId?: string;
}

export interface Requirement {
  id: string;
  level: "MAPABA" | "PKD" | "PKL" | string;
  title: string;
  description: string;
  targetStage?: string;
  deadlineDays?: number;
  deadline?: string;
  eventId?: string;
  points?: number;
  type?: string;
  category?: string;
  templateLink?: string;
  fileUrl?: string;
  fileName?: string;
  fileLink?: string;
  fileSize?: string;
  minSubmissions?: number;
  kaderisasiId?: string;
}

export interface BoardMember {
  id: string;
  name: string;
  period?: string;
  phoneNumber?: string;
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
  order?: number;
  user_id?: string;
}

export interface KomisariatRayon {
  id: string;
  name: string;
  memberCount: number;
}

export interface KomisariatStructure {
  chairman?: string;
  secretary?: string;
  treasurer?: string;
  period?: string;
  binaDesaCount?: number;
  rayonCount?: number;
  cadresTarget?: number;
}

export interface CommissariatList {
  id: string;
  name: string;
  university?: string;
  campusName?: string;
  establishedDate?: string;
  establishedYear?: number;
  status: "AKTIF" | "PERSUPERVISION" | "INAKTIF" | "TIDAK AKTIF" | string;
  logoInitial?: string;
  contactEmail: string;
  accreditation: "A" | "B" | "C" | "Belum Akreditasi";
  structure: KomisariatStructure;
  rayons?: KomisariatRayon[];
}

export interface UserAccount {
  id: string;
  user_id?: string;
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

export interface SessionScore {
  materiId: string;
  materiTitle: string;
  kognitif: number;
  afektif: number;
  psikomotorik: number;
  total?: number;
  score?: number;
  notes?: string;
  preTestScore?: number;
  postTestScore?: number;
  evaluatedAt?: string;
  evaluatorName?: string;
}

export interface ParticipantEvaluation {
  id: string;
  activityId: string;
  cadreId: string;
  participantName: string;
  commissariat?: string;
  avatar?: string;
  kognitif: number;
  afektif: number;
  psikomotorik: number;
  finalScore: number;
  status: "LULUS" | "LULUS_BERSYARAT" | "TIDAK_LULUS" | "PENDING" | string;
  catatanFasilitator?: string;
  evaluatorId?: string;
  evaluatorName?: string;
  notes?: string;
  sessionScores?: Record<string, SessionScore>;
  quizResults?: Record<string, {
    preTest?: number;
    postTest?: number;
    submittedAt?: string;
    details?: {
      preTestAnswers?: Record<string, string>;
      postTestAnswers?: Record<string, string>;
    };
  }>;
  preTestAverage?: number;
  postTestAverage?: number;
  careerAssessment?: (CareerAssessmentResult & {
    dominantCluster?: string;
    scores?: Record<string, number>;
    completedAt?: string;
  }) | any;
  activityName?: string;
  gender?: string;
  university?: string;
  level?: string;
  grade?: string;
  updatedAt?: string;
}

export interface KaderisasiFile {
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  name?: string;
  uploadedAt?: string;
  size?: number;
}

export interface KaderisasiMateri {
  id: string;
  judul: string;
  deskripsi?: string;
  durasi?: number;
  instrukturDefault?: string;
  durasiJam?: number;
  urutan?: number;
  fileMateri?: KaderisasiFile;
  fileReferensi?: KaderisasiFile;
  quiz?: QuizQuestion[];
}

export interface CertificateFieldConfig {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  fontWeight?: "normal" | "bold";
  enabled?: boolean;
  bold?: boolean;
}

export interface CertificateLayoutConfig {
  nama: CertificateFieldConfig;
  nomor: CertificateFieldConfig;
  nik: CertificateFieldConfig;
  ttl: CertificateFieldConfig;
  jurusan: CertificateFieldConfig;
  kampus: CertificateFieldConfig;
  fontFamily: string;
  paperSize?: "F4" | "A4" | string;
  numberSegments?: [string, string, string, string, string, string];
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
  certificateTemplate?: string;
  certificateConfig?: CertificateLayoutConfig;
}

export interface SyllabusItem {
  id: string;
  subjectName: string;
  title?: string;
  speaker?: string;
  duration?: string;
  durationHours?: number;
  description?: string;
  goal?: string;
  category?: string;
  tujuan?: string[];
  pokokPembahasan?: string[];
  metode?: string[];
  prosesKegiatan?: string[];
  harapan?: string[];
  files?: MaterialFile[];
}

export interface FileAttachment {
  name: string;
  size: string;
  url: string;
  fileUrl?: string;
}

export interface MaterialFile {
  id: string;
  title?: string;
  fileName: string;
  fileSize: string;
  downloadCount: number;
  description?: string;
  type?: "pdf" | "doc" | "ppt" | "link" | string;
  url?: string;
  fileUrl?: string;
  size?: string;
  category?: "wajib" | "suplemen" | "tugas" | string;
  referensi?: string;
  syllabusId?: string;
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
  explanation?: string;
  target?: "PRE_TEST" | "POST_TEST" | "BOTH" | string;
  testType?: "PRE" | "POST" | "BOTH";
}

export interface KaderisasiLevel {
  id: string;
  name: string;
  syllabus: SyllabusItem[];
  materials: MaterialFile[];
  quiz: QuizQuestion[];
}

export interface Article {
  id: string;
  slug?: string;
  title: string;
  category: string;
  excerpt: string;
  content: string[] | string;
  authorName: string;
  author?: string;
  authorRole: string;
  authorInitials: string;
  authorAvatar?: string;
  image: string;
  thumbnail?: string;
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
  readTime?: string;
}

export interface SuratTemplate {
  id: string;
  name: string;
  subject: string;
  classification?: string;
  content: string;
  fileBase64?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  placeholders?: string[];
  isDocx?: boolean;
  senderTitle?: string;
  senderLocation?: string;
  commissariat?: string;
  createdAt?: string;
  created_at?: string;
}

export interface MailItem {
  id: string;
  nomor: string;
  type?: "MASUK" | "KELUAR";
  senderOrRecipient: string;
  subject: string;
  date: string;
  classification: "Instruksi" | "Permohonan" | "Undangan" | "Keputusan" | "Rekomendasi";
  status: "Selesai" | "Diproses" | "Menunggu Tindak Lanjut" | "Terkirim";
  content: string;
  senderTitle: string;
  senderLocation: string;
  dateIndo: string;
  commissariat?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  created_at?: string;
}

