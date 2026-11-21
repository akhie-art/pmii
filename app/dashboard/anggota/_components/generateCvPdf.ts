import type { Member } from "./types";
import { resolveMemberPhotoUrl, formatDateIndo } from "./types";
export { resolveMemberPhotoUrl, formatDateIndo };

function parseCvOrgItems(raw?: string | null): { nama: string; tahunMulai?: string; tahunSelesai?: string }[] {
  if (!raw || !raw.trim()) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any) => ({
            nama: (item.nama || item.name || "").trim(),
            tahunMulai: (item.tahunMulai || item.startYear || "").trim(),
            tahunSelesai: (item.tahunSelesai || item.endYear || "").trim()
          }))
          .filter((i) => i.nama);
      }
    } catch {}
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ nama: s, tahunMulai: "", tahunSelesai: "" }));
}

/**
 * Menghitung rentang tahun keaktifan PMII untuk disajikan pada CV ATS & Formal
 * Contoh: "2021 - Sekarang" atau "2020 - 2024"
 */
function getPmiiPeriod(member: Member): string {
  let startYear = member.angkatan ? member.angkatan.replace(/\D/g, "") : "";
  if (!startYear && member.tahunMasukPT) {
    startYear = member.tahunMasukPT.replace(/\D/g, "");
  }
  if (!startYear && member.history && member.history.length > 0) {
    const mapaba = member.history.find((h) => (h.level || "").toUpperCase().includes("MAPABA")) || member.history[0];
    if (mapaba?.date) {
      const yr = new Date(mapaba.date).getFullYear();
      if (!isNaN(yr) && yr > 1990) startYear = String(yr);
    }
  }
  if (!startYear && (member as any).created_at) {
    const yr = new Date((member as any).created_at).getFullYear();
    if (!isNaN(yr) && yr > 1990) startYear = String(yr);
  }

  if (!startYear) return "";

  if (member.status === "Alumni") {
    const endYear = member.tahunLulusPT ? member.tahunLulusPT.replace(/\D/g, "") : "";
    return endYear && endYear !== startYear ? `${startYear} - ${endYear}` : `${startYear} - Selesai`;
  }
  return `${startYear} - Sekarang`;
}

/**
 * Generates an official formal 3x4 cadre portrait (PMII Navy & Gold)
 * ensuring the CV always presents a dignified 3x4 photo even when no file is uploaded.
 */
export function generateFallbackFormalPhoto(name: string): string {
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 400; // Rasio 3:4 standar pas foto resmi
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Background Resmi PMII (Biru Navy Formal Gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 400);
  bgGrad.addColorStop(0, "#003b73");
  bgGrad.addColorStop(0.5, "#002855");
  bgGrad.addColorStop(1, "#001b3a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 300, 400);

  // 2. Soft Studio Lighting (Radial Glow)
  const glow = ctx.createRadialGradient(150, 150, 15, 150, 150, 130);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 300, 400);

  // 3. Siluet Jas Formal Kader (Kemeja Putih & Jas Resmi)
  // Jas Pundak
  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.beginPath();
  ctx.ellipse(150, 320, 105, 80, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Kemeja Putih Kerah V
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(125, 240);
  ctx.lineTo(150, 310);
  ctx.lineTo(175, 240);
  ctx.closePath();
  ctx.fill();

  // Dasi Kuning PMII
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.moveTo(150, 248);
  ctx.lineTo(158, 290);
  ctx.lineTo(150, 335);
  ctx.lineTo(142, 290);
  ctx.closePath();
  ctx.fill();

  // Kepala Siluet
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.beginPath();
  ctx.arc(150, 145, 48, 0, Math.PI * 2);
  ctx.fill();

  // Inisial Kader di Kepala
  const initials = (name || "PMII")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  ctx.fillStyle = "#002855";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, 150, 145);

  // Label Bawah: PAS FOTO RESMI
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PAS FOTO 3×4", 150, 375);

  return canvas.toDataURL("image/jpeg", 0.95);
}

/**
 * Loads an image safely as base64 data URL with multi-tier fallback for embedding into jsPDF
 */
export async function getBase64Image(url?: string): Promise<{ dataUrl: string; format: "JPEG" | "PNG" } | null> {
  if (!url || typeof document === "undefined") return null;

  // 1. Direct Data URL
  if (url.startsWith("data:")) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 400;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ dataUrl: url, format: url.includes("image/png") ? "PNG" : "JPEG" });
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.95), format: "JPEG" });
        } catch {
          resolve({ dataUrl: url, format: url.includes("image/png") ? "PNG" : "JPEG" });
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  // 2. Fetch as Blob (Handles Supabase storage and standard CORS)
  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Render to canvas to guarantee pristine standard JPEG encoding
      const canvasRes = await new Promise<{ dataUrl: string; format: "JPEG" | "PNG" } | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 400;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve({ dataUrl, format: "JPEG" });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.95), format: "JPEG" });
        };
        img.onerror = () => resolve({ dataUrl, format: "JPEG" });
        img.src = dataUrl;
      });

      if (canvasRes) return canvasRes;
    }
  } catch {
    // Proceed to Image element attempts
  }

  // 3. Image tag with anonymous CORS
  const loadViaImage = (withCors: boolean): Promise<{ dataUrl: string; format: "JPEG" | "PNG" } | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      if (withCors) img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 400;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.95), format: "JPEG" });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const corsRes = await loadViaImage(true);
  if (corsRes) return corsRes;

  const noCorsRes = await loadViaImage(false);
  if (noCorsRes) return noCorsRes;

  return null;
}

/**
 * Resolves Kop Surat information based on the member's commissariat
 */
function getCommissariatKopData(commName: string) {
  const c = (commName || "").toLowerCase();

  if (c.includes("ajisaka") || c.includes("stai")) {
    return {
      commissariat: "AJISAKA",
      campus: "STAI GROBOGAN",
      address: "Jl. Diponegoro No. 27, Simpang Lima, Purwodadi, Kab. Grobogan",
      contact: "Email: pmiiajisaka@gmail.com   Website: pmii.id"
    };
  }

  if (c.includes("al fath") || c.includes("alfath") || c.includes("mambaul")) {
    return {
      commissariat: "AL FATH",
      campus: "INSTITUT ISLAM MAMBAUL FALAH",
      address: "Jl. Raya Wirosari - Kuwu, Kab. Grobogan",
      contact: "Email: pmiialfath@gmail.com   Website: pmii.id"
    };
  }

  if (c.includes("nawawi") || c.includes("stit")) {
    return {
      commissariat: "AN-NAWAWI",
      campus: "STIT AN-NAWAWI",
      address: "Purwodadi, Kab. Grobogan",
      contact: "Email: pmiiannawawi@gmail.com   Website: pmii.id"
    };
  }

  // Default official template: Ki Ageng Getas Pendawa - Universitas An Nuur
  return {
    commissariat: "KI AGENG GETAS PENDAWA",
    campus: "UNIVERSITAS AN NUUR",
    address: "Jl. Lingkar Utara Pedak- Menduran Kec. Brati, Kab. Grobogan 58153, 042323061028",
    contact: "Email: pmiikiagenggetaspendawa@gmail.com Website: pmii.id"
  };
}

/**
 * Generates and downloads a Curriculum Vitae (CV) PDF matching the exact official
 * PMII Kop Surat and table layout from the provided document template.
 */
export async function generateMemberCvPdf(member: Member): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const tableX = 18;
  const tableWidth = pageWidth - tableX * 2; // 174mm

  // Three-column layout for the table
  const col1W = 46; // Label column
  const col2W = 6;  // Separator ":" column
  const col3W = tableWidth - col1W - col2W; // 122mm (Value column)

  const kop = getCommissariatKopData(member.komisariat);

  // 1. KOP SURAT RESMI (MATCHING TEMPLATE DOKUMEN)
  let curY = 12;

  // Logo PMII on the left
  const logoW = 20;
  const logoH = 23;
  const logoX = tableX + 2;
  const logoY = curY + 1;

  try {
    const logoBase64 = await getBase64Image("/images/pmii-kop-logo.png");
    if (logoBase64) {
      doc.addImage(logoBase64.dataUrl, logoBase64.format, logoX, logoY, logoW, logoH);
    }
  } catch (e) {
    console.warn("Could not load Kop Surat logo:", e);
  }

  // Kop Surat Text (Centered across the width)
  const headerCenterX = tableX + logoW + (tableWidth - logoW) / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("PENGURUS KOMISARIAT", headerCenterX, curY + 4, { align: "center" });

  doc.setFontSize(11);
  doc.text("PERGERAKAN MAHASISWA ISLAM INDONESIA", headerCenterX, curY + 8.2, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  doc.text("(Commissariat Board Indonesian Islamic Student Movement)", headerCenterX, curY + 12, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(kop.commissariat, headerCenterX, curY + 16, { align: "center" });
  doc.text(kop.campus, headerCenterX, curY + 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(kop.address, headerCenterX, curY + 23.8, { align: "center" });
  doc.text(kop.contact, headerCenterX, curY + 27.2, { align: "center" });

  // Blue Divider Line under Kop Surat (#0070C0)
  curY += 29.5;
  doc.setDrawColor(0, 112, 192); // #0070C0
  doc.setLineWidth(0.6);
  doc.line(tableX, curY, tableX + tableWidth, curY);

  curY += 6;

  // 2. JUDUL DOKUMEN (CURRICULUM VITAE - PENGURUS KOMISARIAT)
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text("CURRICULUM VITAE", pageWidth / 2, curY, { align: "center" });

  curY += 5;
  doc.setFontSize(11.5);
  doc.text("PENGURUS KOMISARIAT", pageWidth / 2, curY, { align: "center" });

  curY += 6;

  // 3. SUSUN DATA SESUAI TEMPLATE RESMI
  // Alamat
  const addressText = member.alamatDomisili || member.alamatRumah || "-";

  // Tempat Tanggal Lahir
  const ttlParts: string[] = [];
  if (member.tempatLahir) ttlParts.push(member.tempatLahir);
  if (member.tanggalLahir) ttlParts.push(formatDateIndo(member.tanggalLahir));
  const ttlText = ttlParts.length > 0 ? ttlParts.join(", ") : "-";

  // Riwayat Pendidikan (Each institution on its own line)
  const formatEdu = (name?: string, start?: string, end?: string) => {
    if (!name) return "";
    const period = [start, end].filter(Boolean).join(" - ");
    return period ? `${name} (${period})` : name;
  };

  const eduList: string[] = [];
  if (member.pendidikanSD) eduList.push(formatEdu(member.pendidikanSD, member.tahunMasukSD, member.tahunLulusSD));
  if (member.pendidikanSMP) eduList.push(formatEdu(member.pendidikanSMP, member.tahunMasukSMP, member.tahunLulusSMP));
  if (member.pendidikanSMA) eduList.push(formatEdu(member.pendidikanSMA, member.tahunMasukSMA, member.tahunLulusSMA));
  if (member.perguruanTinggi) {
    const campus = member.jurusan ? `${member.perguruanTinggi} (${member.jurusan})` : member.perguruanTinggi;
    eduList.push(formatEdu(campus, member.tahunMasukPT, member.tahunLulusPT));
  }
  if (eduList.length === 0) eduList.push("-");

  // Pengalaman Organisasi (Each organization on its own line)
  const orgList: string[] = [];
  const formatOrgItem = (item: { nama: string; tahunMulai?: string; tahunSelesai?: string }) => {
    const period = [item.tahunMulai, item.tahunSelesai].filter(Boolean).join(" - ");
    return period ? `${item.nama} (${period})` : item.nama;
  };

  parseCvOrgItems(member.organisasiSMP).forEach((item) => orgList.push(formatOrgItem(item)));
  parseCvOrgItems(member.organisasiSMA).forEach((item) => orgList.push(formatOrgItem(item)));
  parseCvOrgItems(member.organisasiPT).forEach((item) => orgList.push(formatOrgItem(item)));
  const pmiiPeriod = getPmiiPeriod(member);
  const pmiiLabel = member.jabatan && member.jabatan !== "Anggota" ? `PMII (${member.jabatan})` : "PMII";
  orgList.push(pmiiPeriod ? `${pmiiLabel} (${pmiiPeriod})` : pmiiLabel);

  // Motto Hidup
  const mottoText =
    member.motivasiMapaba ||
    member.orientasiProfetik ||
    member.minatPassion ||
    "Terus Mencoba";

  const rows: { label: string; values: string[] }[] = [
    { label: "Nama Lengkap", values: [member.name || "-"] },
    { label: "Alamat", values: [addressText] },
    { label: "Tempat Tanggal Lahir", values: [ttlText] },
    { label: "Nomor Telp.", values: [member.phone || "-"] },
    { label: "Riwayat Pendidikan", values: eduList },
    { label: "Pengalaman Organisasi", values: orgList },
    { label: "Motto Hidup", values: [mottoText] }
  ];

  // 4. RENDER TABEL BERGARIS PRESISI
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  rows.forEach((row) => {
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);

    // Flatten lines for value column
    const renderedLines: string[] = [];
    row.values.forEach((v) => {
      const split = doc.splitTextToSize(v, col3W - 5);
      renderedLines.push(...split);
    });

    const lineHeight = 5.2;
    const paddingY = 3.2;
    const rowHeight = Math.max(9, renderedLines.length * lineHeight + paddingY * 2);

    // Draw solid borders for the 3 cells
    doc.rect(tableX, curY, col1W, rowHeight);
    doc.rect(tableX + col1W, curY, col2W, rowHeight);
    doc.rect(tableX + col1W + col2W, curY, col3W, rowHeight);

    // Label
    doc.setFont("times", "normal");
    doc.text(row.label, tableX + 3, curY + 6);

    // Separator ":"
    doc.text(":", tableX + col1W + 2, curY + 6);

    // Content lines
    let textY = curY + 6;
    renderedLines.forEach((line: string) => {
      doc.text(line, tableX + col1W + col2W + 3, textY);
      textY += lineHeight;
    });

    curY += rowHeight;
  });

  // 5. BAGIAN BAWAH: FOTO 3X4 & TANDA TANGAN
  curY += 10;

  // Box Foto 3x4 (Kiri Bawah)
  const photoW = 30; // 3 cm
  const photoH = 40; // 4 cm
  const photoX = tableX + 10;
  const photoY = curY;

  const photoUrl = resolveMemberPhotoUrl(member);

  let photoBase64: { dataUrl: string; format: "JPEG" | "PNG" } | null = null;
  if (photoUrl) {
    try {
      photoBase64 = await getBase64Image(photoUrl);
    } catch (e) {
      console.warn("Failed fetching member photo:", e);
    }
  }

  // Jika foto belum ada atau gagal dimuat, gunakan potret pas foto resmi PMII berlatar belakang biru
  if (!photoBase64) {
    const fallbackDataUrl = generateFallbackFormalPhoto(member.name || "Kader PMII");
    if (fallbackDataUrl) {
      photoBase64 = { dataUrl: fallbackDataUrl, format: "JPEG" };
    }
  }

  if (photoBase64) {
    try {
      doc.addImage(photoBase64.dataUrl, photoBase64.format, photoX, photoY, photoW, photoH);
    } catch (e) {
      console.warn("Failed embedding photo in CV:", e);
    }
  }

  // Bingkai foto 3x4 bergaris hitam presisi
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(photoX, photoY, photoW, photoH);

  // Tanda Tangan (Kanan Bawah)
  const signX = tableX + tableWidth - 62;
  let signY = photoY + 2;

  const todayStr = formatDateIndo(new Date().toISOString());
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  doc.text(`Grobogan, ${todayStr}`, signX, signY);

  signY += 5.5;

  // Ruang untuk tanda tangan
  signY += 24;
  doc.setFont("times", "bold");
  doc.text(`( ${(member.name || "").toUpperCase()} )`, signX, signY);

  if (member.nipa) {
    signY += 4.5;
    doc.setFont("times", "normal");
    doc.setFontSize(9.5);
    doc.text(`NIPA. ${member.nipa}`, signX, signY);
  }

  // 6. BUKA FILE PDF DI TAB BARU (PREVIEW SEPERTI SIAPKERJA)
  const pdfBlob = doc.output("blob");
  const blob = new Blob([pdfBlob], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  const opened = window.open(blobUrl, "_blank");
  if (!opened) {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Generates an ATS-Friendly Curriculum Vitae (PDF)
 * Formatted with clean typography, standard single-column hierarchy,
 * pure black text (0, 0, 0), and high-contrast styling that passes
 * Applicant Tracking System (ATS) parsers.
 */
export async function generateMemberCvAtsPdf(member: Member): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2; // 170mm
  let curY = 22;

  // Set warna teks default hitam pekat
  doc.setTextColor(0, 0, 0);

  // 1. NAMA LENGKAP (Bold, 18pt, Hitam Pekat)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text((member.name || "KADER PMII").toUpperCase(), marginX, curY);

  curY += 6;

  // 2. SUBTITLE / PROFESSIONAL TITLE (Hitam Pekat)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const headline = [
    member.perguruanTinggi ? `Mahasiswa ${member.perguruanTinggi}` : "",
    member.jurusan ? `Jurusan ${member.jurusan}` : "",
    "Kader PMII"
  ].filter(Boolean).join(" | ") || "Kader PMII";
  doc.text(headline, marginX, curY);

  curY += 5;

  // 3. BARIS KONTAK (Single-line ATS-compliant, Hitam Pekat)
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const contacts: string[] = [];
  if (member.email) contacts.push(member.email);
  if (member.phone) contacts.push(member.phone);
  const location = [member.tempatLahir, member.alamatDomisili || member.alamatRumah].filter(Boolean)[0];
  if (location) contacts.push(location);
  if (member.instagram) contacts.push(`Instagram: @${member.instagram.replace(/^@/, "")}`);

  doc.text(contacts.join("   |   "), marginX, curY);

  curY += 3.5;
  // Garis pemisah horizontal hitam pekat
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(marginX, curY, marginX + contentWidth, curY);
  curY += 6;

  // Helper: auto-add new page if near bottom
  const checkPageBreak = (neededSpace: number = 10) => {
    if (curY + neededSpace > 280) {
      doc.addPage();
      curY = 20;
      doc.setTextColor(0, 0, 0);
    }
  };

  const renderSectionHeader = (title: string) => {
    checkPageBreak(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), marginX, curY);
    curY += 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.line(marginX, curY, marginX + contentWidth, curY);
    curY += 5;
  };

  // 4. RINGKASAN PROFESIONAL (SUMMARY)
  const summaryText = member.orientasiProfetik || member.motivasiMapaba || member.minatPassion;
  if (summaryText) {
    renderSectionHeader("Ringkasan Profesional");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(splitSummary, marginX, curY);
    curY += splitSummary.length * 4.2 + 3.5;
  }

  // 5. PENDIDIKAN (EDUCATION)
  renderSectionHeader("Pendidikan");

  if (member.perguruanTinggi) {
    checkPageBreak(12);
    const ptPeriod = [member.tahunMasukPT, member.tahunLulusPT || (member.tahunMasukPT ? "Sekarang" : "")].filter(Boolean).join(" - ");
    const angkatanStr = ptPeriod ? ptPeriod : member.angkatan ? `Angkatan ${member.angkatan}` : "";
    const angkatanW = angkatanStr ? doc.getTextWidth(angkatanStr) + 6 : 0;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    const univLines = doc.splitTextToSize(member.perguruanTinggi, contentWidth - angkatanW);
    doc.text(univLines, marginX, curY);

    if (angkatanStr) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(angkatanStr, marginX + contentWidth, curY, { align: "right" });
    }
    curY += univLines.length * 4.2;

    const subDegree = [member.fakultas, member.jurusan].filter(Boolean).join(" - ");
    if (subDegree) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      const subLines = doc.splitTextToSize(subDegree, contentWidth);
      doc.text(subLines, marginX, curY);
      curY += subLines.length * 4.2;
    }
    curY += 1.5;
  }

  if (member.pendidikanSMA) {
    checkPageBreak(8);
    const smaPeriod = [member.tahunMasukSMA, member.tahunLulusSMA].filter(Boolean).join(" - ");
    const periodW = smaPeriod ? doc.getTextWidth(smaPeriod) + 6 : 0;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const smaText = member.pendidikanSMA.toLowerCase().includes("smk") || 
                    member.pendidikanSMA.toLowerCase().includes("sma") || 
                    member.pendidikanSMA.toLowerCase().includes("ma ")
      ? member.pendidikanSMA
      : `SMA / Sederajat: ${member.pendidikanSMA}`;
    const smaLines = doc.splitTextToSize(smaText, contentWidth - periodW);
    doc.text(smaLines, marginX, curY);

    if (smaPeriod) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(smaPeriod, marginX + contentWidth, curY, { align: "right" });
    }
    curY += smaLines.length * 4.2;
  }

  if (member.pendidikanSMP) {
    checkPageBreak(8);
    const smpPeriod = [member.tahunMasukSMP, member.tahunLulusSMP].filter(Boolean).join(" - ");
    const periodW = smpPeriod ? doc.getTextWidth(smpPeriod) + 6 : 0;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const smpText = member.pendidikanSMP.toLowerCase().includes("smp") || 
                    member.pendidikanSMP.toLowerCase().includes("mts")
      ? member.pendidikanSMP
      : `SMP / Sederajat: ${member.pendidikanSMP}`;
    const smpLines = doc.splitTextToSize(smpText, contentWidth - periodW);
    doc.text(smpLines, marginX, curY);

    if (smpPeriod) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(smpPeriod, marginX + contentWidth, curY, { align: "right" });
    }
    curY += smpLines.length * 4.2;
  }

  if (member.pendidikanSD) {
    checkPageBreak(8);
    const sdPeriod = [member.tahunMasukSD, member.tahunLulusSD].filter(Boolean).join(" - ");
    const periodW = sdPeriod ? doc.getTextWidth(sdPeriod) + 6 : 0;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const sdText = member.pendidikanSD.toLowerCase().includes("sd") || 
                   member.pendidikanSD.toLowerCase().includes("mi ")
      ? member.pendidikanSD
      : `SD / Sederajat: ${member.pendidikanSD}`;
    const sdLines = doc.splitTextToSize(sdText, contentWidth - periodW);
    doc.text(sdLines, marginX, curY);

    if (sdPeriod) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(sdPeriod, marginX + contentWidth, curY, { align: "right" });
    }
    curY += sdLines.length * 4.2;
  }
  curY += 2;

  // 6. PENGALAMAN ORGANISASI & KEPEMIMPINAN
  renderSectionHeader("Pengalaman Organisasi & Kepemimpinan");

  // PMII
  checkPageBreak(22);
  const pmiiPeriod = getPmiiPeriod(member);
  const periodW = pmiiPeriod ? doc.getTextWidth(pmiiPeriod) + 6 : 0;
  const commName = member.komisariat || "Cabang Grobogan";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  const pmiiTitleLines = doc.splitTextToSize("Pergerakan Mahasiswa Islam Indonesia (PMII)", contentWidth - periodW);
  doc.text(pmiiTitleLines, marginX, curY);

  if (pmiiPeriod) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(pmiiPeriod, marginX + contentWidth, curY, { align: "right" });
  }
  curY += pmiiTitleLines.length * 4.2;

  // Subtitle: Jabatan / Komisariat (Italic)
  const roleSubtitle = member.jabatan && member.jabatan !== "Anggota" ? `${member.jabatan} - ${commName}` : commName;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const subLines = doc.splitTextToSize(roleSubtitle, contentWidth);
  doc.text(subLines, marginX, curY);
  curY += subLines.length * 4.2 + 1;

  // Bullets Pengalaman PMII
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const pmiiBullets = [
    `Aktif berpartisipasi dalam agenda pengkaderan dan pergerakan intelektual tingkat ${commName}.`,
    `Telah menyelesaikan jenjang kaderisasi formal: ${member.level || "MAPABA"}${member.nipa ? ` (NIPA: ${member.nipa})` : ""}.`
  ];
  pmiiBullets.forEach((bullet) => {
    checkPageBreak(8);
    const lines = doc.splitTextToSize("•  " + bullet, contentWidth - 4);
    doc.text(lines, marginX + 2, curY);
    curY += lines.length * 4.2;
  });
  curY += 2;

  // Organisasi Lainnya (Tingkat Kampus / SMA / SMP - Mendukung Repeat & Tahun)
  const otherOrgSections = [
    { items: parseCvOrgItems(member.organisasiPT), level: "Tingkat Kampus / Umum" },
    { items: parseCvOrgItems(member.organisasiSMA), level: "Tingkat SMA" },
    { items: parseCvOrgItems(member.organisasiSMP), level: "Tingkat SMP" }
  ];

  otherOrgSections.forEach(({ items, level }) => {
    items.forEach((item) => {
      checkPageBreak(8);
      const period = [item.tahunMulai, item.tahunSelesai].filter(Boolean).join(" - ");
      const periodW = period ? doc.getTextWidth(period) + 6 : 0;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);

      const titleText = `•  ${item.nama} (${level})`;
      const splitLines = doc.splitTextToSize(titleText, contentWidth - periodW);
      doc.text(splitLines, marginX + 2, curY);

      if (period) {
        doc.text(period, marginX + contentWidth, curY, { align: "right" });
      }
      curY += splitLines.length * 4.2 + 0.5;
    });
  });
  curY += 1.5;

  // 7. KADERISASI & PELATIHAN RESMI
  if (member.history && member.history.length > 0) {
    renderSectionHeader("Kaderisasi & Pelatihan Resmi");
    member.history.forEach((h) => {
      checkPageBreak(8);
      const locDate = [h.location, h.date].filter(Boolean).join(" - ");
      const locDateW = locDate ? doc.getTextWidth(locDate) + 6 : 0;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      const trainingTitle = `Pelatihan Kader: ${h.level}`;
      const titleLines = doc.splitTextToSize(trainingTitle, contentWidth - locDateW);
      doc.text(titleLines, marginX + 2, curY);

      if (locDate) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(locDate, marginX + contentWidth, curY, { align: "right" });
      }
      curY += titleLines.length * 4.2;
    });
    curY += 2;
  }

  // 8. KEAHLIAN & MINAT
  renderSectionHeader("Keahlian & Minat");
  checkPageBreak(15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const skillsList = [
    member.minatPassion ? `Bidang Minat: ${member.minatPassion}` : "",
    "Keahlian: Kepemimpinan Organisasi, Komunikasi Publik, Manajemen Tim, Critical Thinking",
    `Status Keanggotaan: ${member.status} (${member.level || "Kader"})`
  ].filter(Boolean);

  skillsList.forEach((skill) => {
    checkPageBreak(8);
    const lines = doc.splitTextToSize("•  " + skill, contentWidth - 4);
    doc.text(lines, marginX + 2, curY);
    curY += lines.length * 4.2;
  });

  // 9. BUKA FILE PDF DI TAB BARU (PREVIEW SEPERTI SIAPKERJA)
  const pdfBlob = doc.output("blob");
  const blob = new Blob([pdfBlob], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  const opened = window.open(blobUrl, "_blank");
  if (!opened) {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
