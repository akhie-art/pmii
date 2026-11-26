// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import PizZip from "pizzip";
import {
  ARIAL_NARROW_FONT_STACK,
  CALIBRI_FONT_STACK,
  MONOTYPE_CORSIVA_FONT_STACK,
  buildDocxPrintStyleBlock,
  enhanceRenderedDocxDom,
  extractDocxPageMetadata,
  extractDocxPrintMetrics,
  normalizeBordersXml,
  normalizeRFontsXml,
  prepareDocxBufferForPreview,
  recoverShapeHorizontalLinesXml,
  rewriteDocxCompatibilityFontsCss,
  rewriteMonotypeCorsivaCss,
  upgradeThinDoubleBordersCss,
} from "@/app/dashboard/surat/component/docx-preview-helper";
import { sanitizeDocumentCss, sanitizeLetterHtml } from "@/lib/sanitize";

function buildSyntheticDocx(files: Record<string, string>): ArrayBuffer {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/></Types>'
  );
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generate({ type: "arraybuffer" });
}

describe("DOCX Preview Fidelity — Monotype Corsiva Footer Font", () => {
  it("copies w:hAnsi / w:cs Monotype Corsiva into w:ascii and strips conflicting w:asciiTheme", () => {
    const footerXml = `<?xml version="1.0" encoding="UTF-8"?>
      <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:p>
          <w:r>
            <w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:hAnsi="Monotype Corsiva" w:cs="Monotype Corsiva"/></w:rPr>
            <w:t>Dzikir, Fikir, Amal Sholeh</w:t>
          </w:r>
        </w:p>
      </w:ftr>`;

    const normalized = normalizeRFontsXml(footerXml, { isFooter: true });
    expect(normalized).toContain('w:ascii="Monotype Corsiva"');
    expect(normalized).not.toContain("w:asciiTheme=");
  });

  it("propagates Monotype Corsiva from w:pPr/w:rPr to footer runs that omit w:rFonts", () => {
    const footerXml = `<?xml version="1.0" encoding="UTF-8"?>
      <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:p>
          <w:pPr>
            <w:rPr><w:rFonts w:hAnsi="Monotype Corsiva"/></w:rPr>
          </w:pPr>
          <w:r><w:t>Dzikir, Fikir, Amal Sholeh</w:t></w:r>
        </w:p>
      </w:ftr>`;

    const normalized = normalizeRFontsXml(footerXml, { isFooter: true });
    expect(normalized).toMatch(/<w:r><w:rPr><w:rFonts[^>]*w:ascii="Monotype Corsiva"[^>]*\/><\/w:rPr><w:t>Dzikir/);
  });

  it("rewrites Monotype Corsiva in CSS rules, theme variables, and inline styles idempotently", () => {
    const css = `
      :root { --docx-minorHAnsi-font: "Monotype Corsiva"; }
      .docx-footer span { font-family: "Monotype Corsiva", serif; font-size: 11pt; }
      .important { font-family: 'Monotype Corsiva' !important; }
    `;
    const once = rewriteMonotypeCorsivaCss(css);
    expect(once).toContain(`--docx-minorHAnsi-font: ${MONOTYPE_CORSIVA_FONT_STACK};`);
    expect(once).toContain(`font-family: ${MONOTYPE_CORSIVA_FONT_STACK}, serif;`);
    expect(once).toContain(`font-family: ${MONOTYPE_CORSIVA_FONT_STACK} !important;`);

    // Idempotent on second pass
    expect(rewriteMonotypeCorsivaCss(once)).toBe(once);
  });

  it("preserves Monotype Corsiva fallback stack and Kop double borders through sanitizeLetterHtml", () => {
    const rawHtml = `
      <div class="docx-wrapper">
        <style>
          .docx-footer { font-family: "Monotype Corsiva"; }
          .docx-kop { border-bottom: 1.5pt double #000000; }
        </style>
        <section class="docx">
          <header>
            <p style="border-bottom: 3pt double #000000;">Sekretariat PMII</p>
          </header>
          <footer>
            <p><span style="font-family: &quot;Monotype Corsiva&quot;;">Dzikir, Fikir, Amal Sholeh</span></p>
          </footer>
        </section>
      </div>
    `;

    const safe = sanitizeLetterHtml(rawHtml, { preserveDocxLayout: true });
    expect(safe).toContain("var(--font-corsiva");
    expect(safe).toContain("border-bottom: 3pt double #000000");
    expect(sanitizeDocumentCss('.a { font-family: "Monotype Corsiva"; }')).toContain("--font-corsiva");
    expect(upgradeThinDoubleBordersCss("border-bottom: 1.5pt double #000;")).toContain("3pt double");
  });
});

describe("DOCX Preview Fidelity — Kop Surat Dividing Line Recovery", () => {
  it("repairs OOXML borders with thickThinSmallGap or omitted color/sz", () => {
    const xml = `
      <w:p>
        <w:pPr>
          <w:pBdr>
            <w:bottom w:val="thickThinSmallGap" w:sz="18" w:space="4"/>
          </w:pBdr>
        </w:pPr>
      </w:p>`;
    const fixed = normalizeBordersXml(xml);
    expect(fixed).toContain('w:val="double"');
    expect(fixed).toContain('w:sz="24"');
    expect(fixed).toContain('w:color="000000"');
  });

  it("recovers Kop Surat line from mc:AlternateContent (DrawingML wps:wsp + VML v:line fallback)", () => {
    const headerXml = `<?xml version="1.0" encoding="UTF-8"?>
      <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
             xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
             xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
             xmlns:v="urn:schemas-microsoft-com:vml">
        <w:p><w:r><w:t>PENGURUS KOMISARIAT PMII</w:t></w:r></w:p>
        <w:p>
          <w:r>
            <mc:AlternateContent>
              <mc:Choice Requires="wps">
                <w:drawing>
                  <wp:anchor>
                    <wp:positionV relativeFrom="paragraph"><wp:posOffset>63500</wp:posOffset></wp:positionV>
                    <wp:extent cy="0" cx="5715000"/>
                    <a:graphic><a:graphicData>
                      <wps:wsp>
                        <wps:spPr>
                          <a:xfrm><a:off x="0" y="0"/><a:ext cy="0" cx="5715000"/></a:xfrm>
                          <a:prstGeom prst="line"><a:avLst/></a:prstGeom>
                          <a:ln w="38100" cmpd="thickThin"><a:solidFill><a:srgbClr val="0A2A5C"/></a:solidFill></a:ln>
                        </wps:spPr>
                      </wps:wsp>
                    </a:graphicData></a:graphic>
                  </wp:anchor>
                </w:drawing>
              </mc:Choice>
              <mc:Fallback>
                <w:pict>
                  <v:line from="0,0" to="450pt,0" strokecolor="#0A2A5C" strokeweight="3pt">
                    <v:stroke linestyle="thickThin"/>
                  </v:line>
                </w:pict>
              </mc:Fallback>
            </mc:AlternateContent>
          </w:r>
        </w:p>
      </w:hdr>`;

    const recovered = recoverShapeHorizontalLinesXml(headerXml, { isHeaderOrFooter: true });
    expect(recovered).not.toContain("<mc:AlternateContent");
    expect(recovered).toContain('<w:bottom w:val="double" w:sz="24" w:space="0" w:color="0A2A5C"/>');
  });

  it("preserves exact two-tone stacked Kop Surat lines (PMII blue #0070C0 over gray #D0D0D0) sorted top-to-bottom", () => {
    const headerXml = `<?xml version="1.0" encoding="UTF-8"?>
      <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
             xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
             xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
             xmlns:v="urn:schemas-microsoft-com:vml">
        <w:p>
          <w:r>
            <mc:AlternateContent>
              <mc:Choice Requires="wps">
                <w:drawing>
                  <wp:anchor>
                    <wp:positionV relativeFrom="paragraph"><wp:posOffset>89952</wp:posOffset></wp:positionV>
                    <wp:extent cx="5927961" cy="0"/>
                    <a:graphic><a:graphicData>
                      <wps:wsp>
                        <wps:spPr>
                          <a:xfrm><a:off x="0" y="0"/><a:ext cx="5927961" cy="0"/></a:xfrm>
                          <a:prstGeom prst="line"><a:avLst/></a:prstGeom>
                          <a:ln w="28575"><a:solidFill><a:schemeClr val="bg2"><a:lumMod val="90000"/></a:schemeClr></a:solidFill></a:ln>
                        </wps:spPr>
                      </wps:wsp>
                    </a:graphicData></a:graphic>
                  </wp:anchor>
                </w:drawing>
              </mc:Choice>
              <mc:Fallback>
                <w:pict>
                  <v:line from="1.05pt,7.1pt" to="467.8pt,7.1pt" strokecolor="#d0d0d0 [2894]" strokeweight="2.25pt"/>
                </w:pict>
              </mc:Fallback>
            </mc:AlternateContent>
          </w:r>
          <w:r>
            <mc:AlternateContent>
              <mc:Choice Requires="wps">
                <w:drawing>
                  <wp:anchor>
                    <wp:positionV relativeFrom="paragraph"><wp:posOffset>69052</wp:posOffset></wp:positionV>
                    <wp:extent cx="5930573" cy="0"/>
                    <a:graphic><a:graphicData>
                      <wps:wsp>
                        <wps:spPr>
                          <a:xfrm><a:off x="0" y="0"/><a:ext cx="5930573" cy="0"/></a:xfrm>
                          <a:prstGeom prst="line"><a:avLst/></a:prstGeom>
                          <a:ln w="19050"><a:solidFill><a:srgbClr val="0070C0"/></a:solidFill></a:ln>
                        </wps:spPr>
                      </wps:wsp>
                    </a:graphicData></a:graphic>
                  </wp:anchor>
                </w:drawing>
              </mc:Choice>
              <mc:Fallback>
                <w:pict>
                  <v:line from="1.05pt,5.45pt" to="468pt,5.45pt" strokecolor="#0070c0" strokeweight="1.5pt"/>
                </w:pict>
              </mc:Fallback>
            </mc:AlternateContent>
          </w:r>
        </w:p>
      </w:hdr>`;

    const recovered = recoverShapeHorizontalLinesXml(headerXml, { isHeaderOrFooter: true });
    expect(recovered).not.toContain("<mc:AlternateContent");
    // Garis atas (5.45pt) = Biru PMII #0070C0 (1.5pt = sz 12)
    expect(recovered).toContain('<w:top w:val="single" w:sz="12" w:space="0" w:color="0070C0"/>');
    // Garis bawah (7.1pt) = Abu-abu #D0D0D0 (2.25pt = sz 18)
    expect(recovered).toContain('<w:bottom w:val="single" w:sz="18" w:space="0" w:color="D0D0D0"/>');
  });

  it("recovers grouped double VML lines (<v:group> with thick + thin lines) and standalone Word horizontal rules", () => {
    const bodyXml = `<?xml version="1.0" encoding="UTF-8"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                  xmlns:v="urn:schemas-microsoft-com:vml"
                  xmlns:o="urn:schemas-microsoft-com:office:office">
        <w:body>
          <w:p>
            <w:r>
              <w:pict>
                <v:group style="width:450pt;height:4pt" coordsize="21600,200">
                  <v:line from="0,0" to="21600,0" strokeweight="2.25pt" strokecolor="black"/>
                  <v:line from="0,150" to="21600,150" strokeweight=".75pt" strokecolor="black"/>
                </v:group>
              </w:pict>
            </w:r>
          </w:p>
          <w:p>
            <w:r>
              <w:pict>
                <v:rect o:hr="t" style="width:0;height:1.5pt" fillcolor="#111111" stroked="f"/>
              </w:pict>
            </w:r>
          </w:p>
        </w:body>
      </w:document>`;

    const recovered = recoverShapeHorizontalLinesXml(bodyXml);
    expect(recovered).not.toContain("<v:group");
    expect(recovered).not.toContain("<v:rect");
    expect(recovered).toContain('w:val="double"');
    expect(recovered).toContain('w:color="000000"');
  });

  it("recovers standalone DrawingML w:drawing horizontal line without mc:Fallback and preserves logos", () => {
    const docXml = `<?xml version="1.0" encoding="UTF-8"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
                  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
                  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
        <w:body>
          <w:tbl>
            <w:tr>
              <w:tc>
                <w:p>
                  <w:r>
                    <w:drawing>
                      <wp:inline>
                        <wp:extent cx="720000" cy="720000"/>
                        <a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rIdLogo"/></pic:blipFill></pic:pic></a:graphicData></a:graphic>
                      </wp:inline>
                    </w:drawing>
                  </w:r>
                </w:p>
              </w:tc>
              <w:tc>
                <w:p>
                  <w:r><w:t>PERGERAKAN MAHASISWA ISLAM INDONESIA</w:t></w:r>
                  <w:r>
                    <w:drawing>
                      <wp:anchor>
                        <wp:extent cx="5800000" cy="0"/>
                        <a:graphic><a:graphicData>
                          <wps:wsp>
                            <wps:spPr>
                              <a:xfrm><a:off x="0" y="0"/><a:ext cx="5800000" cy="0"/></a:xfrm>
                              <a:prstGeom prst="line"><a:avLst/></a:prstGeom>
                              <a:ln w="28575"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln>
                            </wps:spPr>
                          </wps:wsp>
                        </a:graphicData></a:graphic>
                      </wp:anchor>
                    </w:drawing>
                  </w:r>
                </w:p>
              </w:tc>
            </w:tr>
          </w:tbl>
        </w:body>
      </w:document>`;

    const recovered = recoverShapeHorizontalLinesXml(docXml);
    // Logo tetap utuh 100%
    expect(recovered).toContain('r:embed="rIdLogo"');
    // Garis lebar di dalam sel tabel ditempatkan tepat setelah </w:tbl> agar penuh selebar kop surat
    expect(recovered).toMatch(/<\/w:tbl><w:p><w:pPr>[\s\S]*?<w:bottom w:val="single" w:sz="18" w:space="0" w:color="000000"\/>/);
  });

  it("prepareDocxBufferForPreview transforms header/footer/document without mutating original buffer", () => {
    const originalDoc = `<?xml version="1.0" encoding="UTF-8"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:pPr><w:pBdr><w:bottom w:val="thickThinSmallGap" w:sz="12"/></w:pBdr></w:pPr><w:r><w:t>Kop Surat</w:t></w:r></w:p>
        </w:body>
      </w:document>`;
    const originalFooter = `<?xml version="1.0" encoding="UTF-8"?>
      <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:p><w:r><w:rPr><w:rFonts w:hAnsi="Monotype Corsiva"/></w:rPr><w:t>Dzikir, Fikir, Amal Sholeh</w:t></w:r></w:p>
      </w:ftr>`;

    const originalBuffer = buildSyntheticDocx({
      "word/document.xml": originalDoc,
      "word/footer1.xml": originalFooter,
    });
    const originalSnapshot = new Uint8Array(originalBuffer.slice(0));

    const previewBuffer = prepareDocxBufferForPreview(originalBuffer);

    // Pastikan buffer asli tidak berubah (aman untuk upload & unduh .docx master)
    expect(new Uint8Array(originalBuffer)).toEqual(originalSnapshot);

    const previewZip = new PizZip(previewBuffer);
    const previewDocXml = previewZip.file("word/document.xml")?.asText() || "";
    const previewFooterXml = previewZip.file("word/footer1.xml")?.asText() || "";

    expect(previewDocXml).toContain('w:val="double"');
    expect(previewDocXml).toContain('w:sz="24"');
    expect(previewDocXml).toContain('w:color="000000"');
    expect(previewFooterXml).toContain('w:ascii="Monotype Corsiva"');
  });

  it("extracts exact page dimensions, margins, and paper type for Google Docs ruler", () => {
    const f4Buffer = buildSyntheticDocx({
      "word/document.xml": `<?xml version="1.0" encoding="UTF-8"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Surat PMII</w:t></w:r></w:p>
            <w:sectPr>
              <w:pgSz w:w="12240" w:h="20160"/>
              <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
            </w:sectPr>
          </w:body>
        </w:document>`,
      "word/header1.xml": "<w:hdr/>",
      "word/footer1.xml": "<w:ftr/>",
    });

    const meta = extractDocxPageMetadata(f4Buffer);
    expect(meta.widthPt).toBe(612);
    expect(meta.heightPt).toBe(1008);
    expect(meta.marginLeftPt).toBe(72);
    expect(meta.marginRightPt).toBe(72);
    expect(meta.marginLeftCm).toBe(2.54);
    expect(meta.paperLabel).toBe("Legal / F4");
    expect(meta.hasHeader).toBe(true);
    expect(meta.hasFooter).toBe(true);
  });

  it("adds metric-compatible fallbacks for Arial Narrow and Calibri/Aptos idempotently", () => {
    const css = `
      .docx { --docx-minorHAnsi-font: Aptos; }
      .kop { font-family: "Arial Narrow"; }
      .body { font-family: Calibri; }
    `;
    const once = rewriteDocxCompatibilityFontsCss(css);
    expect(once).toContain(`font-family: ${ARIAL_NARROW_FONT_STACK};`);
    expect(once).toContain(`font-family: ${CALIBRI_FONT_STACK};`);
    expect(once).toContain(`--docx-minorHAnsi-font: ${CALIBRI_FONT_STACK};`);
    expect(rewriteDocxCompatibilityFontsCss(once)).toBe(once);
  });

  it("extracts exact DOCX paper size & dominant font size for print preview without line-height inflation", () => {
    const renderedHtml = `
      <div class="docx-wrapper">
        <section class="docx" style="padding: 72pt; width: 612pt; min-height: 1008pt;">
          <article>
            <p><span style="font-size: 11pt;">Kepada Yth.</span></p>
            <p><span style="font-size: 11pt;">Panitia Pelaksana</span></p>
            <p></p>
          </article>
        </section>
      </div>
    `;
    const metrics = extractDocxPrintMetrics(renderedHtml);
    expect(metrics.isDocxContent).toBe(true);
    expect(metrics.pageWidthCss).toBe("612pt");
    expect(metrics.pageHeightCss).toBe("1008pt");
    expect(metrics.dominantFontSizeCss).toBe("11pt");

    const css = buildDocxPrintStyleBlock(renderedHtml, { fontVarsCss: ":root { --font-corsiva: 'Charm'; }" });
    expect(css).toContain("size: 612pt 1008pt;");
    expect(css).toContain("line-height: 1.08 !important;");
    expect(css).toContain("font-size: 11pt;");
    expect(css).toContain("min-height: calc(1008pt - 2pt) !important;");
    expect(css).not.toContain("font-family: 'Times New Roman', 'Arial', sans-serif !important;");
  });

  it("strips stray trailing tab runs after inline logo drawings in header cells to prevent Kop line gap", () => {
    const headerDoc = buildSyntheticDocx({
      "word/document.xml":
        '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/></w:body></w:document>',
      "word/header1.xml": `<?xml version="1.0" encoding="UTF-8"?>
        <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:tbl><w:tr><w:tc>
            <w:p><w:r><w:drawing><wp:inline/></w:drawing></w:r><w:r><w:tab/></w:r></w:p>
          </w:tc></w:tr></w:tbl>
        </w:hdr>`,
    });

    const prepared = prepareDocxBufferForPreview(headerDoc);
    const outZip = new PizZip(prepared);
    const outHeader = outZip.file("word/header1.xml")?.asText() || "";
    expect(outHeader).toContain("<w:drawing>");
    expect(outHeader).not.toContain("<w:tab/>");
  });

  it("converts docx-preview inline-block drawing divs inside <p> to <span> so HTML5 re-parse never injects phantom blank <p> lines", () => {
    const container = document.createElement("div");

    // Simulasikan struktur DOM live yang dibuat docx-preview: <p><span><div style="display:inline-block"><img></div></span></p>
    const wrapper = document.createElement("div");
    wrapper.className = "docx-wrapper";
    const section = document.createElement("section");
    section.className = "docx";
    const p = document.createElement("p");
    p.className = "docx_header";
    const runSpan = document.createElement("span");
    const drawingDiv = document.createElement("div");
    drawingDiv.setAttribute("style", "width: 82pt; height: 94pt; display: inline-block; position: relative;");
    const img = document.createElement("img");
    img.setAttribute("src", "data:image/png;base64,iVBORw0KGgo=");
    img.setAttribute("style", "width: 82pt; height: 94pt;");
    drawingDiv.appendChild(img);
    runSpan.appendChild(drawingDiv);
    p.appendChild(runSpan);
    section.appendChild(p);
    wrapper.appendChild(section);
    container.appendChild(wrapper);

    enhanceRenderedDocxDom(container);

    // Tidak ada lagi <div> di dalam <p>
    expect(container.querySelector("p div")).toBeNull();
    expect(container.querySelector("p img")).not.toBeNull();
    expect(p.style.lineHeight).toBe("0");

    // Re-parse melalui sanitizeLetterHtml (HTML5 parser): tetap 1 <p>, tanpa <p> kosong sebelum/sesudah gambar
    const sanitized = sanitizeLetterHtml(container.innerHTML, { preserveDocxLayout: true });
    const reparsed = new DOMParser().parseFromString(sanitized, "text/html");
    expect(reparsed.querySelectorAll("p").length).toBe(1);
    expect(reparsed.querySelector("p img")).not.toBeNull();
  });

  it("repairs legacy archived docx HTML where HTML5 parser split drawing divs into phantom blank <p> lines", () => {
    const legacyHtml = `<div class="docx-wrapper"><section class="docx"><header><table><tbody><tr><td><p class="docx_header" style="font-size: 11pt;"><span></span></p><div style="width: 82pt; height: 94pt; display: inline-block; position: relative;"><img src="data:image/png;base64,iVBORw0KGgo=" style="width: 82pt; height: 94pt;"></div><p></p></td></tr></tbody></table></header></section></div>`;
    const cleaned = sanitizeLetterHtml(legacyHtml, { preserveDocxLayout: true });
    const reparsed = new DOMParser().parseFromString(cleaned, "text/html");
    expect(reparsed.querySelectorAll("td p").length).toBe(1);
    expect(reparsed.querySelector("td div")).toBeNull();
    expect(reparsed.querySelector("td p img")).not.toBeNull();
  });
});
