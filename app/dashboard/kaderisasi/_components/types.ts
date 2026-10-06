import { CertificateLayoutConfig, FormField, DEFAULT_CERT_CONFIG } from "@/lib/db";

export { DEFAULT_CERT_CONFIG };

export const CERT_FIELDS: {
  key: keyof Omit<CertificateLayoutConfig, "fontFamily" | "numberSegments">;
  label: string;
  sample: string;
}[] = [
  { key: "nama", label: "Nama Peserta", sample: "Akhie Najhan Atifa" },
  { key: "nomor", label: "Nomor Piagam", sample: "010.01.091222.001.12.2025" },
  { key: "nik", label: "NIK", sample: "3315082103980001" },
  { key: "ttl", label: "TTL", sample: "Grobogan, 21 Maret 1998" },
  { key: "jurusan", label: "Jurusan", sample: "Teknik Informatika" },
  { key: "kampus", label: "Perguruan Tinggi", sample: "Universitas An-Nur Purwodadi" },
];

export const DEFAULT_FORM_FIELDS: FormField[] = [
  {
    id: "f-nama-lengkap",
    label: "Nama Lengkap",
    type: "text",
    required: true
  },
  {
    id: "f-nik",
    label: "NIK (Nomor Induk Kependudukan)",
    type: "text",
    required: true
  },
  {
    id: "f-ktp",
    label: "Lampiran Berkas KTP (Asli / Scan)",
    type: "file",
    required: true
  },
  {
    id: "f-jenis-kelamin",
    label: "Jenis Kelamin",
    type: "select",
    options: ["Laki-laki", "Perempuan"],
    required: true
  },
  {
    id: "f-ttl",
    label: "Tempat Tanggal Lahir",
    type: "text",
    required: true
  },
  {
    id: "f-alamat-rumah",
    label: "Alamat Rumah",
    type: "textarea",
    required: true
  },
  {
    id: "f-alamat-domisili",
    label: "Alamat Domisili Mahasiswa",
    type: "textarea",
    required: true
  },
  {
    id: "f-pendidikan-sd",
    label: "Riwayat Pendidikan SD / Sederajat",
    type: "text",
    required: true
  },
  {
    id: "f-pendidikan-smp",
    label: "Riwayat Pendidikan SMP / Sederajat",
    type: "text",
    required: true
  },
  {
    id: "f-pendidikan-sma",
    label: "Riwayat Pendidikan SMA / Sederajat",
    type: "text",
    required: true
  },
  {
    id: "f-kampus",
    label: "Nama Perguruan Tinggi / Kampus",
    type: "text",
    required: true
  },
  {
    id: "f-fakultas",
    label: "Fakultas",
    type: "text",
    required: true
  },
  {
    id: "f-jurusan",
    label: "Jurusan / Program Studi",
    type: "text",
    required: true
  },
  {
    id: "f-ktm",
    label: "Unggah KTM / Surat Keterangan Mahasiswa Aktif",
    type: "file",
    required: true
  },
  {
    id: "f-hp",
    label: "Nomor HP / WhatsApp",
    type: "text",
    required: true
  },
  {
    id: "f-ig",
    label: "Akun Instagram",
    type: "text",
    required: false
  },
  {
    id: "f-twitter",
    label: "Akun Twitter / X",
    type: "text",
    required: false
  },
  {
    id: "f-facebook",
    label: "Akun Facebook",
    type: "text",
    required: false
  },
  {
    id: "f-pas-foto",
    label: "Pas Foto",
    type: "file",
    required: true
  },
  {
    id: "f-kesehatan",
    label: "Riwayat Penyakit dan Golongan Darah",
    type: "text",
    required: false
  },
  {
    id: "f-organisasi-sd-smp",
    label: "Pengalaman Organisasi (SD / SMP)",
    type: "textarea",
    required: false
  },
  {
    id: "f-organisasi-sma",
    label: "Pengalaman Organisasi (SMA / Sederajat)",
    type: "textarea",
    required: false
  },
  {
    id: "f-organisasi-pt",
    label: "Pengalaman Organisasi (Perguruan Tinggi)",
    type: "textarea",
    required: false
  },
  {
    id: "f-orientasi-profetik",
    label: "Orientasi Profetik",
    type: "textarea",
    required: false
  },
  {
    id: "f-minat-passion",
    label: "Minat atau Passion",
    type: "textarea",
    required: false
  }
];

export const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: '"Arial Narrow", Arial, sans-serif', label: "Arial Narrow (Standar PMII)" },
  { value: 'Arial, "Helvetica Neue", Helvetica, sans-serif', label: "Arial Standard" },
  { value: '"Poppins", var(--font-poppins), sans-serif', label: "Poppins" },
  { value: '"Times New Roman", Times, serif', label: "Times New Roman" },
  { value: 'Calibri, Candara, Segoe, sans-serif', label: "Calibri" },
];

