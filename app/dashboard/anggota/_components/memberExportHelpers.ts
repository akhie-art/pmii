"use client";

import type { Member } from "./types";

export async function exportMembersToExcel(members: Member[]): Promise<void> {
  const headers = [
    "NIPA/NTA",
    "Nama Lengkap",
    "Gender",
    "Tingkat Kaderisasi",
    "Komisariat",
    "Angkatan",
    "Status",
    "Jabatan",
    "Email",
    "Phone",
    "NIM",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Alamat Rumah",
    "Alamat Domisili",
    "Perguruan Tinggi",
    "Fakultas",
    "Jurusan",
    "Golongan Darah",
    "Riwayat Penyakit",
  ];

  const rows = members.map((m) => ({
    "NIPA/NTA": m.nipa || "-",
    "Nama Lengkap": m.name || "-",
    Gender: m.gender || "-",
    "Tingkat Kaderisasi": m.level || "-",
    Komisariat: m.komisariat || "-",
    Angkatan: m.angkatan || "-",
    Status: m.status || "-",
    Jabatan: m.jabatan || "-",
    Email: m.email || "-",
    Phone: m.phone || "-",
    NIM: m.nim || m.nik || "-",
    "Tempat Lahir": m.tempatLahir || "-",
    "Tanggal Lahir": m.tanggalLahir || "-",
    "Alamat Rumah": m.alamatRumah || "-",
    "Alamat Domisili": m.alamatDomisili || "-",
    "Perguruan Tinggi": m.perguruanTinggi || "-",
    Fakultas: m.fakultas || "-",
    Jurusan: m.jurusan || "-",
    "Golongan Darah": m.golonganDarah || "-",
    "Riwayat Penyakit": m.riwayatPenyakit || "-",
  }));

  const { exportToExcel } = await import("@/lib/excel");
  await exportToExcel(
    `Data_Kader_PMII_${new Date().toISOString().split("T")[0]}.xlsx`,
    [
      {
        name: "Data Kader",
        headers,
        rows,
      },
    ]
  );
}

export function downloadMemberKtaCard(
  member: Member,
  theme: "gold" | "emerald" | "dark",
  onToast: (message: string) => void
): void {
  onToast(`Menyiapkan KTA Digital untuk ${member.name}...`);

  const canvas = document.createElement("canvas");
  canvas.width = 1012;
  canvas.height = 638;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  let primaryColor = "#F7C738";
  let secondaryColor = "#0A2A5C";

  if (theme === "emerald") {
    bgGrad.addColorStop(0, "#022c22");
    bgGrad.addColorStop(0.5, "#064e3b");
    bgGrad.addColorStop(1, "#115e59");
    primaryColor = "#34d399";
    secondaryColor = "#022c22";
  } else if (theme === "dark") {
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(0.5, "#1e293b");
    bgGrad.addColorStop(1, "#0f172a");
    primaryColor = "#cbd5e1";
    secondaryColor = "#0f172a";
  } else {
    bgGrad.addColorStop(0, "#061833");
    bgGrad.addColorStop(0.5, "#0b2447");
    bgGrad.addColorStop(1, "#1e3a8a");
    primaryColor = "#F7C738";
    secondaryColor = "#0A2A5C";
  }

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 100, canvas.height);
    ctx.stroke();
  }

  ctx.strokeStyle = primaryColor + "55";
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.strokeStyle = primaryColor + "AA";
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.font = "bold 26px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.textAlign = "right";
  ctx.fillText(member.komisariat.toUpperCase(), canvas.width - 48, 68);

  ctx.textAlign = "left";
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.roundRect(48, 44, 46, 46, 10);
  ctx.fill();

  ctx.font = "900 32px sans-serif";
  ctx.fillStyle = secondaryColor;
  ctx.fillText("P", 60, 78);

  ctx.font = "900 30px sans-serif";
  ctx.fillStyle = primaryColor;
  ctx.fillText("KTA PMII DIGITAL", 110, 64);

  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Pergerakan Mahasiswa Islam Indonesia", 110, 84);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, 108);
  ctx.lineTo(canvas.width - 48, 108);
  ctx.stroke();

  const avatarX = 140;
  const avatarY = 300;
  const avatarR = 80;

  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR + 6, 0, Math.PI * 2);
  ctx.fill();

  const avatarGrad = ctx.createLinearGradient(
    avatarX - avatarR,
    avatarY - avatarR,
    avatarX + avatarR,
    avatarY + avatarR
  );
  avatarGrad.addColorStop(0, primaryColor);
  avatarGrad.addColorStop(1, theme === "dark" ? "#64748b" : "#c2410c");
  ctx.fillStyle = avatarGrad;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "bold 64px sans-serif";
  ctx.fillStyle = secondaryColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const initials = member.name
    .split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  ctx.fillText(initials, avatarX, avatarY);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const detailsX = 260;
  const drawDetailRow = (label: string, value: string, yPos: number, isTitle = false) => {
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText(label.toUpperCase(), detailsX, yPos);

    if (isTitle) {
      ctx.font = "bold 34px sans-serif";
      ctx.fillStyle = primaryColor;
    } else {
      ctx.font = "bold 22px sans-serif";
      ctx.fillStyle = "#ffffff";
    }
    ctx.fillText(value, detailsX, yPos + 28);
  };

  drawDetailRow("Nama Lengkap", member.name, 150, true);
  drawDetailRow("Nomor Induk Anggota (NIPA)", member.nipa, 240);
  drawDetailRow("Komisariat", member.komisariat, 320);

  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillText("KADERISASI UTAMA", detailsX, 400);

  ctx.font = "900 24px sans-serif";
  ctx.fillStyle = primaryColor;
  ctx.fillText(member.level, detailsX, 428);

  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillText("ANGKATAN", detailsX + 240, 400);

  ctx.font = "24px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(member.angkatan, detailsX + 240, 428);

  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillText("DIKELUARKAN SECARA DIGITAL OLEH PENGURUS CABANG PMII", 48, 570);

  const stampX = canvas.width - 160;
  const stampY = canvas.height - 130;

  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.rotate(-0.08);

  ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
  ctx.lineWidth = 4;
  ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
  ctx.beginPath();
  ctx.roundRect(-70, -30, 140, 60, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = "900 20px sans-serif";
  ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VALID", 0, -8);

  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
  ctx.fillText("PC PMII OFFICIAL", 0, 14);
  ctx.restore();

  const photoSrc = member.avatar || "";

  const executeDownload = () => {
    try {
      const link = document.createElement("a");
      link.download = `KTA_PMII_${member.name.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      onToast(`KTA Digital untuk ${member.name} berhasil diunduh.`);
    } catch (err) {
      console.error(err);
      onToast("Gagal mengunduh KTA digital.");
    }
  };

  if (photoSrc) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const aspect = img.width / img.height;
        let drawW = avatarR * 2;
        let drawH = avatarR * 2;
        let drawX = avatarX - avatarR;
        let drawY = avatarY - avatarR;

        if (aspect > 1) {
          drawW = drawH * aspect;
          drawX = avatarX - drawW / 2;
        } else {
          drawH = drawW / aspect;
          drawY = avatarY - drawH / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      } catch (e) {
        console.warn("Could not draw member photo to KTA canvas:", e);
      }
      executeDownload();
    };
    img.onerror = () => {
      executeDownload();
    };
    img.src = photoSrc;
  } else {
    setTimeout(executeDownload, 200);
  }
}
