import type { Payment, PaymentGroup } from "./types"
import { GROUP_ORDER } from "./types"

/** Every column that can appear in a payment table. The set is identical for
 *  all groups so their tables line up; visibility is chosen per group. */
export type ColumnKey = "no" | "beneficiary" | "billRef" | "amount" | "currency" | "ref" | "description"

export type ColumnDef = {
  key: ColumnKey
  label: string
  /** right-aligned numeric column that also drives the Total row */
  numeric?: boolean
  value: (p: Payment, index: number) => string
}

/** Canonical order columns render in when visible. */
export const COLUMNS: ColumnDef[] = [
  { key: "no", label: "No", value: (_p, i) => String(i + 1) },
  { key: "beneficiary", label: "Beneficiary Name", value: (p) => p.beneficiary },
  { key: "billRef", label: "Bill ref", value: (p) => p.billRef },
  { key: "amount", label: "Payment Amount", numeric: true, value: (p) => moneyValue(p.amount) },
  { key: "currency", label: "Currency", value: (p) => p.currency || "SAR" },
  { key: "ref", label: "Ref Number", value: (p) => p.ref },
  { key: "description", label: "Short description", value: (p) => p.description },
]

export const ALL_COLUMN_KEYS: ColumnKey[] = COLUMNS.map((c) => c.key)

/** Default visible columns — the same for every group so tables are uniform. */
export const DEFAULT_COLUMNS: ColumnKey[] = ["no", "beneficiary", "amount", "ref", "description"]

export type ColumnsByGroup = Record<PaymentGroup, ColumnKey[]>

export function defaultColumnsByGroup(): ColumnsByGroup {
  return GROUP_ORDER.reduce((acc, g) => {
    acc[g] = [...DEFAULT_COLUMNS]
    return acc
  }, {} as ColumnsByGroup)
}

/** Resolve the visible ColumnDefs for a group, always in canonical order. */
export function visibleColumns(keys: ColumnKey[] | undefined): ColumnDef[] {
  const set = new Set(keys && keys.length ? keys : DEFAULT_COLUMNS)
  return COLUMNS.filter((c) => set.has(c.key))
}

const nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function moneyValue(n: number): string {
  return nf.format(n || 0)
}
