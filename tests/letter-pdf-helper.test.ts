import { describe, expect, it } from "vitest";
import {
  buildLetterPdfFileName,
  cssLengthToMm,
  HTML2CANVAS_FONT_METRICS_FIX_CSS,
  isPdfAttachment,
  PDF_IFRAME_BASE_RESET_CSS,
  resolvePdfPageDimensionsMm,
} from "@/app/dashboard/surat/component/letter-pdf-helper";

describe("letter-pdf-helper: utilitas penamaan & dimensi PDF surat", () => {
  it("membentuk nama berkas .pdf yang bersih dari karakter ilegal dan membatasi panjang", () => {
    expect(
      buildLetterPdfFileName({
        nomor: "001.PK-XI/Z-03:01.2026",
        subject: "Undangan MAPABA Ke-V / Universitas An Nuur",
      })
    ).toBe("001.PK-XI_Z-03_01.2026_Undangan_MAPABA_Ke-V_Universitas_An_Nuur.pdf");

    expect(buildLetterPdfFileName({ nomor: "", subject: "" })).toBe("Surat_Resmi_PMII.pdf");

    const veryLong = buildLetterPdfFileName({
      nomor: "001.PK-XI.Z-03.01.010.B-II.11.2026",
      subject: "Perihal Surat Sangat Panjang ".repeat(10),
    });
    expect(veryLong.endsWith(".pdf")).toBe(true);
    expect(veryLong.length).toBeLessThanOrEqual(92);
  });

  it("mengonversi satuan panjang CSS (pt, px, mm, cm, in) ke milimeter secara akurat", () => {
    expect(cssLengthToMm("210mm", 100)).toBe(210);
    expect(cssLengthToMm("21.5cm", 100)).toBe(215);
    expect(cssLengthToMm("595.3pt", 100)).toBeCloseTo(210, 0);
    expect(cssLengthToMm("841.9pt", 100)).toBeCloseTo(297, 0);
    expect(cssLengthToMm("8.5in", 100)).toBeCloseTo(215.9, 1);
    expect(cssLengthToMm("793.7px", 100)).toBeCloseTo(210, 0);
    expect(cssLengthToMm("invalid", 210)).toBe(210);
    expect(cssLengthToMm(null, 297)).toBe(297);
  });

  it("membaca dimensi kertas PDF dari HTML docx (A4 & F4/Folio) serta fallback ke A4", () => {
    const f4Html =
      '<div class="docx-wrapper"><section class="docx" style="width: 215mm; min-height: 330mm;"><p>F4</p></section></div>';
    expect(resolvePdfPageDimensionsMm(f4Html)).toEqual({ widthMm: 215, heightMm: 330 });

    const a4PtHtml =
      '<div class="docx-wrapper"><section class="docx" style="width: 595.3pt; min-height: 841.9pt;"><p>A4</p></section></div>';
    const a4Dims = resolvePdfPageDimensionsMm(a4PtHtml);
    expect(a4Dims.widthMm).toBeCloseTo(210, 0);
    expect(a4Dims.heightMm).toBeCloseTo(297, 0);

    expect(resolvePdfPageDimensionsMm("<p>Surat HTML biasa</p>")).toEqual({
      widthMm: 210,
      heightMm: 297,
    });
  });

  it("mendeteksi lampiran PDF dengan akurat termasuk URL dengan query string", () => {
    expect(
      isPdfAttachment({
        fileUrl: "private-docs/tenant/surat/scan.pdf",
        fileName: "Surat_Undangan.PDF",
      })
    ).toBe(true);
    expect(
      isPdfAttachment({
        fileUrl: "https://example.supabase.co/storage/v1/object/sign/doc.pdf?token=abc",
        fileName: "Lampiran",
      })
    ).toBe(true);
    expect(
      isPdfAttachment({
        fileUrl: "private-docs/tenant/surat/foto.jpg",
        fileName: "foto.jpg",
      })
    ).toBe(false);
    expect(isPdfAttachment({ fileUrl: undefined, fileName: "test.pdf" })).toBe(false);
  });

  it("menyertakan perbaikan FontMetrics html2canvas (display: inline) & reset iframe tanpa oklch", () => {
    expect(HTML2CANVAS_FONT_METRICS_FIX_CSS).toContain('img[width="1"][height="1"]');
    expect(HTML2CANVAS_FONT_METRICS_FIX_CSS).toContain("display: inline !important");
    expect(HTML2CANVAS_FONT_METRICS_FIX_CSS).not.toContain("vertical-align");

    expect(PDF_IFRAME_BASE_RESET_CSS).toContain("border-collapse: collapse");
    expect(PDF_IFRAME_BASE_RESET_CSS).not.toContain("oklch");
  });
});
