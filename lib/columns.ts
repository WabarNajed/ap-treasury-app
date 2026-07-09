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
  /** fixed width used in the email colgroup so every table lines up; the
   *  beneficiary column is left flexible (undefined) to absorb slack. */
  width?: string
  value: (p: Payment, index: number) => string
}

/** Canonical order columns render in when visible. */
export const COLUMNS: ColumnDef[] = [
  { key: "no", label: "No", width: "36px", value: (_p, i) => String(i + 1) },
  { key: "beneficiary", label: "Beneficiary Name", value: (p) => p.beneficiary },
  { key: "billRef", label: "Bill ref", width: "115px", value: (p) => p.billRef },
  { key: "amount", label: "Payment Amount", numeric: true, width: "115px", value: (p) => moneyValue(p.amount) },
  { key: "currency", label: "Currency", width: "70px", value: (p) => p.currency || "SAR" },
  { key: "ref", label: "Ref Number", width: "105px", value: (p) => p.ref },
  { key: "description", label: "Short description", width: "150px", value: (p) => p.description },
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

/** One unified column set used by every table so they all line up.
 *  Any column enabled for any of the given groups appears in all tables. */
export function unifiedColumns(columnsByGroup: ColumnsByGroup, groups: PaymentGroup[]): ColumnDef[] {
  const set = new Set<ColumnKey>()
  for (const g of groups) for (const k of columnsByGroup[g] ?? DEFAULT_COLUMNS) set.add(k)
  if (!set.size) for (const k of DEFAULT_COLUMNS) set.add(k)
  set.add("no")
  return COLUMNS.filter((c) => set.has(c.key))
}

const nf = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function moneyValue(n: number): string {
  return nf.format(n || 0)
}
