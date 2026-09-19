/**
 * Utility to export ID Cards (KTA or Kartu Peserta MAPABA) as high-resolution PNG images
 * using HTML5 Canvas with native pixel ratio scaling, matching the dark-gold premium theme.
 */

import QRCode from "qrcode";

interface CardExportData {
  type: "peserta" | "kta";
  name: string;
  idNumber: string; // registrationNumber or NTA
  commissariat: string;
  level: string;
  eventName?: string; // only for peserta
  eventDate?: string; // only for peserta
  startDate?: string; // only for kta (Inauguration Date)
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill = false,
  stroke = true
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

export async function exportCardAsImage(data: CardExportData): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      // Create a canvas element (2x resolution for super crisp export)
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not acquire 2D context");
      }

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // 1. Draw Background: Premium Deep Dark Black/Blue (#0c101a)
      const bgGradient = ctx.createLinearGradient(0, 0, 720, 480);
      bgGradient.addColorStop(0, "#0c101a");
      bgGradient.addColorStop(1, "#090d16");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 720, 480);

      // Draw subtle radial glow in top right
      const glow = ctx.createRadialGradient(600, 80, 0, 600, 80, 300);
      glow.addColorStop(0, "rgba(245, 158, 11, 0.12)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 720, 480);

      // 2. Draw outer border: Gold/Amber with 0.3 opacity
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      drawRoundedRect(ctx, 24, 24, 672, 432, 32, false, true);

      // 3. Draw Watermark background text
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
      ctx.font = "900 180px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(data.level.toUpperCase(), 690, 440);
      ctx.restore();

      // 4. Header Section
      // Draw Logo Box (PM logo)
      ctx.save();
      ctx.fillStyle = "#f59e0b"; // gold/amber
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, 48, 48, 56, 56, 12, true, true);

      // Draw logo initials
      ctx.fillStyle = "#090d16";
      ctx.font = "900 22px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KGP", 76, 76);
      ctx.restore();

      // Header Titles
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 21px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`PMII ${data.commissariat}`, 120, 50);

      // Subheader
      ctx.fillStyle = "#f59e0b"; // gold
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("PK KI AGENG GETAS PENDAWA", 120, 78);
      ctx.restore();

      // Badge (top right)
      ctx.save();
      const badgeText = data.type === "peserta" ? "PESERTA" : "KADER";
      ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, 540, 48, 132, 40, 8, true, true);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "900 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, 606, 68);
      ctx.restore();

      // Divider Line
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, 128);
      ctx.lineTo(672, 128);
      ctx.stroke();
      ctx.restore();

      // 5. Left Side: QR Code Area
      // Draw White QR Code background card
      ctx.save();
      ctx.fillStyle = "#ffffff";
      drawRoundedRect(ctx, 48, 156, 180, 180, 24, true, false);
      ctx.restore();

      // Draw Absensi / QR Code Label
      ctx.save();
      ctx.fillStyle = "#f59e0b";
      ctx.font = "900 20px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(data.idNumber, 138, 350);

      ctx.fillStyle = "#71717a"; // zinc-500
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(data.type === "peserta" ? "ABSENSI QR" : "QR DIGITAL NTA", 138, 380);
      ctx.restore();

      // 6. Right Side: Detail Information Fields
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // Helper function to draw info fields
      const drawInfoField = (label: string, value: string, x: number, y: number, isGold = false) => {
        // Label
        ctx.fillStyle = "#71717a"; // zinc-500
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(label.toUpperCase(), x, y);

        // Value
        ctx.fillStyle = isGold ? "#f59e0b" : "#ffffff";
        ctx.font = "900 20px sans-serif";
        ctx.fillText(value, x, y + 20);
      };

      if (data.type === "peserta") {
        // Name
        const formattedName = data.name.startsWith("Sahabat") ? data.name : `Sahabat ${data.name}`;
        drawInfoField("Nama Lengkap", formattedName, 260, 156);
        // Event Name
        drawInfoField("Kegiatan", data.eventName || "-", 260, 224);
        // Jenjang
        drawInfoField("Jenjang", data.level, 260, 292, true);
        // Date
        drawInfoField("Tanggal", data.eventDate || "-", 480, 292);
      } else {
        // KTA details
        drawInfoField("Nama Lengkap", data.name, 260, 156);
        // Commission
        drawInfoField("Komisariat", data.commissariat, 260, 224);
        // NTA
        drawInfoField("NTA Keanggotaan", data.idNumber, 260, 292);
      }
      ctx.restore();

      // 7. Footer Notice
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, 412);
      ctx.lineTo(672, 412);
      ctx.stroke();

      ctx.fillStyle = "#71717a";
      ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const footerText = data.type === "peserta"
        ? "BAWA KARTU INI UNTUK BUKTI ABSENSI ACARA"
        : `DILANTIK: ${data.startDate || "2026-05-22"}  |  ANGGOTA RESMI PMII KOTA SEMARANG`;
      ctx.fillText(footerText, 360, 442);
      ctx.restore();

      // 8. Generate QR Code locally via QRCode library (100% offline-safe)
      const qrData = data.idNumber || data.name || "PMII";
      QRCode.toDataURL(qrData, {
        width: 280,
        margin: 1,
        color: {
          dark: "#090d16",
          light: "#ffffff"
        }
      })
        .then((qrDataUrl) => {
          const img = new Image();
          img.onload = () => {
            // Draw the QR Code image inside white rounded rect (x:48 + padding:15 = 63, y:156 + padding:15 = 171)
            ctx.drawImage(img, 63, 171, 150, 150);

            // Convert canvas to image file and trigger download
            try {
              const dataUrl = canvas.toDataURL("image/png");
              const link = document.createElement("a");
              link.download = data.type === "peserta"
                ? `Kartu-Peserta-${data.name.replace(/\s+/g, "-")}.png`
                : `KTA-Digital-${data.name.replace(/\s+/g, "-")}.png`;
              link.href = dataUrl;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              resolve(true);
            } catch (exportError) {
              console.error("Canvas export failed:", exportError);
              reject(exportError);
            }
          };

          img.onerror = () => {
            // Fallback export even if image fails
            try {
              const dataUrl = canvas.toDataURL("image/png");
              const link = document.createElement("a");
              link.download = `Kartu-${data.name.replace(/\s+/g, "-")}.png`;
              link.href = dataUrl;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              resolve(true);
            } catch (exportError) {
              reject(exportError);
            }
          };

          img.src = qrDataUrl;
        })
        .catch((qrErr) => {
          console.error("Local QR Code generation failed:", qrErr);
          // Export without QR if generation fails
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Kartu-${data.name.replace(/\s+/g, "-")}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve(true);
        });

    } catch (err) {
      console.error("Error drawing card:", err);
      reject(err);
    }
  });
}
