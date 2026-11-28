import PizZip from "pizzip";

/**
 * Stack font kaligrafi Chancery yang konsisten lintas OS & browser untuk `Monotype Corsiva`.
 * - Windows dengan Office memakai `Monotype Corsiva` asli.
 * - macOS / Linux / iOS / Android memakai webfont `Charm` (self-hosted via `next/font/google`
 *   pada variabel CSS `--font-corsiva`) yang memiliki karakter miring kaligrafi Chancery serupa,
 *   dengan fallback `"Apple Chancery"`, `"URW Chancery L"`, dan `cursive`.
 */
export const MONOTYPE_CORSIVA_FONT_STACK =
  '"Monotype Corsiva", var(--font-corsiva, "Charm"), "Apple Chancery", "URW Chancery L", cursive';

export const ARIAL_NARROW_FONT_STACK =
  '"Arial Narrow", var(--font-arial-narrow, "Archivo Narrow"), "Liberation Sans Narrow", Arial, sans-serif';

export const CALIBRI_FONT_STACK =
  '"Calibri", "Aptos", var(--font-calibri, "Carlito"), "Liberation Sans", Arial, sans-serif';

export interface DocxPageMetadata {
  widthPt: number;
  heightPt: number;
  widthCm: number;
  heightCm: number;
  marginTopPt: number;
  marginRightPt: number;
  marginBottomPt: number;
  marginLeftPt: number;
  marginLeftCm: number;
  marginRightCm: number;
  paperLabel: string;
  orientation: "portrait" | "landscape";
  hasHeader: boolean;
  hasFooter: boolean;
}

const EMU_PER_PT = 12700;

const COMPOUND_DOUBLE_BORDER_VALS = new Set([
  "double",
  "doublewave",
  "triple",
  "thickthinsmallgap",
  "thickthinmediumgap",
  "thickthinlargegap",
  "thinthicksmallgap",
  "thinthickmediumgap",
  "thinthicklargegap",
  "thinthickthinsmallgap",
  "thinthickthinmediumgap",
  "thinthickthinlargegap",
]);

const KNOWN_SINGLE_OR_STYLED_BORDER_VALS = new Set([
  "single",
  "dashdotstroked",
  "dashed",
  "dashsmallgap",
  "dotdash",
  "dotdotdash",
  "dotted",
  "inset",
  "outset",
  "thick",
  "threedemboss",
  "threedengrave",
  "wave",
]);

const SCHEME_COLOR_FALLBACK: Record<string, string> = {
  dk1: "000000",
  tx1: "000000",
  dk2: "1F497D",
  tx2: "1F497D",
  accent1: "1F4E79",
  accent2: "C0504D",
  accent3: "9BBB59",
  accent4: "8064A2",
  accent5: "4BACC6",
  accent6: "F79646",
  lt1: "FFFFFF",
  bg1: "FFFFFF",
  lt2: "EEECE1",
  bg2: "EEECE1",
};

const NAMED_VML_COLORS: Record<string, string> = {
  black: "000000",
  navy: "000080",
  darkblue: "00008B",
  blue: "0000FF",
  gray: "808080",
  grey: "808080",
  darkgray: "404040",
  red: "FF0000",
  darkred: "8B0000",
  green: "008000",
  darkgreen: "006400",
  yellow: "FFFF00",
  gold: "D4AF37",
  white: "FFFFFF",
};

export interface HorizontalLineSpec {
  colorHex: string;
  hasExplicitColor: boolean;
  weightPt: number;
  borderVal: "single" | "double" | "dashed" | "dotted";
  widthPt: number;
  isFullWidth: boolean;
  yOffsetPt: number;
  relativeFrom?: string;
}

interface TagSpan {
  start: number;
  end: number;
  xml: string;
}

/**
 * Mengubah deklarasi CSS `font-family` dan variabel tema `--docx-*-font` untuk font Windows/Office
 * (`Monotype Corsiva`, `Arial Narrow`, `Calibri`, `Aptos`) agar menyertakan fallback webfont
 * self-hosted yang metriknya setara di semua OS (macOS, Linux, Windows, mobile).
 * Idempoten: tidak menggandakan stack bila sudah terpasang.
 */
export function rewriteDocxCompatibilityFontsCss(cssText: string): string {
  if (!cssText || !/(?:monotype\s+corsiva|mt\s+corsiva|arial\s+narrow|\bcalibri\b|\baptos\b)/i.test(cssText)) {
    return cssText;
  }

  return cssText.replace(
    /((?:font-family|--docx-[\w-]*font)\s*:\s*)([^;{}]+)(;?)/gi,
    (fullMatch, prefix: string, rawValue: string, suffix: string) => {
      const hasImportant = /!important\s*$/i.test(rawValue);
      let val = rawValue.replace(/\s*!important\s*$/i, "").trim();
      let changed = false;

      if (/monotype\s+corsiva|mt\s+corsiva/i.test(val) && !val.includes("--font-corsiva")) {
        val = val.replace(
          /(["']?)(?:monotype\s+corsiva|mt\s+corsiva)\1/gi,
          MONOTYPE_CORSIVA_FONT_STACK
        );
        changed = true;
      }

      if (/arial\s+narrow/i.test(val) && !val.includes("--font-arial-narrow")) {
        val = val.replace(/(["']?)arial\s+narrow\1/gi, ARIAL_NARROW_FONT_STACK);
        changed = true;
      }

      if (/\b(?:calibri|aptos)\b/i.test(val) && !val.includes("--font-calibri")) {
        val = val.replace(/(["']?)(?:calibri|aptos(?:\s+display)?)\1/gi, CALIBRI_FONT_STACK);
        changed = true;
      }

      if (!changed) return fullMatch;
      return `${prefix}${val}${hasImportant ? " !important" : ""}${suffix}`;
    }
  );
}

/** Alias kompatibilitas untuk pengujian & pemanggil lama. */
export function rewriteMonotypeCorsivaCss(cssText: string): string {
  return rewriteDocxCompatibilityFontsCss(cssText);
}

/**
 * Membaca dimensi halaman (`<w:pgSz>`) dan margin (`<w:pgMar>`) asli dari file `.docx`
 * untuk menampilkan penggaris horizontal ala Google Docs & informasi kertas 1:1.
 */
export function extractDocxPageMetadata(arrayBuffer: ArrayBuffer): DocxPageMetadata {
  // Default standar Word A4 (21.0 x 29.7 cm, margin 2.54 cm)
  const fallback: DocxPageMetadata = {
    widthPt: 595.3,
    heightPt: 841.9,
    widthCm: 21.0,
    heightCm: 29.7,
    marginTopPt: 72,
    marginRightPt: 72,
    marginBottomPt: 72,
    marginLeftPt: 72,
    marginLeftCm: 2.54,
    marginRightCm: 2.54,
    paperLabel: "A4",
    orientation: "portrait",
    hasHeader: false,
    hasFooter: false,
  };

  try {
    const zip = new PizZip(arrayBuffer);
    const docXml = zip.file("word/document.xml")?.asText() || "";
    if (!docXml) return fallback;

    // Ambil <w:sectPr> terakhir (pengaturan halaman dokumen utama)
    const sectSpans = findBalancedTagSpans(docXml, "w:sectPr");
    const sectXml = sectSpans[sectSpans.length - 1]?.xml || docXml;

    const pgSzTag = sectXml.match(/<w:pgSz\b[^>]*\/?>/i)?.[0] || "";
    const pgMarTag = sectXml.match(/<w:pgMar\b[^>]*\/?>/i)?.[0] || "";

    const twipsToPt = (val: string | null, defPt: number) => {
      if (!val) return defPt;
      const n = parseInt(val, 10);
      return Number.isFinite(n) && n > 0 ? n / 20 : defPt;
    };
    const ptToCm = (pt: number) => Math.round(((pt * 2.54) / 72) * 100) / 100;

    const widthPt = twipsToPt(getXmlAttr(pgSzTag, "w:w"), fallback.widthPt);
    const heightPt = twipsToPt(getXmlAttr(pgSzTag, "w:h"), fallback.heightPt);
    const marginTopPt = twipsToPt(getXmlAttr(pgMarTag, "w:top"), 72);
    const marginRightPt = twipsToPt(getXmlAttr(pgMarTag, "w:right"), 72);
    const marginBottomPt = twipsToPt(getXmlAttr(pgMarTag, "w:bottom"), 72);
    const marginLeftPt = twipsToPt(getXmlAttr(pgMarTag, "w:left"), 72);

    const widthCm = ptToCm(widthPt);
    const heightCm = ptToCm(heightPt);
    const shortCm = Math.min(widthCm, heightCm);
    const longCm = Math.max(widthCm, heightCm);

    let paperLabel = "Kustom";
    if (Math.abs(shortCm - 21.0) <= 0.4 && Math.abs(longCm - 29.7) <= 0.4) {
      paperLabel = "A4";
    } else if (Math.abs(shortCm - 21.6) <= 0.4 && Math.abs(longCm - 27.9) <= 0.4) {
      paperLabel = "Letter";
    } else if (Math.abs(shortCm - 21.5) <= 0.5 && Math.abs(longCm - 33.0) <= 0.6) {
      paperLabel = "F4 / Folio";
    } else if (Math.abs(shortCm - 21.6) <= 0.4 && Math.abs(longCm - 35.6) <= 0.5) {
      paperLabel = "Legal / F4";
    }

    const hasHeader = Object.keys(zip.files).some((k) => /^word\/header[^/]*\.xml$/i.test(k));
    const hasFooter = Object.keys(zip.files).some((k) => /^word\/footer[^/]*\.xml$/i.test(k));

    return {
      widthPt,
      heightPt,
      widthCm,
      heightCm,
      marginTopPt,
      marginRightPt,
      marginBottomPt,
      marginLeftPt,
      marginLeftCm: ptToCm(marginLeftPt),
      marginRightCm: ptToCm(marginRightPt),
      paperLabel,
      orientation: widthPt > heightPt ? "landscape" : "portrait",
      hasHeader,
      hasFooter,
    };
  } catch {
    return fallback;
  }
}

/**
 * Mengupgrade lebar border CSS `double` yang terlalu tipis (< 3px / 2.25pt) menjadi `3pt`
 * agar dua garis paralel kop surat selalu tampak jelas di layar maupun hasil cetak PDF.
 */
export function upgradeThinDoubleBordersCss(cssText: string): string {
  if (!cssText || !/\bdouble\b/i.test(cssText)) {
    return cssText;
  }
  return cssText.replace(
    /(border(?:-(?:top|bottom|left|right))?\s*:\s*)(\d+(?:\.\d+)?)(pt|px)(\s+double\b)/gi,
    (match, prefix: string, numStr: string, unit: string, rest: string) => {
      const val = parseFloat(numStr);
      if (Number.isNaN(val)) return match;
      const ptVal = unit.toLowerCase() === "px" ? val * 0.75 : val;
      if (ptVal < 2.5) {
        return `${prefix}3pt${rest}`;
      }
      return match;
    }
  );
}

/**
 * Memindai blok tag XML secara seimbang (mendukung tag bersarang & self-closing)
 * tanpa bergantung pada DOMParser eksternal sehingga bekerja identik di Browser & Node.
 */
function findBalancedTagSpans(xml: string, tagName: string): TagSpan[] {
  const spans: TagSpan[] = [];
  const openToken = `<${tagName}`;
  const closeToken = `</${tagName}>`;
  let cursor = 0;

  while (cursor < xml.length) {
    const start = xml.indexOf(openToken, cursor);
    if (start === -1) break;

    const charAfterName = xml[start + openToken.length];
    if (
      charAfterName !== ">" &&
      charAfterName !== "/" &&
      charAfterName !== " " &&
      charAfterName !== "\t" &&
      charAfterName !== "\n" &&
      charAfterName !== "\r"
    ) {
      cursor = start + openToken.length;
      continue;
    }

    const openEnd = xml.indexOf(">", start + openToken.length);
    if (openEnd === -1) break;

    if (xml[openEnd - 1] === "/") {
      spans.push({ start, end: openEnd + 1, xml: xml.slice(start, openEnd + 1) });
      cursor = openEnd + 1;
      continue;
    }

    let depth = 1;
    let scan = openEnd + 1;

    while (depth > 0 && scan < xml.length) {
      const nextOpen = xml.indexOf(openToken, scan);
      const nextClose = xml.indexOf(closeToken, scan);

      if (nextClose === -1) {
        // XML tidak seimbang — hentikan pemindaian tag ini dengan aman
        depth = -1;
        break;
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        const nextChar = xml[nextOpen + openToken.length];
        if (
          nextChar === ">" ||
          nextChar === "/" ||
          nextChar === " " ||
          nextChar === "\t" ||
          nextChar === "\n" ||
          nextChar === "\r"
        ) {
          const innerOpenEnd = xml.indexOf(">", nextOpen + openToken.length);
          if (innerOpenEnd === -1) {
            depth = -1;
            break;
          }
          if (xml[innerOpenEnd - 1] !== "/") {
            depth += 1;
          }
          scan = innerOpenEnd + 1;
        } else {
          scan = nextOpen + openToken.length;
        }
      } else {
        depth -= 1;
        scan = nextClose + closeToken.length;
      }
    }

    if (depth === 0) {
      spans.push({ start, end: scan, xml: xml.slice(start, scan) });
      cursor = scan;
    } else {
      cursor = openEnd + 1;
    }
  }

  return spans;
}

function getXmlAttr(tagOrXml: string, attrName: string): string | null {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tagOrXml.match(new RegExp(`(?:^|[\\s<])${escaped}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? match[1] : null;
}

function setOrAddXmlAttr(tag: string, attrName: string, value: string): string {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const attrRegex = new RegExp(`([\\s])${escaped}\\s*=\\s*["'][^"']*["']`, "i");
  if (attrRegex.test(tag)) {
    return tag.replace(attrRegex, `$1${attrName}="${value}"`);
  }
  return tag.replace(/\s*(\/?>)$/, ` ${attrName}="${value}"$1`);
}

function removeXmlAttr(tag: string, attrName: string): string {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return tag.replace(new RegExp(`\\s+${escaped}\\s*=\\s*["'][^"']*["']`, "gi"), "");
}

function normalizeColorHex(raw: string | null | undefined, fallback = "000000"): string {
  if (!raw) return fallback;
  const cleaned = raw.trim().toLowerCase().replace(/\s+\[\d+\]$/, "");
  if (!cleaned || cleaned === "auto" || cleaned === "none" || cleaned === "transparent") {
    return fallback;
  }
  if (NAMED_VML_COLORS[cleaned]) {
    return NAMED_VML_COLORS[cleaned];
  }
  const hexMatch = cleaned.match(/^#?([0-9a-f]{6})$/i);
  if (hexMatch) {
    return hexMatch[1].toUpperCase();
  }
  const shortHex = cleaned.match(/^#?([0-9a-f]{3})$/i);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split("");
    return `${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (SCHEME_COLOR_FALLBACK[cleaned]) {
    return SCHEME_COLOR_FALLBACK[cleaned];
  }
  return fallback;
}

function parseLengthToPt(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const str = raw.trim().toLowerCase();
  const m = str.match(/^(-?(?:\d+\.?\d*|\.\d+))\s*(pt|px|in|cm|mm|emu|f)?$/);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (Number.isNaN(num)) return null;
  const unit = m[2] || "pt";
  switch (unit) {
    case "pt":
      return num;
    case "px":
      return num * 0.75;
    case "in":
      return num * 72;
    case "cm":
      return (num * 72) / 2.54;
    case "mm":
      return (num * 72) / 25.4;
    case "emu":
      return num / EMU_PER_PT;
    case "f":
      return num / 65536;
    default:
      return num;
  }
}

function parseCssStyleMap(styleText: string | null | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!styleText) return map;
  for (const part of styleText.split(";")) {
    const idx = part.indexOf(":");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim();
    if (key) map[key] = val;
  }
  return map;
}

function parseVmlPoint(raw: string | null | undefined): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const x = parseLengthToPt(parts[0]);
  const y = parseLengthToPt(parts[1]);
  if (x === null || y === null) return null;
  return [x, y];
}

/**
 * 1. Normalisasi `<w:rFonts>`:
 * `docx-preview` hanya membaca `w:ascii`, `w:asciiTheme`, dan `w:eastAsia`, dan mengabaikan
 * `w:hAnsi` maupun `w:cs`. Bila footer/style mendefinisikan `Monotype Corsiva` pada `w:hAnsi`
 * atau `w:cs` tanpa `w:ascii`, salin ke `w:ascii` agar tidak hilang saat pratinjau.
 * Selain itu, bila paragraf footer mendefinisikan `<w:rFonts>` pada `<w:pPr><w:rPr>` sementara
 * `<w:r>` di dalamnya tidak memiliki `<w:rFonts>` sendiri, teruskan ke `<w:r>` (karena
 * `docx-preview` mengabaikan `<w:pPr><w:rPr>`).
 */
export function normalizeRFontsXml(xml: string, options: { isFooter?: boolean } = {}): string {
  if (!xml || !xml.includes("<w:rFonts")) return xml;

  let out = xml.replace(/<w:rFonts\b[^>]*\/?>/g, (tag) => {
    const ascii = getXmlAttr(tag, "w:ascii");
    if (ascii && ascii.trim()) {
      return tag;
    }

    const hAnsi = getXmlAttr(tag, "w:hAnsi");
    const cs = getXmlAttr(tag, "w:cs");
    const eastAsia = getXmlAttr(tag, "w:eastAsia");
    const explicitFallback = (hAnsi || cs || eastAsia || "").trim();

    if (!explicitFallback) {
      return tag;
    }

    let updated = setOrAddXmlAttr(tag, "w:ascii", explicitFallback);
    // Hapus w:asciiTheme bila ada font eksplisit di hAnsi/cs agar theme tidak mengacaukan urutan font
    if ((hAnsi || cs) && getXmlAttr(updated, "w:asciiTheme")) {
      updated = removeXmlAttr(updated, "w:asciiTheme");
    }
    return updated;
  });

  // Teruskan <w:pPr><w:rPr><w:rFonts .../> ke <w:r> tanpa <w:rFonts> pada footer atau bila berisi Monotype Corsiva
  if (options.isFooter || /monotype\s+corsiva|mt\s+corsiva/i.test(out)) {
    const pSpans = findBalancedTagSpans(out, "w:p");
    if (pSpans.length > 0) {
      let rebuilt = "";
      let cursor = 0;
      for (const pSpan of pSpans) {
        const pPrSpan = findBalancedTagSpans(pSpan.xml, "w:pPr")[0];
        const pRPrSpan = pPrSpan ? findBalancedTagSpans(pPrSpan.xml, "w:rPr")[0] : undefined;
        const pRFontsMatch = pRPrSpan?.xml.match(/<w:rFonts\b[^>]*\/?>/);
        const pFontTag = pRFontsMatch?.[0];
        const shouldPropagate =
          Boolean(pFontTag) &&
          (options.isFooter || /monotype\s+corsiva|mt\s+corsiva/i.test(pFontTag || ""));

        if (!shouldPropagate || !pFontTag) continue;

        const rSpans = findBalancedTagSpans(pSpan.xml, "w:r").filter(
          (r) => !pPrSpan || r.start >= pPrSpan.end
        );
        if (rSpans.length === 0) continue;

        let newP = "";
        let pCursor = 0;
        let pChanged = false;
        for (const rSpan of rSpans) {
          if (/<w:rFonts\b/.test(rSpan.xml)) continue;
          pChanged = true;
          newP += pSpan.xml.slice(pCursor, rSpan.start);
          if (/<w:rPr\b[^>]*>/.test(rSpan.xml)) {
            newP += rSpan.xml.replace("</w:rPr>", `${pFontTag}</w:rPr>`);
          } else {
            newP += rSpan.xml.replace(/(<w:r\b[^>]*>)/, `$1<w:rPr>${pFontTag}</w:rPr>`);
          }
          pCursor = rSpan.end;
        }
        if (pChanged) {
          newP += pSpan.xml.slice(pCursor);
          rebuilt += out.slice(cursor, pSpan.start) + newP;
          cursor = pSpan.end;
        }
      }
      if (cursor > 0) {
        out = rebuilt + out.slice(cursor);
      }
    }
  }

  return out;
}

/**
 * 2. Normalisasi border OOXML (`<w:pBdr>`, `<w:tcBorders>`, `<w:tblBorders>`):
 * - Mengisi `w:color="000000"` bila kosong / `"auto"` (mencegah CSS invalid `... null` di docx-preview).
 * - Mengisi `w:sz` default bila kosong (mencegah CSS invalid `null solid ...`).
 * - Mengupgrade gaya garis ganda khas kop surat (`thickThinSmallGap`, `thinThickSmallGap`, `triple`, `double`)
 *   menjadi `w:val="double"` dengan `w:sz >= 24` (3pt) agar dua garis paralel terlihat jelas.
 */
export function normalizeBordersXml(xml: string): string {
  if (!xml) return xml;

  const normalizeSingleBorderTag = (tag: string): string => {
    const rawVal = (getXmlAttr(tag, "w:val") || "").trim();
    const valLower = rawVal.toLowerCase();

    if (valLower === "none" || valLower === "nil") {
      return tag;
    }

    let updated = tag;
    let isDouble = false;

    if (COMPOUND_DOUBLE_BORDER_VALS.has(valLower)) {
      updated = setOrAddXmlAttr(updated, "w:val", "double");
      isDouble = true;
    } else if (!valLower || !KNOWN_SINGLE_OR_STYLED_BORDER_VALS.has(valLower)) {
      updated = setOrAddXmlAttr(updated, "w:val", "single");
    }

    const rawSz = getXmlAttr(updated, "w:sz");
    const szNum = rawSz ? parseInt(rawSz, 10) : NaN;
    if (isDouble) {
      if (Number.isNaN(szNum) || szNum < 24) {
        updated = setOrAddXmlAttr(updated, "w:sz", "24");
      }
    } else if (Number.isNaN(szNum) || szNum <= 0) {
      updated = setOrAddXmlAttr(updated, "w:sz", "12");
    }

    const rawColor = getXmlAttr(updated, "w:color");
    const themeColor = getXmlAttr(updated, "w:themeColor");
    if ((!rawColor && !themeColor) || (rawColor && rawColor.toLowerCase() === "auto")) {
      updated = setOrAddXmlAttr(updated, "w:color", "000000");
    }

    return updated;
  };

  let out = xml;

  // Promosikan <w:between> menjadi <w:bottom> di <w:pBdr> bila <w:bottom> tidak ada
  out = out.replace(/<w:pBdr\b[^>]*>[\s\S]*?<\/w:pBdr>/g, (pBdrBlock) => {
    let block = pBdrBlock;
    if (!/<w:bottom\b/.test(block)) {
      const betweenMatch = block.match(/<w:between\b[^>]*\/>/);
      if (betweenMatch) {
        const betweenVal = (getXmlAttr(betweenMatch[0], "w:val") || "").toLowerCase();
        if (betweenVal && betweenVal !== "none" && betweenVal !== "nil") {
          const bottomClone = betweenMatch[0].replace(/^<w:between\b/, "<w:bottom");
          block = block.replace("</w:pBdr>", `${bottomClone}</w:pBdr>`);
        }
      }
    }
    return block.replace(
      /<w:(?:bottom|top|left|right|start|end)\b[^>]*\/?>/g,
      normalizeSingleBorderTag
    );
  });

  // Normalisasi border tabel dan sel tabel
  out = out.replace(/<w:(?:tcBorders|tblBorders)\b[^>]*>[\s\S]*?<\/w:(?:tcBorders|tblBorders)>/g, (tblBlock) =>
    tblBlock.replace(
      /<w:(?:bottom|top|left|right|start|end|insideH)\b[^>]*\/?>/g,
      normalizeSingleBorderTag
    )
  );

  // Promosikan <w:tblBorders><w:insideH> pada tabel kop tanpa border luar menjadi <w:tcBorders><w:bottom>
  // pada baris non-terakhir (karena docx-preview mengabaikan insideH).
  if (out.includes("<w:insideH")) {
    const tblSpans = findBalancedTagSpans(out, "w:tbl");
    let rebuilt = "";
    let cursor = 0;
    for (const tblSpan of tblSpans) {
      const tblPr = findBalancedTagSpans(tblSpan.xml, "w:tblPr")[0]?.xml || "";
      const tblBorders = tblPr.match(/<w:tblBorders\b[^>]*>[\s\S]*?<\/w:tblBorders>/)?.[0] || "";
      const insideHMatch = tblBorders.match(/<w:insideH\b[^>]*\/?>/);
      if (!insideHMatch) continue;
      const insideHVal = (getXmlAttr(insideHMatch[0], "w:val") || "").toLowerCase();
      if (!insideHVal || insideHVal === "none" || insideHVal === "nil") continue;

      const bottomTag = tblBorders.match(/<w:bottom\b[^>]*\/?>/)?.[0] || "";
      const bottomVal = (getXmlAttr(bottomTag, "w:val") || "").toLowerCase();
      const topTag = tblBorders.match(/<w:top\b[^>]*\/?>/)?.[0] || "";
      const topVal = (getXmlAttr(topTag, "w:val") || "").toLowerCase();
      if ((bottomVal && bottomVal !== "none" && bottomVal !== "nil") || (topVal && topVal !== "none" && topVal !== "nil")) {
        continue;
      }

      const rowSpans = findBalancedTagSpans(tblSpan.xml, "w:tr");
      if (rowSpans.length < 2) continue;

      const promotedBottom = insideHMatch[0].replace(/^<w:insideH\b/, "<w:bottom");
      let newTbl = "";
      let tCursor = 0;
      for (let rIdx = 0; rIdx < rowSpans.length - 1; rIdx++) {
        const row = rowSpans[rIdx];
        const cellSpans = findBalancedTagSpans(row.xml, "w:tc");
        let newRow = "";
        let rCursor = 0;
        for (const cell of cellSpans) {
          newRow += row.xml.slice(rCursor, cell.start);
          let updatedCell = cell.xml;
          if (/<w:tcBorders\b[^>]*>[\s\S]*?<\/w:tcBorders>/.test(updatedCell)) {
            if (!/<w:tcBorders\b[^>]*>[\s\S]*?<w:bottom\b/.test(updatedCell)) {
              updatedCell = updatedCell.replace("</w:tcBorders>", `${promotedBottom}</w:tcBorders>`);
            }
          } else if (/<w:tcPr\b[^>]*>/.test(updatedCell)) {
            updatedCell = updatedCell.replace("</w:tcPr>", `<w:tcBorders>${promotedBottom}</w:tcBorders></w:tcPr>`);
          } else {
            updatedCell = updatedCell.replace(/(<w:tc\b[^>]*>)/, `$1<w:tcPr><w:tcBorders>${promotedBottom}</w:tcBorders></w:tcPr>`);
          }
          newRow += updatedCell;
          rCursor = cell.end;
        }
        newRow += row.xml.slice(rCursor);
        newTbl += tblSpan.xml.slice(tCursor, row.start) + newRow;
        tCursor = row.end;
      }
      newTbl += tblSpan.xml.slice(tCursor);
      rebuilt += out.slice(cursor, tblSpan.start) + newTbl;
      cursor = tblSpan.end;
    }
    if (cursor > 0) {
      out = rebuilt + out.slice(cursor);
    }
  }

  // Normalisasi run border <w:bdr .../>
  out = out.replace(/<w:bdr\b[^>]*\/?>/g, normalizeSingleBorderTag);

  return out;
}

function applyLumModToHex(hex: string, lumModPercent?: number | null, lumOffPercent?: number | null): string {
  if (lumModPercent == null && lumOffPercent == null) return hex;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const mod = lumModPercent != null ? lumModPercent / 100000 : 1;
  const off = lumOffPercent != null ? (lumOffPercent / 100000) * 255 : 0;
  const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const nr = clampByte(r * mod + off);
  const ng = clampByte(g * mod + off);
  const nb = clampByte(b * mod + off);
  return [nr, ng, nb].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function parseThemeColorsFromZip(zip: PizZip): Record<string, string> {
  const map: Record<string, string> = { ...SCHEME_COLOR_FALLBACK };
  const themeEntry = zip.file("word/theme/theme1.xml");
  if (!themeEntry) return map;
  const xml = themeEntry.asText();
  if (!xml) return map;

  const clrScheme = xml.match(/<a:clrScheme\b[^>]*>[\s\S]*?<\/a:clrScheme>/i)?.[0];
  if (!clrScheme) return map;

  for (const key of ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"]) {
    const block = clrScheme.match(new RegExp(`<a:${key}\\b[^>]*>[\\s\\S]*?<\\/a:${key}>`, "i"))?.[0];
    if (!block) continue;
    const srgb = block.match(/<a:srgbClr\b[^>]*val=["']([0-9a-fA-F]{6})["']/i)?.[1];
    const lastClr = block.match(/<a:sysClr\b[^>]*lastClr=["']([0-9a-fA-F]{6})["']/i)?.[1];
    const val = (srgb || lastClr || "").toUpperCase();
    if (val) {
      map[key] = val;
    }
  }
  // Alias standar OOXML: tx1=dk1, bg1=lt1, tx2=dk2, bg2=lt2
  if (map.dk1) map.tx1 = map.dk1;
  if (map.lt1) map.bg1 = map.lt1;
  if (map.dk2) map.tx2 = map.dk2;
  if (map.lt2) map.bg2 = map.lt2;
  return map;
}

/**
 * Mengekstrak spesifikasi garis horizontal dari fragmen DrawingML (`<wps:wsp>`, `<wpg:wgp>`, `<w:drawing>`).
 */
function extractDrawingMlHorizontalLine(
  fragment: string,
  themeColors: Record<string, string> = SCHEME_COLOR_FALLBACK
): HorizontalLineSpec | null {
  // Jangan sentuh gambar, textbox, atau shape dengan isi teks
  if (
    /<pic:pic\b|<a:blip\b|<w:txbxContent\b|<wps:txbx\b/.test(fragment)
  ) {
    return null;
  }

  // Ambil offset vertikal & ukuran keseluruhan dari wp:anchor / wp:inline (tidak bergantung urutan atribut)
  let yOffsetPt = 0;
  let relativeFrom: string | undefined;
  const posVSpan = findBalancedTagSpans(fragment, "wp:positionV")[0]?.xml || "";
  if (posVSpan) {
    const posVOpen = posVSpan.match(/<wp:positionV\b[^>]*>/)?.[0] || "";
    relativeFrom = getXmlAttr(posVOpen, "relativeFrom") || undefined;
    const offsetMatch = posVSpan.match(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/i);
    if (offsetMatch) {
      yOffsetPt = parseInt(offsetMatch[1], 10) / EMU_PER_PT;
    }
  }

  const wpExtentTag = fragment.match(/<wp:extent\b[^>]*\/?>/i)?.[0] || "";
  const wpCx = getXmlAttr(wpExtentTag, "cx");
  const wpCy = getXmlAttr(wpExtentTag, "cy");
  const outerWidthPt = wpCx ? parseInt(wpCx, 10) / EMU_PER_PT : 0;
  const outerHeightPt = wpCy ? parseInt(wpCy, 10) / EMU_PER_PT : 0;

  // Temukan semua <wps:wsp> atau <a:cxnSp>
  const shapeBlocks = [
    ...findBalancedTagSpans(fragment, "wps:wsp").map((s) => s.xml),
    ...findBalancedTagSpans(fragment, "a:cxnSp").map((s) => s.xml),
  ];
  if (shapeBlocks.length === 0) return null;

  const matchedLines: Array<{
    colorHex: string;
    hasExplicitColor: boolean;
    weightPt: number;
    borderVal: "single" | "double" | "dashed" | "dotted";
    widthPt: number;
  }> = [];

  for (const shapeXml of shapeBlocks) {
    const prstMatch = shapeXml.match(/<a:prstGeom\b[^>]*prst=["']([^"']+)["']/i);
    const prst = (prstMatch?.[1] || "").toLowerCase();

    const extTag = shapeXml.match(/<a:ext\b[^>]*\/?>/i)?.[0] || "";
    const extCx = getXmlAttr(extTag, "cx");
    const extCy = getXmlAttr(extTag, "cy");
    const wPt = extCx ? parseInt(extCx, 10) / EMU_PER_PT : outerWidthPt;
    const hPt = extCy ? parseInt(extCy, 10) / EMU_PER_PT : outerHeightPt;

    const isLineGeom =
      prst === "line" || prst === "straightconnector1" || prst === "lineinv";
    const isThinRectBar =
      (prst === "rect" || prst === "roundrect") && hPt <= 8 && wPt >= 120;

    if (isLineGeom) {
      if (wPt < 80 || hPt > 12) continue;
    } else if (!isThinRectBar) {
      continue;
    }

    // Ekstrak stroke <a:ln>
    const lnSpan = findBalancedTagSpans(shapeXml, "a:ln")[0]?.xml || "";
    const lnTag = lnSpan.match(/<a:ln\b[^>]*>/)?.[0] || "";
    const lnWEmu = getXmlAttr(lnTag, "w");
    const lnCmpd = (getXmlAttr(lnTag, "cmpd") || "").toLowerCase();

    // Cek warna dari <a:ln> terlebih dahulu, lalu fallback ke <a:lnRef> atau <a:solidFill> shape
    const extractColorFrom = (src: string): { hex: string; explicit: boolean } | null => {
      const srgbBlock = src.match(/<a:srgbClr\b[^>]*val=["']([0-9a-fA-F]{6})["'][^>]*(?:\/>|>[\s\S]*?<\/a:srgbClr>)/i);
      if (srgbBlock) {
        const lumMod = srgbBlock[0].match(/<a:lumMod\b[^>]*val=["'](\d+)["']/i)?.[1];
        const lumOff = srgbBlock[0].match(/<a:lumOff\b[^>]*val=["'](\d+)["']/i)?.[1];
        return {
          hex: applyLumModToHex(
            srgbBlock[1].toUpperCase(),
            lumMod ? parseInt(lumMod, 10) : null,
            lumOff ? parseInt(lumOff, 10) : null
          ),
          explicit: true,
        };
      }
      const prstClr = src.match(/<a:prstClr\b[^>]*val=["']([^"']+)["']/i)?.[1];
      if (prstClr) return { hex: normalizeColorHex(prstClr, "000000"), explicit: true };
      const schemeBlock = src.match(/<a:schemeClr\b[^>]*val=["']([^"']+)["'][^>]*(?:\/>|>[\s\S]*?<\/a:schemeClr>)/i);
      if (schemeBlock) {
        const key = schemeBlock[1].toLowerCase();
        const baseHex = themeColors[key] || normalizeColorHex(key, "000000");
        const lumMod = schemeBlock[0].match(/<a:lumMod\b[^>]*val=["'](\d+)["']/i)?.[1];
        const lumOff = schemeBlock[0].match(/<a:lumOff\b[^>]*val=["'](\d+)["']/i)?.[1];
        return {
          hex: applyLumModToHex(
            baseHex,
            lumMod ? parseInt(lumMod, 10) : null,
            lumOff ? parseInt(lumOff, 10) : null
          ),
          explicit: false,
        };
      }
      return null;
    };
    const lnRefSpan = findBalancedTagSpans(shapeXml, "a:lnRef")[0]?.xml || "";
    const resolvedColor =
      extractColorFrom(lnSpan) ||
      extractColorFrom(lnRefSpan) ||
      extractColorFrom(shapeXml) ||
      { hex: "000000", explicit: false };
    const colorHex = resolvedColor.hex;
    const hasExplicitColor = resolvedColor.explicit;

    let weightPt = lnWEmu ? parseInt(lnWEmu, 10) / EMU_PER_PT : isThinRectBar ? Math.max(hPt, 1) : 1.5;
    if (!Number.isFinite(weightPt) || weightPt <= 0) weightPt = 1.5;

    let borderVal: "single" | "double" | "dashed" | "dotted" = "single";
    if (lnCmpd === "dbl" || lnCmpd === "thickthin" || lnCmpd === "thinthick" || lnCmpd === "tri") {
      borderVal = "double";
    } else {
      const dashMatch = lnSpan.match(/<a:prstDash\b[^>]*val=["']([^"']+)["']/i);
      const dashVal = (dashMatch?.[1] || "").toLowerCase();
      if (dashVal.includes("dash")) {
        borderVal = "dashed";
      } else if (dashVal.includes("dot")) {
        borderVal = "dotted";
      }
    }

    matchedLines.push({ colorHex, hasExplicitColor, weightPt, borderVal, widthPt: Math.max(wPt, outerWidthPt) });
  }

  // Hanya konversi bila SELURUH shape dalam drawing/group adalah garis horizontal
  if (matchedLines.length === 0 || matchedLines.length !== shapeBlocks.length) {
    return null;
  }

  const primary = matchedLines.reduce((best, item) => (item.weightPt > best.weightPt ? item : best), matchedLines[0]);
  const isDouble = matchedLines.length >= 2 || matchedLines.some((l) => l.borderVal === "double");
  const maxWidth = Math.max(...matchedLines.map((l) => l.widthPt), outerWidthPt);

  return {
    colorHex: primary.colorHex,
    hasExplicitColor: primary.hasExplicitColor,
    weightPt: isDouble ? Math.max(primary.weightPt, 3) : Math.max(primary.weightPt, 1),
    borderVal: isDouble ? "double" : primary.borderVal,
    widthPt: maxWidth,
    isFullWidth: maxWidth >= 320,
    yOffsetPt,
    relativeFrom,
  };
}

/**
 * Mengekstrak spesifikasi garis horizontal dari fragmen VML (`<w:pict>`, `<v:line>`, `<v:group>`, `<v:rect o:hr="t">`, `<v:shape>`).
 */
function extractVmlHorizontalLine(fragment: string): HorizontalLineSpec | null {
  // Jangan sentuh gambar atau textbox
  if (/<v:imagedata\b|<v:textbox\b|<w:txbxContent\b/.test(fragment)) {
    return null;
  }

  // Case A: Word Horizontal Rule <v:rect ... o:hr="t" .../>
  const hrMatch = fragment.match(/<v:rect\b[^>]*o:hr=["'](?:t|true)["'][^>]*\/?>/i);
  if (hrMatch) {
    const tag = hrMatch[0];
    const styleMap = parseCssStyleMap(getXmlAttr(tag, "style"));
    const heightPt = parseLengthToPt(styleMap["height"]) ?? 1.5;
    const rawColor = getXmlAttr(tag, "fillcolor") || getXmlAttr(tag, "strokecolor");
    const colorHex = normalizeColorHex(rawColor, "000000");
    return {
      colorHex,
      hasExplicitColor: Boolean(rawColor),
      weightPt: Math.max(heightPt, 1),
      borderVal: "single",
      widthPt: 450,
      isFullWidth: true,
      yOffsetPt: parseLengthToPt(styleMap["margin-top"] || styleMap["top"]) ?? 0,
    };
  }

  // Case B: <v:group> berisi beberapa <v:line> atau <v:rect> tipis (misal 2 garis kop: tebal + tipis)
  const groupSpan = findBalancedTagSpans(fragment, "v:group")[0];
  let groupWidthPt = 0;
  let groupHeightPt = 0;
  let groupYOffsetPt = 0;
  let coordSizeX = 0;
  let coordSizeY = 0;
  if (groupSpan) {
    const groupOpenTag = groupSpan.xml.match(/<v:group\b[^>]*>/)?.[0] || "";
    const gStyle = parseCssStyleMap(getXmlAttr(groupOpenTag, "style"));
    groupWidthPt = parseLengthToPt(gStyle["width"]) ?? 0;
    groupHeightPt = parseLengthToPt(gStyle["height"]) ?? 0;
    groupYOffsetPt = parseLengthToPt(gStyle["margin-top"] || gStyle["top"]) ?? 0;
    const coordSize = getXmlAttr(groupOpenTag, "coordsize");
    if (coordSize) {
      const parts = coordSize.split(",").map((v) => parseFloat(v.trim()));
      if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        coordSizeX = parts[0];
        coordSizeY = parts[1];
      }
    }
  }

  const lineSpans = findBalancedTagSpans(fragment, "v:line");
  const shapeSpans = findBalancedTagSpans(fragment, "v:shape");
  const rectSpans = findBalancedTagSpans(fragment, "v:rect");

  const matchedLines: Array<{
    colorHex: string;
    hasExplicitColor: boolean;
    weightPt: number;
    borderVal: "single" | "double" | "dashed" | "dotted";
    widthPt: number;
    yOffsetPt: number;
  }> = [];

  for (const span of lineSpans) {
    const openTag = span.xml.match(/<v:line\b[^>]*\/?>/)?.[0] || "";
    const styleMap = parseCssStyleMap(getXmlAttr(openTag, "style"));
    const fromPt = parseVmlPoint(getXmlAttr(openTag, "from"));
    const toPt = parseVmlPoint(getXmlAttr(openTag, "to"));

    let dxPt = 0;
    let dyPt = 0;
    let lineYOffset = parseLengthToPt(styleMap["margin-top"] || styleMap["top"]) ?? groupYOffsetPt;

    if (fromPt && toPt) {
      if (groupSpan && coordSizeX > 0 && groupWidthPt > 0) {
        dxPt = (Math.abs(toPt[0] - fromPt[0]) / coordSizeX) * groupWidthPt;
        dyPt =
          coordSizeY > 0 && groupHeightPt > 0
            ? (Math.abs(toPt[1] - fromPt[1]) / coordSizeY) * groupHeightPt
            : Math.abs(toPt[1] - fromPt[1]);
      } else {
        dxPt = Math.abs(toPt[0] - fromPt[0]);
        dyPt = Math.abs(toPt[1] - fromPt[1]);
        if (lineYOffset === 0) {
          lineYOffset = Math.min(fromPt[1], toPt[1]);
        }
      }
    } else {
      dxPt = parseLengthToPt(styleMap["width"]) ?? groupWidthPt;
      dyPt = parseLengthToPt(styleMap["height"]) ?? 0;
    }

    if (dxPt < 80 || dyPt > 12) continue;

    const strokeTag = span.xml.match(/<v:stroke\b[^>]*\/?>/i)?.[0] || "";
    const explicitRawColor =
      getXmlAttr(strokeTag, "color") || getXmlAttr(openTag, "strokecolor");
    const colorHex = normalizeColorHex(explicitRawColor || "000000", "000000");

    const rawWeight =
      getXmlAttr(strokeTag, "weight") ||
      getXmlAttr(openTag, "strokeweight");
    const weightPt = parseLengthToPt(rawWeight) ?? 1.5;

    const lineStyle = (getXmlAttr(strokeTag, "linestyle") || "").toLowerCase();
    const dashStyle = (getXmlAttr(strokeTag, "dashstyle") || "").toLowerCase();

    let borderVal: "single" | "double" | "dashed" | "dotted" = "single";
    if (
      lineStyle === "thickthin" ||
      lineStyle === "thinthick" ||
      lineStyle === "thinthin" ||
      lineStyle === "thickbetweenthin"
    ) {
      borderVal = "double";
    } else if (dashStyle.includes("dash")) {
      borderVal = "dashed";
    } else if (dashStyle.includes("dot") || dashStyle === "1 1") {
      borderVal = "dotted";
    }

    matchedLines.push({
      colorHex,
      hasExplicitColor: Boolean(explicitRawColor),
      weightPt: Math.max(weightPt, 0.75),
      borderVal,
      widthPt: dxPt,
      yOffsetPt: lineYOffset,
    });
  }

  // Tangani <v:shape> garis datar (misal path="m,l21600,e" atau width >= 80pt & height <= 8pt)
  for (const span of shapeSpans) {
    const openTag = span.xml.match(/<v:shape\b[^>]*\/?>/)?.[0] || "";
    const styleMap = parseCssStyleMap(getXmlAttr(openTag, "style"));
    const wPt = parseLengthToPt(styleMap["width"]) ?? 0;
    const hPt = parseLengthToPt(styleMap["height"]) ?? 0;
    const pathAttr = (getXmlAttr(openTag, "path") || "").toLowerCase();
    const isHorizontalShape = wPt >= 80 && hPt <= 8 && (!pathAttr || /^m[\d,\s-]*l[\d,\s-]+e?$/i.test(pathAttr));
    if (!isHorizontalShape) continue;

    const strokeTag = span.xml.match(/<v:stroke\b[^>]*\/?>/i)?.[0] || "";
    const explicitRawColor =
      getXmlAttr(strokeTag, "color") ||
      getXmlAttr(openTag, "strokecolor") ||
      getXmlAttr(openTag, "fillcolor");
    const colorHex = normalizeColorHex(explicitRawColor, "000000");
    const weightPt =
      parseLengthToPt(getXmlAttr(strokeTag, "weight") || getXmlAttr(openTag, "strokeweight")) ??
      Math.max(hPt, 1.5);
    const lineStyle = (getXmlAttr(strokeTag, "linestyle") || "").toLowerCase();
    const borderVal: "single" | "double" | "dashed" | "dotted" =
      lineStyle === "thickthin" || lineStyle === "thinthick" || lineStyle === "thinthin"
        ? "double"
        : "single";

    matchedLines.push({
      colorHex,
      hasExplicitColor: Boolean(explicitRawColor),
      weightPt: Math.max(weightPt, 0.75),
      borderVal,
      widthPt: wPt,
      yOffsetPt: parseLengthToPt(styleMap["margin-top"] || styleMap["top"]) ?? groupYOffsetPt,
    });
  }

  // Tangani <v:rect> tipis tanpa o:hr yang dipakai sebagai garis kop
  for (const span of rectSpans) {
    const openTag = span.xml.match(/<v:rect\b[^>]*\/?>/)?.[0] || "";
    const styleMap = parseCssStyleMap(getXmlAttr(openTag, "style"));
    const wPt = parseLengthToPt(styleMap["width"]) ?? 0;
    const hPt = parseLengthToPt(styleMap["height"]) ?? 0;
    if (wPt < 120 || hPt > 8) continue;

    const explicitRawColor =
      getXmlAttr(openTag, "fillcolor") || getXmlAttr(openTag, "strokecolor");
    const colorHex = normalizeColorHex(explicitRawColor, "000000");
    matchedLines.push({
      colorHex,
      hasExplicitColor: Boolean(explicitRawColor),
      weightPt: Math.max(hPt, 1.5),
      borderVal: "single",
      widthPt: wPt,
      yOffsetPt: parseLengthToPt(styleMap["margin-top"] || styleMap["top"]) ?? groupYOffsetPt,
    });
  }

  const totalPrimitives = lineSpans.length + shapeSpans.length + rectSpans.length;
  if (matchedLines.length === 0 || (totalPrimitives > 0 && matchedLines.length !== totalPrimitives)) {
    return null;
  }

  const primary = matchedLines.reduce((best, item) => (item.weightPt > best.weightPt ? item : best), matchedLines[0]);
  const isDouble = matchedLines.length >= 2 || matchedLines.some((l) => l.borderVal === "double");
  const maxWidth = Math.max(...matchedLines.map((l) => l.widthPt), groupWidthPt);
  const minYOffset = Math.min(...matchedLines.map((l) => l.yOffsetPt));

  return {
    colorHex: primary.colorHex,
    hasExplicitColor: primary.hasExplicitColor,
    weightPt: isDouble ? Math.max(primary.weightPt, 3) : Math.max(primary.weightPt, 0.75),
    borderVal: isDouble ? "double" : primary.borderVal,
    widthPt: maxWidth,
    isFullWidth: maxWidth >= 320,
    yOffsetPt: Number.isFinite(minYOffset) ? minYOffset : 0,
  };
}

/**
 * Mengekstrak spesifikasi garis horizontal dari `<mc:AlternateContent>`, `<w:pict>`, atau `<w:drawing>`.
 */
export function extractHorizontalLineSpec(
  fragment: string,
  themeColors: Record<string, string> = SCHEME_COLOR_FALLBACK
): HorizontalLineSpec | null {
  if (!fragment) return null;

  if (fragment.startsWith("<mc:AlternateContent")) {
    const choiceXml = findBalancedTagSpans(fragment, "mc:Choice")[0]?.xml || "";
    const fallbackXml = findBalancedTagSpans(fragment, "mc:Fallback")[0]?.xml || "";
    const fromDrawing = choiceXml ? extractDrawingMlHorizontalLine(choiceXml, themeColors) : null;
    const fromVml = fallbackXml ? extractVmlHorizontalLine(fallbackXml) : null;

    if (fromDrawing && fromVml) {
      const isDouble = fromDrawing.borderVal === "double" || fromVml.borderVal === "double";
      // Utamakan warna hex eksplisit (misal srgbClr / VML strokecolor="#d0d0d0") dibanding aproksimasi schemeClr
      const chosenColor = fromDrawing.hasExplicitColor
        ? fromDrawing.colorHex
        : fromVml.hasExplicitColor
          ? fromVml.colorHex
          : fromDrawing.colorHex !== "000000"
            ? fromDrawing.colorHex
            : fromVml.colorHex;
      return {
        colorHex: chosenColor,
        hasExplicitColor: fromDrawing.hasExplicitColor || fromVml.hasExplicitColor,
        weightPt: Math.max(fromDrawing.weightPt, fromVml.weightPt, isDouble ? 3 : 0.75),
        borderVal: isDouble
          ? "double"
          : fromDrawing.borderVal !== "single"
            ? fromDrawing.borderVal
            : fromVml.borderVal,
        widthPt: Math.max(fromDrawing.widthPt, fromVml.widthPt),
        isFullWidth: fromDrawing.isFullWidth || fromVml.isFullWidth,
        yOffsetPt: fromDrawing.yOffsetPt || fromVml.yOffsetPt,
        relativeFrom: fromDrawing.relativeFrom,
      };
    }
    return fromDrawing || fromVml;
  }

  if (fragment.startsWith("<w:pict")) {
    return extractVmlHorizontalLine(fragment);
  }

  if (fragment.startsWith("<w:drawing")) {
    return extractDrawingMlHorizontalLine(fragment, themeColors);
  }

  return null;
}

function buildEdgeBorderXml(edge: "top" | "bottom", spec: HorizontalLineSpec): string {
  const isDouble = spec.borderVal === "double";
  // OOXML w:sz memakai satuan 1/8 pt (min 24 = 3pt untuk double agar selalu tampak 2 garis)
  const rawSz = Math.round(spec.weightPt * 8);
  const sz = isDouble ? Math.max(24, Math.min(rawSz, 48)) : Math.max(6, Math.min(rawSz, 48));
  return `<w:${edge} w:val="${spec.borderVal}" w:sz="${sz}" w:space="0" w:color="${spec.colorHex}"/>`;
}

/**
 * Membangun tag isi `<w:pBdr>` dari 1 atau lebih garis horizontal.
 * Bila terdapat 2+ garis bertumpuk (misal garis biru PMII di atas + abu-abu/tipis di bawah),
 * keduanya dirender setia sebagai `<w:top>` (garis atas) + `<w:bottom>` (garis bawah)
 * sehingga warna dan ketebalan masing-masing garis tetap persis seperti di Microsoft Word.
 */
function buildStackedBordersInnerXml(specs: HorizontalLineSpec[]): string {
  if (specs.length === 1) {
    return buildEdgeBorderXml("bottom", specs[0]);
  }
  const sorted = [...specs].sort((a, b) => a.yOffsetPt - b.yOffsetPt);
  const topSpec = sorted[0];
  const bottomSpec = sorted[sorted.length - 1];
  return `${buildEdgeBorderXml("top", topSpec)}${buildEdgeBorderXml("bottom", bottomSpec)}`;
}

function applyLinesToParagraph(
  paragraphXml: string,
  specs: HorizontalLineSpec[],
  hasVisibleContent: boolean
): string {
  // Jika paragraf memiliki teks dan ada 2+ garis bertumpuk, jangan pasang <w:top> di atas teks —
  // cukup sisipkan paragraf garis ganda ringkas tepat di bawah paragraf teks tersebut.
  if (hasVisibleContent && specs.length >= 2) {
    return `${paragraphXml}${buildStandaloneBorderParagraphXml(specs)}`;
  }

  const bordersInner =
    specs.length >= 2
      ? buildStackedBordersInnerXml(specs)
      : buildEdgeBorderXml("bottom", specs[0]);

  if (/<w:pPr\b[^>]*>/.test(paragraphXml)) {
    if (/<w:pBdr\b[^>]*>[\s\S]*?<\/w:pBdr>/.test(paragraphXml)) {
      return paragraphXml.replace(/<w:pBdr\b[^>]*>[\s\S]*?<\/w:pBdr>/, `<w:pBdr>${bordersInner}</w:pBdr>`);
    }
    return paragraphXml.replace("</w:pPr>", `<w:pBdr>${bordersInner}</w:pBdr></w:pPr>`);
  }

  return paragraphXml.replace(
    /(<w:p\b[^>]*>)/,
    `$1<w:pPr><w:spacing w:before="60" w:after="120"/><w:pBdr>${bordersInner}</w:pBdr></w:pPr>`
  );
}

function buildStandaloneBorderParagraphXml(specs: HorizontalLineSpec[]): string {
  const bordersInner = buildStackedBordersInnerXml(specs);
  return `<w:p><w:pPr><w:spacing w:before="60" w:after="120"/><w:pBdr>${bordersInner}</w:pBdr></w:pPr></w:p>`;
}

function extractParagraphPlainText(paragraphXml: string): string {
  const matches = paragraphXml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g) || [];
  return matches
    .map((m) => m.replace(/<[^>]+>/g, ""))
    .join("")
    .trim();
}

function paragraphHasVisibleContent(paragraphXml: string): boolean {
  if (extractParagraphPlainText(paragraphXml).length > 0) return true;
  if (/<pic:pic\b|<a:blip\b|<v:imagedata\b/.test(paragraphXml)) return true;
  return false;
}

function isLikelyKopMetadataStart(text: string): boolean {
  return /^(?:nomor|no\.?|lampiran|lamp\.?|perihal|hal\.?|kepada|yth\.?)\b/i.test(text.trim());
}

function processSingleParagraphShapes(
  paragraphXml: string,
  themeColors: Record<string, string> = SCHEME_COLOR_FALLBACK
): {
  cleanedXml: string;
  specs: HorizontalLineSpec[];
} {
  const candidates: TagSpan[] = [];
  const altSpans = findBalancedTagSpans(paragraphXml, "mc:AlternateContent");
  candidates.push(...altSpans);

  const isInsideSpan = (pos: number, spans: TagSpan[]) =>
    spans.some((s) => pos >= s.start && pos < s.end);

  const pictSpans = findBalancedTagSpans(paragraphXml, "w:pict").filter(
    (s) => !isInsideSpan(s.start, altSpans)
  );
  const drawingSpans = findBalancedTagSpans(paragraphXml, "w:drawing").filter(
    (s) => !isInsideSpan(s.start, altSpans)
  );
  candidates.push(...pictSpans, ...drawingSpans);

  if (candidates.length === 0) {
    return { cleanedXml: paragraphXml, specs: [] };
  }

  candidates.sort((a, b) => a.start - b.start);

  const specs: HorizontalLineSpec[] = [];
  const removals: TagSpan[] = [];

  for (const cand of candidates) {
    const spec = extractHorizontalLineSpec(cand.xml, themeColors);
    if (spec) {
      specs.push(spec);
      removals.push(cand);
    }
  }

  if (removals.length === 0) {
    return { cleanedXml: paragraphXml, specs: [] };
  }

  // Hapus hanya blok shape garis horizontal yang telah dikonversi
  let cleaned = "";
  let lastIdx = 0;
  for (const rem of removals) {
    cleaned += paragraphXml.slice(lastIdx, rem.start);
    lastIdx = rem.end;
  }
  cleaned += paragraphXml.slice(lastIdx);

  // Bersihkan run kosong bekas shape garis (<w:r><w:rPr>...</w:rPr></w:r> atau <w:r></w:r>)
  cleaned = cleaned.replace(/<w:r\b[^>]*>(?:\s*<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>)?\s*<\/w:r>/g, "");

  return { cleanedXml: cleaned, specs };
}

/**
 * 3. Memulihkan garis horizontal Kop Surat berbasis Shape VML (`<v:line>`, `<v:group>`, `<v:rect o:hr="t">`, `<v:shape>`)
 *    dan DrawingML (`<wps:wsp>`, `<wpg:wgp>`) menjadi border OOXML `<w:pBdr>` yang 100% stabil di
 *    `docx-preview`, DOMPurify (`sanitizeLetterHtml`), dan cetak PDF.
 */
export function recoverShapeHorizontalLinesXml(
  xml: string,
  options: { isHeaderOrFooter?: boolean; themeColors?: Record<string, string> } = {}
): string {
  if (
    !xml ||
    (!xml.includes("<mc:AlternateContent") &&
      !xml.includes("<w:pict") &&
      !xml.includes("<w:drawing"))
  ) {
    return xml;
  }

  const isHeaderOrFooter = Boolean(options.isHeaderOrFooter);
  const themeColors = options.themeColors || SCHEME_COLOR_FALLBACK;

  // Temukan container utama: <w:body>, <w:hdr>, atau <w:ftr>
  const containerMatch = xml.match(/(<w:(?:body|hdr|ftr)\b[^>]*>)([\s\S]*)(<\/w:(?:body|hdr|ftr)>)/);
  if (!containerMatch) return xml;

  const [fullContainer, openTag, innerXml, closeTag] = containerMatch;
  const containerStart = xml.indexOf(fullContainer);

  // Pecah anak tingkat atas dalam container (<w:p> dan <w:tbl>) dengan pemindaian seimbang
  const topBlocks: Array<{
    type: "p" | "tbl" | "other";
    xml: string;
    pendingDeferredSpecs?: HorizontalLineSpec[];
    convertedOnlyLineSpecs?: HorizontalLineSpec[];
  }> = [];

  const pSpans = findBalancedTagSpans(innerXml, "w:p");
  const tblSpans = findBalancedTagSpans(innerXml, "w:tbl");

  // Hanya ambil <w:p> yang TIDAK berada di dalam <w:tbl> (top-level paragraphs)
  const topLevelSpans: Array<{ type: "p" | "tbl"; start: number; end: number; xml: string }> = [
    ...tblSpans.map((s) => ({ type: "tbl" as const, ...s })),
    ...pSpans
      .filter((p) => !tblSpans.some((t) => p.start >= t.start && p.end <= t.end))
      .map((s) => ({ type: "p" as const, ...s })),
  ].sort((a, b) => a.start - b.start);

  let cursor = 0;
  for (const span of topLevelSpans) {
    if (span.start > cursor) {
      topBlocks.push({ type: "other", xml: innerXml.slice(cursor, span.start) });
    }
    topBlocks.push({ type: span.type, xml: span.xml });
    cursor = span.end;
  }
  if (cursor < innerXml.length) {
    topBlocks.push({ type: "other", xml: innerXml.slice(cursor) });
  }

  const deferredHeaderEndSpecs: HorizontalLineSpec[] = [];

  // Proses setiap blok top-level (<w:tbl> dan <w:p>)
  for (let i = 0; i < topBlocks.length; i++) {
    const block = topBlocks[i];

    if (block.type === "tbl") {
      // Periksa apakah ada shape garis horizontal lebar di dalam sel tabel Kop Surat
      const cellParagraphs = findBalancedTagSpans(block.xml, "w:p");
      if (cellParagraphs.length === 0) continue;

      const tableWideLineSpecs: HorizontalLineSpec[] = [];
      let rebuiltTbl = "";
      let lastPos = 0;
      let tblChanged = false;

      for (const cp of cellParagraphs) {
        const { cleanedXml, specs } = processSingleParagraphShapes(cp.xml, themeColors);
        if (specs.length === 0) continue;

        tblChanged = true;
        rebuiltTbl += block.xml.slice(lastPos, cp.start);

        const hasWideLine = specs.some((s) => s.widthPt >= 260 || s.isFullWidth);
        // Garis lebar (>= 260pt / full-width) di dalam tabel kop harus membentang di bawah seluruh tabel,
        // bukan terpotong di dalam satu kolom sel saja.
        if (hasWideLine) {
          tableWideLineSpecs.push(...specs);
          rebuiltTbl += cleanedXml;
        } else {
          rebuiltTbl += applyLinesToParagraph(cleanedXml, specs, paragraphHasVisibleContent(cleanedXml));
        }
        lastPos = cp.end;
      }

      if (tblChanged) {
        rebuiltTbl += block.xml.slice(lastPos);
        block.xml = rebuiltTbl;
        if (tableWideLineSpecs.length > 0) {
          block.pendingDeferredSpecs = tableWideLineSpecs;
        }
      }
      continue;
    }

    if (block.type === "p") {
      const { cleanedXml, specs } = processSingleParagraphShapes(block.xml, themeColors);
      if (specs.length === 0) continue;

      const minYOffset = Math.min(...specs.map((s) => s.yOffsetPt));
      const hasContent = paragraphHasVisibleContent(cleanedXml);

      // Bila garis di-anchor dengan offset vertikal cukup besar (> 28pt) pada paragraf berteks
      // di awal header atau awal kop surat, tempatkan garis di bawah blok kop surat.
      if (hasContent && minYOffset > 28) {
        block.xml = cleanedXml;
        if (isHeaderOrFooter) {
          deferredHeaderEndSpecs.push(...specs);
        } else {
          // Cari akhir blok Kop Surat (maksimal 6 paragraf berikutnya yang masih berupa teks kop singkat)
          let targetIdx = i;
          for (let j = i + 1; j < Math.min(topBlocks.length, i + 8); j++) {
            const next = topBlocks[j];
            if (next.type === "tbl") break;
            if (next.type !== "p") continue;
            const nextText = extractParagraphPlainText(next.xml);
            if (!nextText || isLikelyKopMetadataStart(nextText) || nextText.length > 180) {
              break;
            }
            targetIdx = j;
          }
          const targetBlock = topBlocks[targetIdx];
          targetBlock.pendingDeferredSpecs = [...(targetBlock.pendingDeferredSpecs || []), ...specs];
        }
      } else {
        block.xml = applyLinesToParagraph(cleanedXml, specs, hasContent);
        if (!hasContent) {
          block.convertedOnlyLineSpecs = specs;
        }
      }
    }
  }

  // Gabungkan dua paragraf garis kosong berurutan (misal 2 shape line di 2 paragraf berdekatan)
  // menjadi 1 blok 2-garis (<w:top> + <w:bottom>) yang rapat & mempertahankan warna masing-masing.
  for (let i = 0; i < topBlocks.length - 1; i++) {
    const cur = topBlocks[i];
    if (!cur.convertedOnlyLineSpecs) continue;

    let nextIdx = i + 1;
    while (nextIdx < topBlocks.length && topBlocks[nextIdx].type === "other" && !topBlocks[nextIdx].xml.trim()) {
      nextIdx += 1;
    }
    const next = topBlocks[nextIdx];
    if (next?.convertedOnlyLineSpecs) {
      const combined = [...cur.convertedOnlyLineSpecs, ...next.convertedOnlyLineSpecs];
      cur.xml = buildStandaloneBorderParagraphXml(combined);
      cur.convertedOnlyLineSpecs = combined;
      next.xml = "";
      next.convertedOnlyLineSpecs = undefined;
    }
  }

  // Terapkan deferred specs (garis kop bawah tabel / garis ber-offset di paragraf kop)
  const outputParts: string[] = [];
  for (const block of topBlocks) {
    if (block.type === "tbl") {
      outputParts.push(block.xml);
      if (block.pendingDeferredSpecs && block.pendingDeferredSpecs.length > 0) {
        outputParts.push(buildStandaloneBorderParagraphXml(block.pendingDeferredSpecs));
      }
    } else if (block.type === "p" && block.pendingDeferredSpecs && block.pendingDeferredSpecs.length > 0) {
      outputParts.push(
        applyLinesToParagraph(
          block.xml,
          block.pendingDeferredSpecs,
          paragraphHasVisibleContent(block.xml)
        )
      );
    } else {
      outputParts.push(block.xml);
    }
  }

  if (deferredHeaderEndSpecs.length > 0) {
    outputParts.push(buildStandaloneBorderParagraphXml(deferredHeaderEndSpecs));
  }

  const rebuiltInner = outputParts.join("");
  return (
    xml.slice(0, containerStart) +
    openTag +
    rebuiltInner +
    closeTag +
    xml.slice(containerStart + fullContainer.length)
  );
}

/**
 * Menyiapkan salinan buffer `.docx` khusus untuk pratinjau browser (`docx-preview`)
 * TANPA pernah memodifikasi file `.docx` master yang diunggah/diunduh.
 *
 * Memperbaiki 2 bug utama rendering Word di browser:
 * 1. Font footer `Monotype Corsiva` (dan font lain yang hanya didefinisikan di `w:hAnsi`/`w:cs`).
 * 2. Garis Kop Surat yang hilang akibat VML `<v:line>`/`<v:group>`/`<v:rect o:hr="t">`,
 *    DrawingML `<wps:wsp>`/`<wpg:wgp>`, atau border `thickThin*`/tanpa `w:color`.
 */
export function prepareDocxBufferForPreview(arrayBuffer: ArrayBuffer): ArrayBuffer {
  try {
    const zip = new PizZip(arrayBuffer);
    const themeColors = parseThemeColorsFromZip(zip);
    const targetXmlPaths = Object.keys(zip.files).filter((path) =>
      /^word\/(?:document|styles|header[^/]*|footer[^/]*)\.xml$/i.test(path)
    );

    for (const filePath of targetXmlPaths) {
      const entry = zip.file(filePath);
      if (!entry) continue;
      const originalXml = entry.asText();
      if (!originalXml) continue;

      const isFooter = /^word\/footer/i.test(filePath);
      let transformed = normalizeRFontsXml(originalXml, { isFooter });
      transformed = normalizeBordersXml(transformed);

      if (!/^word\/styles\.xml$/i.test(filePath)) {
        const isHeaderOrFooter = /^word\/(?:header|footer)/i.test(filePath);
        if (isHeaderOrFooter) {
          // Bersihkan run <w:tab/> sisa tepat setelah gambar/logo (<w:drawing>) di akhir paragraf
          // sel header/footer agar tidak turun ke baris baru dan menciptakan celah kosong besar di atas garis kop.
          transformed = transformed.replace(
            /(<\/w:drawing>\s*<\/w:r>)(\s*<w:r\b[^>]*>(?:\s*<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>)?\s*<w:tab\s*\/>\s*<\/w:r>)+(?=\s*<\/w:p>)/g,
            "$1"
          );
        }
        transformed = recoverShapeHorizontalLinesXml(transformed, {
          isHeaderOrFooter,
          themeColors,
        });
      }

      if (transformed !== originalXml) {
        zip.file(filePath, transformed);
      }
    }

    return zip.generate({ type: "arraybuffer" });
  } catch (err) {
    console.warn("Gagal praproses buffer DOCX untuk pratinjau, menggunakan buffer asli:", err);
    return arrayBuffer;
  }
}

/**
 * Menyempurnakan DOM hasil `docx-preview` segera setelah `renderAsync`:
 * - Memperkaya deklarasi `Monotype Corsiva` pada `<style>` dan inline `[style]` dengan fallback webfont kaligrafi.
 * - Merapatkan paragraf kosong khusus garis kop surat (termasuk garis 2-warna `<w:top>` + `<w:bottom>`).
 * - Memastikan garis `double` tidak terlalu tipis.
 * - Melindungi sisa elemen `<svg>` VML agar tidak terpotong menjadi `height="0"`.
 */
export function enhanceRenderedDocxDom(container: HTMLElement): void {
  if (!container) return;

  // 1. Perkaya seluruh <style> yang dihasilkan docx-preview
  container.querySelectorAll("style").forEach((styleEl) => {
    const css = styleEl.textContent || "";
    const enhanced = upgradeThinDoubleBordersCss(rewriteDocxCompatibilityFontsCss(css));
    if (enhanced !== css) {
      styleEl.textContent = enhanced;
    }
  });

  // 2. Perkaya inline style pada seluruh elemen di dalam pratinjau
  container.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const rawStyle = el.getAttribute("style");
    if (!rawStyle) return;
    const enhanced = upgradeThinDoubleBordersCss(rewriteDocxCompatibilityFontsCss(rawStyle));
    if (enhanced !== rawStyle) {
      el.setAttribute("style", enhanced);
    }
  });

  // 2.5. Konversi `<div style="display:inline-block">` pembungkus gambar/logo/QR di dalam `<p>` menjadi `<span>`.
  //      `docx-preview` membuat `<div>` via `document.createElement("div")` di dalam `<p><span>...</span></p>`.
  //      Saat HTML diserialisasi (`innerHTML`) dan di-parse ulang di Print Preview / DOMPurify, parser HTML5
  //      otomatis menutup `<p>` sebelum `<div>` -> memecahnya menjadi `<p><span></span></p><div>...</div><p></p>`
  //      sehingga muncul 2 baris kosong (`min-height: 1em`) di atas & bawah logo kop maupun QR code.
  container.querySelectorAll<HTMLDivElement>("p div").forEach((divEl) => {
    const isInlineDrawing =
      divEl.style.display === "inline-block" ||
      (Boolean(divEl.querySelector("img, svg")) &&
        !divEl.querySelector("p, table, div, section, article"));
    if (!isInlineDrawing) return;

    const doc = container.ownerDocument;
    const spanWrapper = doc.createElement("span");
    for (const attr of Array.from(divEl.attributes)) {
      spanWrapper.setAttribute(attr.name, attr.value);
    }
    spanWrapper.style.display = "inline-block";
    spanWrapper.style.verticalAlign = "top";
    spanWrapper.style.lineHeight = "0";
    spanWrapper.style.fontSize = "0";
    while (divEl.firstChild) {
      spanWrapper.appendChild(divEl.firstChild);
    }

    const parentEl = divEl.parentElement;
    divEl.parentNode?.replaceChild(spanWrapper, divEl);

    if (parentEl && parentEl.tagName === "SPAN" && !parentEl.textContent?.trim()) {
      parentEl.style.lineHeight = "0";
      parentEl.style.fontSize = "0";
    }
  });

  // 3. Samakan font-size & font-family strut elemen <p> dengan isi <span> agar jarak baris
  //    (termasuk paragraf kosong <p></p>) persis Word dan tidak melar oleh 16px/1.5 Tailwind.
  const bodySizeCounts = new Map<string, number>();
  container.querySelectorAll<HTMLElement>("article span[style]").forEach((sp) => {
    const fs = sp.style.fontSize?.trim();
    if (fs && fs !== "0" && fs !== "0px" && fs !== "0pt") {
      bodySizeCounts.set(fs, (bodySizeCounts.get(fs) || 0) + 1);
    }
  });
  let dominantBodyFontSize = "";
  let maxBodySizeCount = 0;
  bodySizeCounts.forEach((count, fs) => {
    if (count > maxBodySizeCount) {
      maxBodySizeCount = count;
      dominantBodyFontSize = fs;
    }
  });

  let lastKnownParagraphFontSize = dominantBodyFontSize;

  // 4. Rapatkan paragraf kosong khusus garis kop surat & seragamkan ukuran paragraf teks/kosong
  container.querySelectorAll<HTMLParagraphElement>("p").forEach((p) => {
    const isEmpty = !p.textContent?.trim() && p.children.length === 0;
    const hasTop = Boolean(p.style.borderTop && p.style.borderTop !== "none");
    const hasBottom = Boolean(p.style.borderBottom && p.style.borderBottom !== "none");

    if (isEmpty && (hasTop || hasBottom)) {
      if (hasTop && hasBottom) {
        p.style.height = "2px";
        p.style.minHeight = "2px";
      } else {
        p.style.height = "0px";
        p.style.minHeight = "0px";
      }
      p.style.lineHeight = "0";
      p.style.fontSize = "0";
      if (!p.style.marginTop) p.style.marginTop = "2pt";
      if (!p.style.marginBottom) p.style.marginBottom = "6pt";
      return;
    }

    // Paragraf yang hanya berisi gambar/drawing (logo kop, QR verifikasi, pas foto):
    // hilangkan celah descender baseline agar menempel rapat pada sel header/footer
    const hasOnlyMedia = !p.textContent?.trim() && Boolean(p.querySelector("img, svg"));
    if (hasOnlyMedia) {
      p.style.lineHeight = "0";
      p.style.fontSize = "0";
      p.style.minHeight = "0";
      return;
    }

    if (isEmpty) {
      if (!p.style.fontSize && lastKnownParagraphFontSize) {
        p.style.fontSize = lastKnownParagraphFontSize;
      }
      return;
    }

    const firstSizedSpan = Array.from(p.querySelectorAll<HTMLElement>("span")).find(
      (s) => Boolean(s.style.fontSize?.trim())
    );
    if (firstSizedSpan) {
      const spanSize = firstSizedSpan.style.fontSize.trim();
      if (!p.style.fontSize) {
        p.style.fontSize = spanSize;
      }
      if (!p.style.fontFamily && firstSizedSpan.style.fontFamily?.trim()) {
        p.style.fontFamily = firstSizedSpan.style.fontFamily.trim();
      }
      lastKnownParagraphFontSize = spanSize;
    } else if (!p.style.fontSize && dominantBodyFontSize) {
      p.style.fontSize = dominantBodyFontSize;
    }
  });

  // 5. Jaga sisa <svg> VML (bila ada garis miring/non-standar) agar tidak terpotong height=0
  container.querySelectorAll("svg").forEach((svg) => {
    svg.style.overflow = "visible";
    const hAttr = svg.getAttribute("height");
    if (hAttr === "0" || hAttr === "0px") {
      svg.setAttribute("height", "6");
    }
    svg.querySelectorAll("line").forEach((line) => {
      if (!line.getAttribute("stroke") || line.getAttribute("stroke") === "null") {
        line.setAttribute("stroke", "#000000");
      }
      if (!line.getAttribute("stroke-width") || line.getAttribute("stroke-width") === "null") {
        line.setAttribute("stroke-width", "1.5px");
      }
    });
  });
}

/**
 * Helper terpusat untuk merender buffer `.docx` ke elemen DOM target dengan
 * akurasi tinggi (garis kop surat utuh + font `Monotype Corsiva` tampil kaligrafi).
 */
export async function renderDocxToElement(
  arrayBuffer: ArrayBuffer,
  container: HTMLElement
): Promise<void> {
  const previewBuffer = prepareDocxBufferForPreview(arrayBuffer);
  const docx = await import("docx-preview");
  container.innerHTML = "";
  await docx.renderAsync(previewBuffer, container, undefined, {
    className: "docx",
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: false,
    ignoreFonts: false,
    breakPages: true,
    // Jangan aktifkan `experimental: true`: bug `updateTabStop()` di docx-preview menghitung
    // `word-spacing` ribuan pt pada `<w:tab/>` kosong di sel kop surat, mendorong kolom teks kop keluar layar!
    experimental: false,
    useBase64URL: true,
    renderHeaders: true,
    renderFooters: true,
    renderFootnotes: true,
    renderEndnotes: true,
    renderAltChunks: false,
  });
  enhanceRenderedDocxDom(container);
}

/**
 * Mengambil deklarasi variabel CSS font (termasuk `--font-corsiva`, `--font-arial-narrow`, `--font-calibri`),
 * class font root, dan `baseHref` origin aplikasi agar jendela cetak `about:blank` memuat stylesheet & webfont identik.
 */
export function buildPrintFontContext(): {
  htmlClassAttr: string;
  fontVarsCss: string;
  baseHref: string;
} {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return { htmlClassAttr: "", fontVarsCss: "", baseHref: "" };
  }
  const safeClasses = (document.documentElement.className || "")
    .split(/\s+/)
    .filter((c) => c && c !== "dark")
    .join(" ");

  const computed = window.getComputedStyle(document.documentElement);
  const varNames = ["--font-corsiva", "--font-arial-narrow", "--font-calibri", "--font-inter"];
  const varDecls: string[] = [];
  for (const name of varNames) {
    const val = computed.getPropertyValue(name).trim();
    if (val) varDecls.push(`${name}: ${val};`);
  }

  return {
    htmlClassAttr: safeClasses,
    fontVarsCss: varDecls.length > 0 ? `:root { ${varDecls.join(" ")} }` : "",
    baseHref: `${window.location.origin}/`,
  };
}

export interface DocxPrintMetrics {
  isDocxContent: boolean;
  pageWidthCss: string | null;
  pageHeightCss: string | null;
  dominantFontSizeCss: string | null;
}

/**
 * Mengekstrak ukuran halaman (`width`, `min-height`) dan ukuran font dominan dari HTML `.docx`
 * agar `@page` dan tinggi baris pada Print Preview persis 1:1 dengan dokumen Word aslinya.
 */
export function extractDocxPrintMetrics(html: string): DocxPrintMetrics {
  if (!html || !html.includes("docx-wrapper")) {
    return {
      isDocxContent: false,
      pageWidthCss: null,
      pageHeightCss: null,
      dominantFontSizeCss: null,
    };
  }

  let pageWidthCss: string | null = null;
  let pageHeightCss: string | null = null;

  const sectionTag = html.match(/<section\b[^>]*class=["'][^"']*\bdocx\b[^"']*["'][^>]*>/i)?.[0] || "";
  const styleAttr = sectionTag.match(/\bstyle=["']([^"']*)["']/i)?.[1] || "";
  if (styleAttr) {
    const wMatch = styleAttr.match(/(?:^|;)\s*width\s*:\s*([0-9.]+(?:pt|px|mm|cm|in))/i);
    const hMatch = styleAttr.match(/(?:^|;)\s*(?:min-)?height\s*:\s*([0-9.]+(?:pt|px|mm|cm|in))/i);
    if (wMatch?.[1]) pageWidthCss = wMatch[1];
    if (hMatch?.[1]) pageHeightCss = hMatch[1];
  }

  // Deteksi ukuran font dominan di isi surat (<article>) agar strut <p> & paragraf kosong cocok dengan Word
  const articleHtml = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || html;
  const counts = new Map<string, number>();
  for (const m of articleHtml.matchAll(/font-size\s*:\s*([0-9.]+pt)/gi)) {
    const sz = m[1].toLowerCase();
    counts.set(sz, (counts.get(sz) || 0) + 1);
  }
  let dominantFontSizeCss: string | null = null;
  let best = 0;
  counts.forEach((cnt, sz) => {
    if (cnt > best) {
      best = cnt;
      dominantFontSizeCss = sz;
    }
  });

  return {
    isDocxContent: true,
    pageWidthCss,
    pageHeightCss,
    dominantFontSizeCss,
  };
}

/**
 * Membangun blok CSS cetak terpadu untuk seluruh jendela cetak surat (Detail Surat,
 * Pembuat Surat Tunggal, dan Surat Massal) agar jarak baris, ukuran kertas, margin,
 * garis kop, dan footer `Monotype Corsiva` identik 1:1 saat Print Preview / PDF.
 */
export function buildDocxPrintStyleBlock(
  html: string,
  options: { fontVarsCss?: string; isBulk?: boolean; nonDocxContainerPadding?: string } = {}
): string {
  const { fontVarsCss = "", isBulk = false, nonDocxContainerPadding } = options;
  const metrics = extractDocxPrintMetrics(html);

  const pageSizeRule =
    metrics.pageWidthCss && metrics.pageHeightCss
      ? `${metrics.pageWidthCss} ${metrics.pageHeightCss}`
      : "auto";
  const printMinHeightRule = metrics.pageHeightCss
    ? `min-height: calc(${metrics.pageHeightCss} - 2pt) !important;`
    : "";
  const dominantFontRule = metrics.dominantFontSizeCss
    ? `font-size: ${metrics.dominantFontSizeCss};`
    : "";

  const nonDocxBodyFont = metrics.isDocxContent
    ? ""
    : "font-family: 'Times New Roman', 'Arial', sans-serif !important;";
  const containerPaddingRule = nonDocxContainerPadding
    ? `.letter-print-container { width: 100%; margin: 0 auto; padding: ${metrics.isDocxContent ? "0" : nonDocxContainerPadding}; }`
    : "";

  const bulkRules = isBulk
    ? `
      .bulk-letter-page {
        page-break-after: always !important;
        break-after: page !important;
        width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        box-shadow: none !important;
        display: block !important;
      }
      .bulk-letter-page:last-of-type {
        page-break-after: auto !important;
        break-after: auto !important;
      }
    `
    : "";

  return `
    ${fontVarsCss}
    @page {
      size: ${pageSizeRule};
      margin: 0mm;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      width: 100% !important;
      min-height: auto !important;
      visibility: visible !important;
      ${nonDocxBodyFont}
    }
    body, body * {
      visibility: visible !important;
    }
    #custom-letter-print-area,
    #custom-letter-print-area * {
      visibility: visible !important;
    }
    .print-label {
      display: none !important;
    }
    ${containerPaddingRule}
    ${bulkRules}
    .docx-wrapper {
      padding: 0 !important;
      margin: 0 auto !important;
      background: transparent !important;
      box-shadow: none !important;
      display: block !important;
      width: 100% !important;
    }
    .docx-wrapper > section.docx {
      position: relative !important;
      margin: 0 auto !important;
      margin-bottom: 0 !important;
      box-shadow: none !important;
      border: none !important;
      box-sizing: border-box !important;
      line-height: 1.08 !important;
      ${dominantFontRule}
      font-family: "Calibri", var(--font-calibri, "Carlito"), Arial, sans-serif;
      hyphens: none !important;
      -webkit-hyphens: none !important;
    }
    .pmii-letter-overlay-item {
      position: absolute !important;
      pointer-events: none !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 0 !important;
    }
    .pmii-letter-overlay-item img {
      display: block !important;
      width: 100% !important;
      height: auto !important;
      max-width: 100% !important;
    }
    .docx-wrapper > section.docx:not(:last-child) {
      page-break-after: always !important;
      break-after: page !important;
    }
    .docx-wrapper .docx {
      hyphens: none !important;
      -webkit-hyphens: none !important;
    }
    .docx-wrapper img {
      display: inline-block;
      max-width: none;
    }
    .docx-wrapper p:empty[style*="border-top"][style*="border-bottom"] {
      min-height: 2px !important;
      height: 2px !important;
      line-height: 0 !important;
      font-size: 0 !important;
    }
    .docx-wrapper p:empty[style*="border-bottom"]:not([style*="border-top"]) {
      min-height: 0px !important;
      height: 0px !important;
      line-height: 0 !important;
      font-size: 0 !important;
    }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .docx-wrapper {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
      }
      .docx-wrapper > section.docx {
        margin: 0 auto !important;
        margin-bottom: 0 !important;
        box-shadow: none !important;
        border: none !important;
        ${printMinHeightRule}
      }
      ${isBulk ? ".bulk-letter-page { page-break-after: always !important; break-after: page !important; } .bulk-letter-page:last-of-type { page-break-after: auto !important; break-after: auto !important; }" : ""}
    }
  `;
}

/**
 * Script penunda `window.print()` hingga seluruh webfont (`Charm`, `Archivo Narrow`, `Carlito`)
 * selesai dimuat sehingga jarak baris dan font pada Print Preview tidak meleset.
 */
export function buildPrintAutoTriggerScript(delayMs = 200): string {
  return `
    <script>
      window.addEventListener('load', function() {
        var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
        ready.catch(function() {}).then(function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, ${delayMs});
        });
      });
      window.addEventListener('afterprint', function() {
        window.close();
      });
    </script>
  `;
}
