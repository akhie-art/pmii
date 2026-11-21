"use client";

import { Member, formatDateIndo, resolveMemberPhotoUrl } from "./types";
import { base64ToArrayBuffer, fillDocxTemplate } from "@/app/dashboard/surat/component/docx-template-helper";
import { getBase64Image, generateFallbackFormalPhoto, getPmiiPeriod } from "./generateCvPdf";
import { parseOrgItems } from "@/app/anggota/profil/_components/HistoryTab";

/**
 * Membuka pratinjau (preview) CV dari template dokumen Word (.docx) yang diunggah
 * langsung di tab baru browser dengan tampilan dokumen penuh serta opsi cetak/simpan PDF.
 */
export async function previewCustomDocxCv(
  member: Member,
  customTemplateBase64?: string
): Promise<void> {
  let buffer: ArrayBuffer;
  if (customTemplateBase64) {
    buffer = base64ToArrayBuffer(customTemplateBase64);
  } else {
    const res = await fetch("/templates/template-cv-pmii.docx");
    if (!res.ok) {
      throw new Error("Gagal mengunduh template CV resmi (/templates/template-cv-pmii.docx)");
    }
    buffer = await res.arrayBuffer();
  }

  // Format Tempat & Tanggal Lahir
  const ttlParts: string[] = [];
  if (member.tempatLahir) ttlParts.push(member.tempatLahir);
  if (member.tanggalLahir) {
    const formattedTgl = formatDateIndo(member.tanggalLahir);
    if (formattedTgl && formattedTgl !== "-") ttlParts.push(formattedTgl);
  }
  const formattedTTL = ttlParts.length > 0 ? ttlParts.join(", ") : "-";

  // Format Riwayat Pendidikan Formal (Tanpa awalan SD:, SMP:, SMA:, PT:)
  const eduParts: string[] = [];
  if (member.pendidikanSD) {
    const yrs = [member.tahunMasukSD, member.tahunLulusSD].filter(Boolean).join(" – ");
    eduParts.push(`${member.pendidikanSD}${yrs ? ` (${yrs})` : ""}`);
  }
  if (member.pendidikanSMP) {
    const yrs = [member.tahunMasukSMP, member.tahunLulusSMP].filter(Boolean).join(" – ");
    eduParts.push(`${member.pendidikanSMP}${yrs ? ` (${yrs})` : ""}`);
  }
  if (member.pendidikanSMA) {
    const yrs = [member.tahunMasukSMA, member.tahunLulusSMA].filter(Boolean).join(" – ");
    eduParts.push(`${member.pendidikanSMA}${yrs ? ` (${yrs})` : ""}`);
  }
  if (member.perguruanTinggi) {
    const ptYrs = [member.tahunMasukPT, member.tahunLulusPT].filter(Boolean).join(" – ");
    const campus = member.jurusan ? `${member.perguruanTinggi} (${member.jurusan})` : member.perguruanTinggi;
    eduParts.push(`${campus}${ptYrs ? ` (${ptYrs})` : ""}`);
  }
  const formattedPendidikan = eduParts.length > 0 ? eduParts.join("\n") : "-";

  // Format Riwayat Pengalaman Organisasi (Tanpa awalan SMP:, SMA:, PT:)
  const formatOrgEntries = (raw?: string | null) => {
    if (!raw) return [];
    return parseOrgItems(raw).map((item) => {
      const yrs = [item.tahunMulai, item.tahunSelesai].filter(Boolean).join(" – ");
      return yrs ? `${item.nama} (${yrs})` : item.nama;
    });
  };
  const smpOrgs = formatOrgEntries(member.organisasiSMP);
  const smaOrgs = formatOrgEntries(member.organisasiSMA);
  const ptOrgs = formatOrgEntries(member.organisasiPT);

  const orgParts: string[] = [];
  smpOrgs.forEach((org) => orgParts.push(org));
  smaOrgs.forEach((org) => orgParts.push(org));
  ptOrgs.forEach((org) => orgParts.push(org));

  // Sertakan Keikutsertaan PMII
  const pmiiRange = getPmiiPeriod(member);
  const pmiiLabel = member.jabatan && member.jabatan !== "Anggota" ? `PMII (${member.jabatan})` : "Pergerakan Mahasiswa Islam Indonesia (PMII)";
  orgParts.push(pmiiRange ? `${pmiiLabel} (${pmiiRange})` : pmiiLabel);

  const formattedOrganisasi = orgParts.length > 0 ? orgParts.join("\n") : "-";

  const data: Record<string, string> = {
    nama: member.name || "-",
    nim: member.nim || member.nik || "-",
    ttl: formattedTTL,
    alamat: member.alamatRumah || member.alamatDomisili || (member as any).address || "-",
    phone: member.phone || "-",
    pendidikan: formattedPendidikan,
    organisasi: formattedOrganisasi,
    motto: (member as any).mottoHidup || member.orientasiProfetik || member.motivasiMapaba || member.minatPassion || "-",
    nipa: member.nipa || (member as any).nta || "-",
    komisariat: member.komisariat || (member as any).commissariat || "-"
  };

  // Siapkan foto kader (foto asli atau foto resmi PMII)
  const photoUrl = resolveMemberPhotoUrl(member);
  let photoDataUrl = "";
  if (photoUrl) {
    try {
      const imgObj = await getBase64Image(photoUrl);
      if (imgObj?.dataUrl) photoDataUrl = imgObj.dataUrl;
    } catch (e) {
      console.warn("Gagal mengambil foto kader:", e);
    }
  }
  if (!photoDataUrl) {
    photoDataUrl = generateFallbackFormalPhoto(member.name || "Kader PMII");
  }

  const result = fillDocxTemplate(buffer, data, photoDataUrl);
  if (result.error) {
    throw new Error(result.error);
  }

  // Render dokumen ke HTML menggunakan docx-preview
  const docx = await import("docx-preview");
  const renderContainer = document.createElement("div");
  await docx.renderAsync(result.arrayBuffer, renderContainer, undefined, {
    className: "docx",
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: false,
    ignoreFonts: false,
    breakPages: true,
    useBase64URL: true,
    renderHeaders: true,
    renderFooters: true,
    renderAltChunks: true
  });

  // 1. Periksa gambar di dalam dokumen & pastikan logo kop surat bebas border
  const renderedImgs = Array.from(renderContainer.querySelectorAll("img"));
  let foundPhotoInDom = false;
  renderedImgs.forEach((img) => {
    const src = img.getAttribute("src") || "";
    // Identifikasi gambar pas foto kader secara spesifik (BUKAN logo kop surat)
    const isMemberPhoto = src.includes("member_photo") || (Boolean(photoDataUrl) && src.startsWith("data:image") && src === photoDataUrl);
    if (isMemberPhoto) {
      foundPhotoInDom = true;
      img.className = "cv-photo-img";
      img.style.width = "3cm";
      img.style.height = "4cm";
      img.style.objectFit = "cover";
      img.style.border = "1.5px solid #000000";
      img.style.display = "block";
      img.style.boxShadow = "none";
      img.style.margin = "12px 0";
    } else {
      // Pastikan logo kop surat dan gambar header tidak diberi border apapun
      img.style.border = "none";
      img.style.outline = "none";
      img.style.boxShadow = "none";
      img.style.borderRadius = "0";
    }
  });

  // 2. Jika pas foto belum muncul di DOM preview, sisipkan pas foto 3x4 di bawah Motto Hidup di sebelah kiri
  if (!foundPhotoInDom && photoDataUrl) {
    const allElements = Array.from(renderContainer.querySelectorAll("p, tr, td, div, span"));
    const mottoEl = allElements.find((el) => {
      const txt = (el.textContent || "").trim().toLowerCase();
      return txt.includes("motto hidup") || txt.includes("motto :");
    });

    const photoWrapper = document.createElement("div");
    photoWrapper.className = "cv-pas-foto-container";
    photoWrapper.style.cssText = "display: flex; justify-content: flex-start; margin-top: 14px; margin-bottom: 14px; text-align: left;";
    photoWrapper.innerHTML = `
      <div style="display: inline-block; text-align: left;">
        <img
          src="${photoDataUrl}"
          alt="Pas Foto 3x4"
          class="cv-photo-img"
          style="width: 3cm !important; height: 4cm !important; object-fit: cover !important; border: 1.5px solid #000000 !important; box-shadow: none !important; display: block !important; background-color: #ffffff !important;"
        />
      </div>
    `;

    if (mottoEl) {
      const tableParent = mottoEl.closest("table");
      if (tableParent && tableParent.parentNode) {
        tableParent.parentNode.insertBefore(photoWrapper, tableParent.nextSibling);
      } else {
        const pParent = mottoEl.closest("p") || mottoEl;
        if (pParent.parentNode) {
          pParent.parentNode.insertBefore(photoWrapper, pParent.nextSibling);
        }
      }
    } else {
      const firstSection = renderContainer.querySelector("section.docx") || renderContainer;
      firstSection.appendChild(photoWrapper);
    }
  }

  const cleanName = (member.name || "Kader").replace(/[^a-zA-Z0-9_\-]/g, "_");
  const fileName = `CV_${cleanName}.docx`;
  const docxBlobUrl = URL.createObjectURL(result.blob);

  // Ambil semua style dari halaman
  const allStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((el) => el.outerHTML)
    .join("\n");

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    // Jika popup diblokir browser, unduh langsung file word
    const a = document.createElement("a");
    a.href = docxBlobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  previewWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Curriculum Vitae — ${member.name || "Kader PMII"}</title>
        ${allStyles}
        <style>
          @page {
            size: auto;
            margin: 10mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #f4f4f5 !important;
            color: #09090b !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
          .toolbar {
            position: sticky;
            top: 0;
            z-index: 9999;
            background: #ffffff;
            border-bottom: 1px solid #e4e4e7;
            padding: 10px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          }
          .toolbar-info {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .toolbar-title {
            font-size: 13px;
            font-weight: 600;
            color: #18181b;
          }
          .toolbar-badge {
            font-size: 11px;
            font-weight: 500;
            padding: 2px 8px;
            border-radius: 4px;
            background: #fef3c7;
            border: 1px solid #fde68a;
            color: #92400e;
          }
          .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .btn {
            font-size: 12px;
            font-weight: 500;
            padding: 6px 14px;
            border-radius: 6px;
            cursor: pointer;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            text-decoration: none;
            transition: all 0.15s ease;
          }
          .btn-primary {
            background: #18181b;
            color: #ffffff;
          }
          .btn-primary:hover {
            background: #27272a;
          }
          .btn-outline {
            background: #ffffff;
            color: #27272a;
            border: 1px solid #d4d4d8;
          }
          .btn-outline:hover {
            background: #f4f4f5;
          }
          .doc-container {
            max-width: 900px;
            margin: 24px auto 60px auto;
            padding: 0 16px;
          }
          .docx-wrapper {
            background: transparent !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }
          .docx-wrapper img:not(.cv-photo-img),
          header img,
          .docx-header img {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
          .cv-photo-img {
            width: 3cm !important;
            height: 4cm !important;
            object-fit: cover !important;
            border: 1.5px solid #000000 !important;
            box-shadow: none !important;
            display: block !important;
          }
          .docx-wrapper > section.docx {
            background: #ffffff !important;
            margin: 0 auto 24px auto !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04) !important;
            border-radius: 4px !important;
          }
          @media print {
            .toolbar {
              display: none !important;
            }
            html, body {
              background: #ffffff !important;
            }
            .doc-container {
              margin: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
            }
            .docx-wrapper > section.docx {
              margin: 0 auto !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div class="toolbar-info">
            <span class="toolbar-title">Curriculum Vitae — ${member.name || "Kader"}</span>
            <span class="toolbar-badge">Template Word (.docx) Kustom</span>
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-outline" onclick="window.print()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Cetak / Simpan PDF
            </button>
            <a class="btn btn-primary" href="${docxBlobUrl}" download="${fileName}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Unduh Dokumen (.docx)
            </a>
          </div>
        </div>
        <div class="doc-container">
          <div id="cv-content">${renderContainer.innerHTML}</div>
        </div>
      </body>
    </html>
  `);
  previewWindow.document.close();
}
