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
  tenant_id?: string | null;
  komisariat_id?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
  created_at?: string;
}
