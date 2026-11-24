import { escapeHtml } from "./sanitize";

export interface ExcelSheetDefinition {
  name: string;
  headers?: string[];
  rows?: Record<string, unknown>[];
  aoa?: unknown[][];
  colWidths?: number[];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function cellValueToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.richText)) {
      return (obj.richText as Array<{ text?: string }>).map((r) => r.text || "").join("");
    }
    if (obj.result !== undefined) return cellValueToString(obj.result);
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.hyperlink === "string") return String(obj.text || obj.hyperlink);
  }
  return String(value);
}

/**
 * Simple RFC 4180 CSV parser fallback when users upload `.csv` files.
 */
function parseCsvTo2DArray(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === ";") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\r") {
      if (text[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\n") {
      row.push(field.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field.trim());
    if (row.some((cell) => cell !== "")) rows.push(row);
  }
  return rows;
}

/**
 * Export one or more sheets to an `.xlsx` file using ExcelJS (no SheetJS/xlsx vulnerability).
 */
export async function exportToExcel(filename: string, sheets: ExcelSheetDefinition[]): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PMII Digital Platform";
  workbook.created = new Date();

  for (const sheetDef of sheets) {
    // Sheet names in Excel cannot exceed 31 chars or contain \ / ? * [ ] :
    const safeName = (sheetDef.name || "Sheet1").replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Sheet1";
    const worksheet = workbook.addWorksheet(safeName);

    let matrix: unknown[][] = [];
    if (sheetDef.aoa && sheetDef.aoa.length > 0) {
      matrix = sheetDef.aoa;
    } else if (sheetDef.rows && sheetDef.rows.length > 0) {
      const headers =
        sheetDef.headers && sheetDef.headers.length > 0
          ? sheetDef.headers
          : Object.keys(sheetDef.rows[0]);
      matrix = [
        headers,
        ...sheetDef.rows.map((r) => headers.map((h) => r[h] ?? "")),
      ];
    } else if (sheetDef.headers && sheetDef.headers.length > 0) {
      matrix = [sheetDef.headers];
    }

    for (const row of matrix) {
      worksheet.addRow(row);
    }

    // Style header row subtly
    if (matrix.length > 0) {
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
    }

    // Apply column widths (explicit or auto-fitted)
    const colCount = matrix.reduce((max, r) => Math.max(max, r.length), 0);
    for (let c = 0; c < colCount; c++) {
      const explicitWidth = sheetDef.colWidths?.[c];
      if (explicitWidth) {
        worksheet.getColumn(c + 1).width = explicitWidth;
      } else {
        let maxLen = 10;
        for (const r of matrix) {
          const len = String(r[c] ?? "").length;
          if (len > maxLen) maxLen = len;
        }
        worksheet.getColumn(c + 1).width = Math.min(Math.max(maxLen + 3, 10), 60);
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/**
 * Reads an `.xlsx` or `.csv` ArrayBuffer into a 2D array of strings.
 */
export async function readSpreadsheetTo2DArray(
  buffer: ArrayBuffer,
  options?: { fileName?: string; preferredSheetPicker?: (names: string[]) => string | undefined }
): Promise<{ sheetName: string; sheetNames: string[]; rows: string[][] }> {
  const isCsv = Boolean(options?.fileName && /\.csv$/i.test(options.fileName));
  if (isCsv) {
    const text = new TextDecoder("utf-8").decode(buffer);
    return {
      sheetName: "CSV",
      sheetNames: ["CSV"],
      rows: parseCsvTo2DArray(text),
    };
  }

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheetNames = workbook.worksheets.map((ws) => ws.name);
  if (sheetNames.length === 0) {
    return { sheetName: "", sheetNames: [], rows: [] };
  }

  const chosenName = options?.preferredSheetPicker?.(sheetNames) || sheetNames[0];
  const worksheet = workbook.getWorksheet(chosenName) || workbook.worksheets[0];

  const rows: string[][] = [];
  const colCount = Math.max(worksheet.columnCount, 1);

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const vals: string[] = [];
    for (let i = 1; i <= colCount; i++) {
      vals.push(cellValueToString(row.getCell(i).value));
    }
    rows.push(vals);
  });

  return { sheetName: worksheet.name, sheetNames, rows };
}

/**
 * Reads an `.xlsx` or `.csv` ArrayBuffer into an array of header-keyed objects.
 */
export async function readSpreadsheetToObjects(
  buffer: ArrayBuffer,
  options?: { fileName?: string; skipSheetNames?: string[] }
): Promise<{ sheetName: string; rows: Record<string, string>[] }> {
  const skipSet = new Set((options?.skipSheetNames || []).map((s) => s.toLowerCase()));
  const { sheetName, rows } = await readSpreadsheetTo2DArray(buffer, {
    fileName: options?.fileName,
    preferredSheetPicker: (names) =>
      names.find((n) => !skipSet.has(n.toLowerCase())) || names[0],
  });

  if (rows.length < 2) {
    return { sheetName, rows: [] };
  }

  const headers = rows[0].map((h, idx) => h.trim() || `Column_${idx + 1}`);
  const result: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((v) => v.trim() !== "")) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] ?? "";
    });
    result.push(obj);
  }

  return { sheetName, rows: result };
}

/**
 * Converts an Excel/CSV buffer into a safe HTML table (every cell escaped against XSS).
 */
export async function spreadsheetBufferToSafeHtml(
  buffer: ArrayBuffer,
  fileName?: string
): Promise<{ sheetName: string; sheetCount: number; htmlTable: string }> {
  const { sheetName, sheetNames, rows } = await readSpreadsheetTo2DArray(buffer, { fileName });

  if (rows.length === 0) {
    return {
      sheetName: sheetName || "Sheet1",
      sheetCount: sheetNames.length || 1,
      htmlTable: `<p class="text-xs text-zinc-500 p-4 text-center">Lembar kerja kosong.</p>`,
    };
  }

  const [headerRow, ...bodyRows] = rows;
  const thead = `<thead><tr>${headerRow.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${bodyRows
    .map((r) => `<tr>${r.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;

  return {
    sheetName: sheetName || "Sheet1",
    sheetCount: sheetNames.length || 1,
    htmlTable: `<table id="excel-preview-table">${thead}${tbody}</table>`,
  };
}
