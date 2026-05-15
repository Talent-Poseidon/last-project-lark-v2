export interface ParsedKamusRow {
  rowNumber: number;
  code: string;
  name: string;
  type: string;
  description: string;
  behavioralIndicators: string;
}

export interface KamusRowError {
  rowNumber: number;
  field?: string;
  message: string;
}

export interface KamusParseResult {
  rows: ParsedKamusRow[];
  errors: KamusRowError[];
}

const REQUIRED_HEADERS = [
  "code",
  "name",
  "type",
  "description",
  "behavioral_indicators",
] as const;

const ALLOWED_TYPES = new Set(["potensi", "kompetensi"]);

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === ",") {
        out.push(cur);
        cur = "";
      } else if (ch === '"') {
        inQuote = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

export function parseKamusCsv(text: string): KamusParseResult {
  const errors: KamusRowError[] = [];
  const rows: ParsedKamusRow[] = [];
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    errors.push({ rowNumber: 0, message: "File is empty" });
    return { rows, errors };
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  for (const req of REQUIRED_HEADERS) {
    if (!headers.includes(req)) {
      errors.push({
        rowNumber: 1,
        field: req,
        message: `Missing required column: ${req}`,
      });
    }
  }
  if (errors.length > 0) {
    return { rows, errors };
  }

  const idx = {
    code: headers.indexOf("code"),
    name: headers.indexOf("name"),
    type: headers.indexOf("type"),
    description: headers.indexOf("description"),
    behavioral_indicators: headers.indexOf("behavioral_indicators"),
  };

  const seenCodes = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const cells = splitCsvLine(lines[i]);

    const code = (cells[idx.code] || "").trim();
    const name = (cells[idx.name] || "").trim();
    const type = (cells[idx.type] || "").trim().toLowerCase();
    const description = (cells[idx.description] || "").trim();
    const behavioralIndicators = (cells[idx.behavioral_indicators] || "").trim();

    if (!code) {
      errors.push({ rowNumber, field: "code", message: "Code is required" });
    } else if (seenCodes.has(code)) {
      errors.push({
        rowNumber,
        field: "code",
        message: `Duplicate code in file: ${code}`,
      });
    } else {
      seenCodes.add(code);
    }

    if (!name) {
      errors.push({ rowNumber, field: "name", message: "Name is required" });
    }

    if (!type) {
      errors.push({ rowNumber, field: "type", message: "Type is required" });
    } else if (!ALLOWED_TYPES.has(type)) {
      errors.push({
        rowNumber,
        field: "type",
        message: `Type must be 'potensi' or 'kompetensi' (got '${type}')`,
      });
    }

    if (!description) {
      errors.push({
        rowNumber,
        field: "description",
        message: "Description is required",
      });
    }

    if (!behavioralIndicators) {
      errors.push({
        rowNumber,
        field: "behavioral_indicators",
        message: "Behavioral indicators are required",
      });
    }

    rows.push({
      rowNumber,
      code,
      name,
      type,
      description,
      behavioralIndicators,
    });
  }

  return { rows, errors };
}

export const KAMUS_TEMPLATE_CSV =
  "code,name,type,description,behavioral_indicators\n" +
  "POT-001,Sample Potensi,potensi,Description of the potensi,Indicator 1 | Indicator 2\n" +
  "KOM-001,Sample Kompetensi,kompetensi,Description of the kompetensi,Indicator 1 | Indicator 2\n";
