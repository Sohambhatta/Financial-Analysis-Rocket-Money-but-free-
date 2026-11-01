/**
 * Client-side bank statement parser.
 *
 * Accepts raw CSV/TXT text (from a file upload or a pasted statement) and
 * extracts a normalized list of transactions: { date, description, amount }.
 *
 * It is deliberately flexible about column headers and delimiters, since
 * every bank exports its statements slightly differently. Everything here
 * runs synchronously in memory -- nothing is ever uploaded anywhere.
 */

// Header aliases we recognize for each logical field. Matched case-insensitively
// against a normalized (alphanumeric-only) version of each header cell.
const DATE_HEADERS = ['date', 'transactiondate', 'postingdate', 'postdate', 'trandate'];
const DESC_HEADERS = [
  'description',
  'merchant',
  'name',
  'payee',
  'details',
  'memo',
  'transactiondescription',
  'narrative',
];
const AMOUNT_HEADERS = ['amount', 'amt', 'debit', 'credit', 'value', 'transactionamount'];
const DEBIT_HEADERS = ['debit', 'withdrawal', 'moneyout'];
const CREDIT_HEADERS = ['credit', 'deposit', 'moneyin'];

function normalizeHeader(h) {
  return (h || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectDelimiter(line) {
  const candidates = [',', '\t', ';', '|'];
  let best = ',';
  let bestCount = -1;
  for (const d of candidates) {
    const count = line.split(d).length;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}

// Minimal CSV line splitter that respects double-quoted fields containing the delimiter.
function splitCsvLine(line, delimiter) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

function parseAmount(raw) {
  if (raw == null) return NaN;
  let str = raw.toString().trim();
  if (!str) return NaN;
  let negative = false;
  if (/^\(.*\)$/.test(str)) {
    negative = true;
    str = str.slice(1, -1);
  }
  str = str.replace(/[^0-9.,-]/g, '');
  // Handle thousands separators: keep only the last '.' or ',' as decimal point.
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  if (lastComma > lastDot) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }
  if (str.startsWith('-')) negative = true;
  const num = parseFloat(str);
  if (Number.isNaN(num)) return NaN;
  return negative ? -Math.abs(num) : num;
}

function parseDate(raw) {
  if (!raw) return null;
  const str = raw.toString().trim();
  // MM/DD/YYYY or M/D/YY
  let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, mo, da, yr] = m;
    if (yr.length === 2) yr = `20${yr}`;
    const d = new Date(Number(yr), Number(mo) - 1, Number(da));
    if (!Number.isNaN(d.getTime())) return d;
  }
  // YYYY-MM-DD
  m = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const [, yr, mo, da] = m;
    const d = new Date(Number(yr), Number(mo) - 1, Number(da));
    if (!Number.isNaN(d.getTime())) return d;
  }
  // Fallback to native Date parsing (e.g. "Jan 5, 2024")
  const native = new Date(str);
  if (!Number.isNaN(native.getTime())) return native;
  return null;
}

function scoreHeaderRow(cells) {
  const normalized = cells.map(normalizeHeader);
  let score = 0;
  if (normalized.some((c) => DATE_HEADERS.includes(c))) score++;
  if (normalized.some((c) => DESC_HEADERS.includes(c))) score++;
  if (
    normalized.some((c) => AMOUNT_HEADERS.includes(c)) ||
    normalized.some((c) => DEBIT_HEADERS.includes(c)) ||
    normalized.some((c) => CREDIT_HEADERS.includes(c))
  )
    score++;
  return score;
}

const INCOME_KEYWORDS = [
  'deposit',
  'payroll',
  'salary',
  'paycheck',
  'refund',
  'reversal',
  'interest earned',
  'cashback redemption',
  'credit adjustment',
];

// Matches a line that starts with a date, ends with one or two currency
// amounts (the second, if present, is treated as a running balance and
// ignored), and has a merchant description in between. This is the shape
// PDF text extraction typically produces, since there are no real table
// cells/delimiters once a PDF is flattened to plain text.
const FREEFORM_LINE_RE =
  /^(\d{1,2}[/\-]\d{1,2}(?:[/\-]\d{2,4})?|[A-Za-z]{3,9}\.?\s+\d{1,2},?\s*\d{2,4})\s+(.+?)\s+(\(?-?\s?\$?\s?[\d,]+\.\d{2}\)?)(?:\s+\(?-?\s?\$?\s?[\d,]+\.\d{2}\)?)?$/;

function inferFreeformSign(description, amountRaw) {
  const hasExplicitSign = /^-|^\(.*\)$/.test(amountRaw.trim());
  if (hasExplicitSign) return null; // let parseAmount's own sign stand
  const text = description.toLowerCase();
  return INCOME_KEYWORDS.some((kw) => text.includes(kw)) ? 1 : -1;
}

/**
 * Fallback parser for free-form statement text with no consistent column
 * delimiters -- the common case for text extracted from a PDF bank
 * statement. Scans each line for a leading date and a trailing dollar
 * amount.
 * @param {string} text
 * @returns {{date: Date, description: string, amount: number, raw: string[]}[]}
 */
function parseFreeformLines(text) {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const transactions = [];
  for (const line of lines) {
    const match = line.match(FREEFORM_LINE_RE);
    if (!match) continue;

    const [, dateRaw, descRaw, amountRaw] = match;
    const date = parseDate(dateRaw);
    let amount = parseAmount(amountRaw);
    const description = descRaw.replace(/\s{2,}/g, ' ').trim();

    if (!date || Number.isNaN(amount) || !description) continue;

    const sign = inferFreeformSign(description, amountRaw);
    if (sign !== null) amount = sign * Math.abs(amount);

    transactions.push({ date, description, amount, raw: [dateRaw, description, amountRaw] });
  }
  return transactions;
}

/**
 * Parses raw statement text into normalized transactions.
 * @param {string} text raw file contents or pasted text
 * @returns {{date: Date, description: string, amount: number, raw: string[]}[]}
 */
export function parseStatementText(text) {
  if (!text || !text.trim()) return [];

  const structured = parseStructuredText(text);
  const freeform = parseFreeformLines(text);
  // Whichever strategy extracted more transactions wins -- clean CSV/TSV
  // exports parse well structurally, while PDF-derived text usually only
  // matches the free-form line scanner.
  return freeform.length > structured.length ? freeform : structured;
}

function parseStructuredText(text) {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);
  const rows = lines.map((l) => splitCsvLine(l, delimiter));

  // Find the best header row within the first few lines (some exports have a
  // title/account-summary line before the real header).
  let headerIndex = -1;
  let bestScore = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const score = scoreHeaderRow(rows[i]);
    if (score > bestScore) {
      bestScore = score;
      headerIndex = i;
    }
  }

  let dateIdx = -1;
  let descIdx = -1;
  let amountIdx = -1;
  let debitIdx = -1;
  let creditIdx = -1;
  let dataRows;

  if (headerIndex >= 0 && bestScore >= 2) {
    const header = rows[headerIndex].map(normalizeHeader);
    dateIdx = header.findIndex((c) => DATE_HEADERS.includes(c));
    descIdx = header.findIndex((c) => DESC_HEADERS.includes(c));
    amountIdx = header.findIndex((c) => AMOUNT_HEADERS.includes(c));
    debitIdx = header.findIndex((c) => DEBIT_HEADERS.includes(c));
    creditIdx = header.findIndex((c) => CREDIT_HEADERS.includes(c));
    dataRows = rows.slice(headerIndex + 1);
  } else {
    // No recognizable header: assume a common positional layout
    // (Date, Description, Amount) and treat every line as data.
    dateIdx = 0;
    descIdx = 1;
    amountIdx = 2;
    dataRows = rows;
  }

  const transactions = [];
  for (const row of dataRows) {
    if (row.length < 2) continue;

    const dateRaw = dateIdx >= 0 ? row[dateIdx] : '';
    const date = parseDate(dateRaw);

    const description = descIdx >= 0 ? row[descIdx] : row.slice(1, row.length - 1).join(' ');

    let amount = NaN;
    if (amountIdx >= 0 && row[amountIdx] !== undefined) {
      amount = parseAmount(row[amountIdx]);
    }
    if (Number.isNaN(amount) && (debitIdx >= 0 || creditIdx >= 0)) {
      const debit = debitIdx >= 0 ? parseAmount(row[debitIdx]) : NaN;
      const credit = creditIdx >= 0 ? parseAmount(row[creditIdx]) : NaN;
      if (!Number.isNaN(debit) && debit !== 0) amount = -Math.abs(debit);
      else if (!Number.isNaN(credit) && credit !== 0) amount = Math.abs(credit);
    }
    if (Number.isNaN(amount)) {
      // Last resort: scan the row for anything that looks like a currency amount.
      for (let i = row.length - 1; i >= 0; i--) {
        const candidate = parseAmount(row[i]);
        if (!Number.isNaN(candidate)) {
          amount = candidate;
          break;
        }
      }
    }

    if (!description || Number.isNaN(amount)) continue;

    transactions.push({
      date: date || new Date(),
      description: description.toString().trim(),
      amount,
      raw: row,
    });
  }

  return transactions;
}
