"use client"

import { useEffect, useState } from "react"
import { Sparkles, Loader2, X } from "lucide-react"
import { GROUP_LABELS, GROUP_ORDER, emptyPayment, type Payment, type PaymentGroup } from "@/lib/types"

const field = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
const labelCls = "text-xs font-medium text-muted-foreground mb-1 block"

export function PaymentDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  initial: Payment | null
  onClose: () => void
  onSave: (p: Payment) => void
}) {
  const [form, setForm] = useState<Payment>(emptyPayment())
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : emptyPayment())
      setShowAdvanced(false)
      setAiError("")
    }
  }, [open, initial])

  if (!open) return null

  const set = (patch: Partial<Payment>) => setForm((f) => ({ ...f, ...patch }))
  const isSadad = form.group === "sadad"
  const isIntl = form.group === "international"

  async function suggest() {
    setAiLoading(true)
    setAiError("")
    try {
      const res = await fetch("/api/suggest-description", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ beneficiary: form.beneficiary, existing: form.description, hint: form.jeType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      set({ description: data.description })
    } catch (e) {
      setAiError((e as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  function submit() {
    if (!form.beneficiary.trim() && !form.amount) {
      setAiError("Add at least a beneficiary or an amount.")
      return
    }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {initial ? "Edit payment" : "Add payment"}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Payment group</label>
            <div className="flex flex-wrap gap-2">
              {GROUP_ORDER.map((g) => (
                <button
                  key={g}
                  onClick={() => set({ group: g as PaymentGroup })}
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${
                    form.group === g
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {GROUP_LABELS[g].replace(" Payments", "").replace(" Payment", "")}
                </button>
              ))}
            </div>
          </div>

          <div className={isSadad ? "sm:col-span-2" : "sm:col-span-2"}>
            <label className={labelCls}>{isSadad ? "Bill Name" : "Beneficiary Name"}</label>
            <input
              className={field}
              value={form.beneficiary}
              onChange={(e) => set({ beneficiary: e.target.value })}
              placeholder={isSadad ? "005-Mobily" : "Company / person name"}
            />
          </div>

          <div>
            <label className={labelCls}>Amount</label>
            <input
              type="number"
              step="0.01"
              className={field}
              value={form.amount || ""}
              onChange={(e) => set({ amount: Number.parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </div>

          {isIntl ? (
            <div>
              <label className={labelCls}>Currency</label>
              <input
                className={field}
                value={form.currency}
                onChange={(e) => set({ currency: e.target.value.toUpperCase() })}
                placeholder="USD"
              />
            </div>
          ) : (
            <div>
              <label className={labelCls}>Ref Number</label>
              <input
                className={field}
                value={form.ref}
                onChange={(e) => set({ ref: e.target.value })}
                placeholder="5105637077"
              />
            </div>
          )}

          {isIntl && (
            <div>
              <label className={labelCls}>Ref Number</label>
              <input
                className={field}
                value={form.ref}
                onChange={(e) => set({ ref: e.target.value })}
                placeholder="5105637070"
              />
            </div>
          )}

          {isSadad && (
            <div className={isIntl ? "" : "sm:col-span-1"}>
              <label className={labelCls}>Bill ref</label>
              <input
                className={field}
                value={form.billRef}
                onChange={(e) => set({ billRef: e.target.value })}
                placeholder="100016554217970"
              />
            </div>
          )}

          {!isSadad && (
            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between">
                <label className={labelCls + " mb-0"}>Short description</label>
                <button
                  onClick={suggest}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  AI Suggest
                </button>
              </div>
              <textarea
                className={field + " min-h-20 resize-y"}
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="e.g. Direct Internet Access"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              onClick={() => setShowAdvanced((s) => !s)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {showAdvanced ? "Hide" : "Show"} extra Excel fields
            </button>
          </div>

          {showAdvanced && (
            <>
              {(
                [
                  ["enteredOn", "Entered On"],
                  ["supplierCode", "Supplier Code"],
                  ["companyCode", "Company Code"],
                  ["assignment", "Assignment"],
                  ["jeDate", "JE Date"],
                  ["je", "JE"],
                  ["jeType", "JE Type"],
                ] as const
              ).map(([key, lbl]) => (
                <div key={key}>
                  <label className={labelCls}>{lbl}</label>
                  <input
                    className={field}
                    value={(form as unknown as Record<string, string>)[key] ?? ""}
                    onChange={(e) => set({ [key]: e.target.value } as Partial<Payment>)}
                  />
                </div>
              ))}
            </>
          )}

          {aiError && <p className="sm:col-span-2 text-sm text-destructive">{aiError}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {initial ? "Save changes" : "Add payment"}
          </button>
        </div>
      </div>
    </div>
  )
}
