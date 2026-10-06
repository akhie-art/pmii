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

export const DEFAULT_REQUIREMENTS: Requirement[] = [
  {
    id: "req-1",
    title: "Penulisan Esai Refleksi Nilai Dasar Pergerakan (NDP)",
    description: "Menyusun artikel opini/esai minimal 800 kata yang mengulas kontekstualisasi NDP dalam isu sosial kampus saat ini.",
    level: "MAPABA",
    deadlineDays: 14,
    points: 25,
    type: "ARTICLE",
    templateLink: "https://docs.google.com/document/d/sample-ndp",
    category: "Wajib"
  },
  {
    id: "req-2",
    title: "Resume Buku Wajib: Islam Transformatif / Pemikiran Gus Dur",
    description: "Membuat tinjauan kritis dan resume komprehensif buku bacaan wajib gerakan mahasiswa.",
    level: "MAPABA",
    deadlineDays: 21,
    points: 25,
    type: "BOOK_REVIEW",
    category: "Wajib"
  },
  {
    id: "req-3",
    title: "Kepanitiaan Masa Penerimaan Anggota Baru (MAPABA) Selanjutnya",
    description: "Terlibat aktif dalam struktur Organizing Committee (OC) atau Steering Committee (SC) kaderisasi formal berikutnya.",
    level: "PKD",
    deadlineDays: 60,
    points: 30,
    type: "EVENT_ORGANIZER",
    category: "Pilihan"
  },
  {
    id: "req-4",
    title: "Pengabdian Desa Binaan / Advokasi Kebijakan Kampus",
    description: "Terlibat langsung dalam pendampingan masyarakat binaan atau riset advokasi isu UKT mahasiswa.",
    level: "PKD",
    deadlineDays: 90,
    points: 20,
    type: "COMMUNITY_SERVICE",
    category: "Pilihan"
  }
];

export const DEFAULT_COMMISSARIATS: CommissariatList[] = [
  {
    id: "kom-1",
    name: "Ki Ageng Getas Pendawa",
    campusName: "UIN Walisongo Semarang",
    status: "AKTIF",
    establishedYear: 1985,
    contactEmail: "kiageng.getaspendawa@pmii.org",
    accreditation: "A",
    structure: {
      binaDesaCount: 4,
      rayonCount: 5,
      cadresTarget: 250
    }
  }
];

export const DEFAULT_BOARDS: BoardMember[] = [];

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Master Admin PMII",
    email: "admin@pmii.org",
    role: "ADMIN",
    commissariat: "Ki Ageng Getas Pendawa",
    status: "AKTIF",
    createdAt: "2026-01-01T00:00:00.000Z",
    allowedMenus: []
  }
];

export const DEFAULT_EVALUATIONS: ParticipantEvaluation[] = [];
export const DEFAULT_KADERISASI: Kaderisasi[] = [];

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
