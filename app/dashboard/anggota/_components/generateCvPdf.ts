import { jsPDF } from "jspdf";
import type { Member } from "./types";

/**
 * Resolves the member's photo URL or data URI from any available field
 */
export function resolveMemberPhotoUrl(member: Partial<Member>): string {
  // 1. Check avatar
  if (member.avatar && typeof member.avatar === "string" && member.avatar.trim()) {
    const a = member.avatar.trim();
    if (a.startsWith("data:") || a.startsWith("http://") || a.startsWith("https://") || a.startsWith("/")) {
      return a;
    }
    if (a.includes("/")) {
      return `https://fmmimbdsenazexeytuge.supabase.co/storage/v1/object/public/materials/${a}`;
    }
    return `https://fmmimbdsenazexeytuge.supabase.co/storage/v1/object/public/materials/avatars/${a}`;
  }

  return "";
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

function formatDateIndo(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
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
  const eduList: string[] = [];
  if (member.pendidikanSD) eduList.push(member.pendidikanSD);
  if (member.pendidikanSMP) eduList.push(member.pendidikanSMP);
  if (member.pendidikanSMA) eduList.push(member.pendidikanSMA);
  if (member.perguruanTinggi) {
    const campus = member.jurusan ? `${member.perguruanTinggi} (${member.jurusan})` : member.perguruanTinggi;
    eduList.push(campus);
  }
  if (eduList.length === 0) eduList.push("-");

  // Pengalaman Organisasi (Each organization on its own line)
  const orgList: string[] = [];
  if (member.organisasiSMP) orgList.push(member.organisasiSMP);
  if (member.organisasiSMA) orgList.push(member.organisasiSMA);
  if (member.organisasiPT) orgList.push(member.organisasiPT);
  orgList.push(member.jabatan && member.jabatan !== "Anggota" ? `PMII (${member.jabatan})` : "PMII");

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
  doc.text("Yang bersangkutan,", signX, signY);

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

  // 6. SIMPAN FILE PDF
  const safeName = (member.name || "Kader").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`CV_${safeName}.pdf`);
}
