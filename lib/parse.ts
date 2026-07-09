import { read, utils } from "xlsx"
import { emptyPayment, type Payment } from "./types"

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")
}

/** Map a header label to a known field key. */
function classify(header: string): keyof Payment | "amount" | null {
  const h = norm(header)
  if (!h) return null
  if (h.includes("enteredon") || h === "entered" || h.includes("postingdate")) return "enteredOn"
  if (h === "supplier" || h.includes("suppliercode") || h.includes("vendorcode") || h.includes("vendor"))
    return "supplierCode"
  if (h.includes("suppliername") || h.includes("beneficiary") || h.includes("vendorname") || h === "name")
    return "beneficiary"
  if (h.includes("companycode") || h === "company") return "companyCode"
  if (h.includes("assignment")) return "assignment"
  if (h.includes("amount") || h.includes("value")) return "amount"
  if (h.includes("original") || h.includes("reference") || h.includes("refnumber") || h === "ref") return "ref"
  if (h.includes("jedate") || h.includes("journalentrydate")) return "jeDate"
  if (h.includes("jetype") || h.includes("journalentrytype")) return "jeType"
  if (h === "je" || h.includes("journalentry") || h.includes("document")) return "je"
  if (h.includes("payment")) return "amount"
  if (h.includes("type")) return "jeType"
  return null
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return Math.abs(v)
  // Strip currency codes/text, keep digits, separators and signs.
  const cleaned = String(v ?? "").replace(/[^0-9.,-]/g, "")
  const n = Number.parseFloat(cleaned.replace(/,/g, ""))
  // Payments are shown as positive amounts (source rows may be credits shown as negative).
  return Number.isFinite(n) ? Math.abs(n) : 0
}

export type ParseResult = { payments: Payment[]; skipped: number }

export async function parseWorkbook(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer()
  const wb = read(buf, { type: "array", cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return { payments: [], skipped: 0 }

  const matrix = utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" })
  const rows = matrix.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== ""))
  if (!rows.length) return { payments: [], skipped: 0 }

  // Find header row: the first row where at least 3 cells classify.
  let headerIdx = 0
  let best = 0
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const hits = rows[i].filter((c) => classify(String(c)) !== null).length
    if (hits > best) {
      best = hits
      headerIdx = i
    }
  }

  const headerRow = rows[headerIdx] as unknown[]
  const colMap: (keyof Payment | "amount" | null)[] = headerRow.map((c) => classify(String(c)))
  const hasHeader = best >= 3

  // If no usable header, fall back to a fixed positional layout.
  const positional: (keyof Payment | "amount" | null)[] = [
    "enteredOn",
    "supplierCode",
    "beneficiary",
    "companyCode",
    "assignment",
    "jeDate",
    "je",
    "jeType",
    "amount",
    "ref",
  ]

  const map = hasHeader ? colMap : positional
  const startAt = hasHeader ? headerIdx + 1 : 0

  const payments: Payment[] = []
  let skipped = 0

  for (let i = startAt; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!row.some((c) => String(c ?? "").trim() !== "")) continue

    const p = emptyPayment("local")
    map.forEach((field, idx) => {
      if (!field) return
      const val = row[idx]
      if (field === "amount") p.amount = toNumber(val)
      else if (field === "beneficiary") p.beneficiary = String(val ?? "").trim()
      else if (field === "ref") p.ref = String(val ?? "").trim()
      else (p as unknown as Record<string, string>)[field] = String(val ?? "").trim()
    })

    // A row is meaningful if it has a beneficiary or an amount.
    if (!p.beneficiary && !p.amount) {
      skipped++
      continue
    }
    payments.push(p)
  }

  return { payments, skipped }
}
