/**
 * Utilitas Chroma Key / Auto-Transparency untuk Twibbon
 * Mendeteksi dan menghapus latar hijau (Green Screen / Chroma Key)
 * dari template twibbon Canva / Photoshop secara otomatis.
 */

export function isGreenPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 30) return false;
  // Deteksi warna hijau dominan (misal #00BF63, #03BF61, #00FF00, #22C55E)
  return g > 85 && g > r * 1.25 && g > b * 1.12;
}

/**
 * Menghilangkan piksel hijau dari HTMLImageElement dan mengembalikan canvas transparan
 */
export function removeGreenScreenFromImage(
  img: HTMLImageElement
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0);

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let hasGreen = false;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (isGreenPixel(r, g, b, a)) {
        data[i + 3] = 0; // Ubah Alpha menjadi 0 (transparan)
        hasGreen = true;
      }
    }

    if (hasGreen) {
      ctx.putImageData(imgData, 0, 0);
    }
  } catch (err) {
    console.warn("Notice: Gagal memproses chroma key (mungkin CORS restrict), memakai gambar asli:", err);
  }

  return canvas;
}

/**
 * Memproses berkas yang diunggah: jika ada green screen, konversi langsung menjadi PNG transparan
 */
export async function cleanTwibbonFileGreenScreen(
  file: File
): Promise<{ processedBlob: Blob; hasGreenScreen: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve({ processedBlob: file, hasGreenScreen: false });
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        let greenCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (isGreenPixel(r, g, b, a)) {
            data[i + 3] = 0; // Transparan
            greenCount++;
          }
        }

        const hasGreenScreen = greenCount > 500; // Jika ada area hijau signifikan

        if (hasGreenScreen) {
          ctx.putImageData(imgData, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({ processedBlob: blob, hasGreenScreen: true });
            } else {
              resolve({ processedBlob: file, hasGreenScreen: false });
            }
          }, "image/png");
        } else {
          resolve({ processedBlob: file, hasGreenScreen: false });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
