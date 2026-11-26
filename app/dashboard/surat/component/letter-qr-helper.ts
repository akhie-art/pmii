import QRCode from "qrcode";
import { escapeHtml } from "@/lib/sanitize";

export interface LetterQrFooterMeta {
  letterId: string;
  nomor?: string;
  qrDataUrl: string;
  verificationUrl: string;
  orgLabel?: string;
}

/**
 * Menghasilkan kode verifikasi pendek yang mudah dibaca manusia dari UUID surat.
 * Contoh: "550e8400-e29b-..." -> "VER-550E8400"
 */
export function getShortVerificationCode(letterId: string): string {
  const clean = String(letterId || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  if (!clean) return "VER-SURAT";
  return `VER-${clean.slice(0, 8)}`;
}

/**
 * Membangun URL halaman verifikasi publik keaslian surat keluar.
 */
export function getLetterVerificationUrl(letterId: string, baseOrigin?: string): string {
  const rawOrigin =
    baseOrigin ||
    (typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://pmii.or.id");

  const cleanOrigin = rawOrigin.trim().replace(/\/+$/, "");
  const cleanId = encodeURIComponent(String(letterId || "").trim());
  return `${cleanOrigin}/verifikasi-surat/${cleanId}`;
}

/**
 * Menghasilkan gambar QR Code (PNG Data URL) untuk verifikasi keaslian surat keluar.
 */
export async function generateLetterQrDataUrl(
  letterId: string,
  baseOrigin?: string
): Promise<{ qrDataUrl: string; verificationUrl: string; shortCode: string }> {
  const verificationUrl = getLetterVerificationUrl(letterId, baseOrigin);
  const shortCode = getShortVerificationCode(letterId);

  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 180,
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0A2A5C",
      light: "#FFFFFF",
    },
  });

  return { qrDataUrl, verificationUrl, shortCode };
}

/**
 * Memeriksa apakah konten HTML surat sudah memiliki blok footer QR verifikasi
 * (termasuk gambar QR tertanam di footer hasil render docx-preview).
 */
export function hasHtmlQrFooter(html: string | null | undefined): boolean {
  if (!html || typeof html !== "string") return false;
  if (
    html.includes("letter-qr-footer") ||
    html.includes("qr_verifikasi_surat") ||
    html.includes("QR Verifikasi Surat")
  ) {
    return true;
  }
  return html.includes("docx-wrapper") && /<footer\b[\s\S]*?<img\b/i.test(html);
}

/**
 * Menghapus blok `<footer class="letter-qr-footer">...</footer>` sementara dari kanvas edit HTML
 * agar pengguna tidak terganggu saat menyunting surat; footer akan disisipkan ulang saat disimpan.
 */
export function stripHtmlQrFooter(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<footer\b[^>]*class=["'][^"']*letter-qr-footer[^"']*["'][^>]*>[\s\S]*?<\/footer>/gi, "")
    .trim();
}

/**
 * Membangun blok HTML footer berisi QR Code verifikasi bersih (tanpa teks tambahan)
 * untuk surat keluar pada kanvas HTML maupun cetak PDF.
 */
export function buildHtmlQrFooter({ qrDataUrl }: LetterQrFooterMeta): string {
  const safeSrc = escapeHtml(qrDataUrl);

  return `<footer class="letter-qr-footer" contenteditable="false" style="margin-top:24px; padding-top:6px; page-break-inside:avoid; break-inside:avoid;">
  <img src="${safeSrc}" alt="QR Verifikasi Surat" width="64" height="64" style="width:64px; height:64px; display:block;" />
</footer>`;
}

/**
 * Menyisipkan atau memperbarui blok footer QR verifikasi pada HTML surat tanpa duplikasi.
 */
export function upsertHtmlQrFooter(html: string, footerHtml: string): string {
  if (!html) return footerHtml;
  const existingFooterRegex = /<footer\b[^>]*class=["'][^"']*letter-qr-footer[^"']*["'][^>]*>[\s\S]*?<\/footer>/gi;
  if (existingFooterRegex.test(html)) {
    return html.replace(existingFooterRegex, footerHtml);
  }
  return `${html}\n${footerHtml}`;
}
