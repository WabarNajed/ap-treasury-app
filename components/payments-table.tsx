"use client"

import { Pencil, Trash2 } from "lucide-react"
import { money } from "@/lib/email"
import { GROUP_LABELS, GROUP_ORDER, type Payment, type PaymentGroup } from "@/lib/types"

export function PaymentsTable({
  payments,
  onEdit,
  onDelete,
  onChangeGroup,
}: {
  payments: Payment[]
  onEdit: (p: Payment) => void
  onDelete: (id: string) => void
  onChangeGroup: (id: string, group: PaymentGroup) => void
}) {
  if (!payments.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No payments yet. Upload an Excel file or add one manually.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {GROUP_ORDER.map((g) => {
        const rows = payments.filter((p) => p.group === g)
        if (!rows.length) return null
        const total = rows.reduce((s, p) => s + (p.amount || 0), 0)
        return (
          <div key={g} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between bg-secondary px-4 py-2.5">
              <h3 className="text-sm font-semibold text-secondary-foreground">
                {GROUP_LABELS[g]} <span className="text-muted-foreground">({rows.length})</span>
              </h3>
              <span className="text-sm font-semibold text-secondary-foreground">
                Total: {money(total)}
                {g === "international" ? "" : " SAR"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">{g === "sadad" ? "Bill Name" : "Beneficiary"}</th>
                    <th className="px-4 py-2 font-medium text-right">Amount</th>
                    {g === "international" && <th className="px-4 py-2 font-medium">Ccy</th>}
                    {g === "sadad" && <th className="px-4 py-2 font-medium">Bill ref</th>}
                    <th className="px-4 py-2 font-medium">Ref Number</th>
                    {g !== "sadad" && <th className="px-4 py-2 font-medium">Description</th>}
                    <th className="px-4 py-2 font-medium">Group</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="max-w-56 truncate px-4 py-2.5 text-foreground">{p.beneficiary || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                        {money(p.amount)}
                      </td>
                      {g === "international" && <td className="px-4 py-2.5 text-foreground">{p.currency || "USD"}</td>}
                      {g === "sadad" && <td className="px-4 py-2.5 text-muted-foreground">{p.billRef || "—"}</td>}
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{p.ref || "—"}</td>
                      {g !== "sadad" && (
                        <td className="max-w-64 truncate px-4 py-2.5 text-muted-foreground">
                          {p.description || <span className="italic text-destructive/70">missing</span>}
                        </td>
                      )}
                      <td className="px-4 py-2.5">
                        <select
                          value={p.group}
                          onChange={(e) => onChangeGroup(p.id, e.target.value as PaymentGroup)}
                          className="rounded-md border border-input bg-card px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                        >
                          {GROUP_ORDER.map((gg) => (
                            <option key={gg} value={gg}>
                              {GROUP_LABELS[gg].replace(" Payments", "").replace(" Payment", "")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => onEdit(p)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            aria-label="Edit payment"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => onDelete(p.id)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Delete payment"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
