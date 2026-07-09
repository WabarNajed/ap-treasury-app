"use client"

import { useMemo, useState } from "react"
import { Copy, Check, FileText, RotateCcw } from "lucide-react"
import { buildEmailHtml, buildEmailText } from "@/lib/email"
import { COLUMNS, type ColumnKey, type ColumnsByGroup } from "@/lib/columns"
import {
  GROUP_LABELS,
  GROUP_ORDER,
  VARIANT_LABELS,
  type EmailVariant,
  type Payment,
  type PaymentGroup,
} from "@/lib/types"
import type { Meta } from "@/lib/store"

const VARIANTS: EmailVariant[] = ["cfo", "ceo", "danrn"]
const field = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"

export function EmailPanel({
  payments,
  meta,
  onMeta,
  columnsByGroup,
  onToggleColumnAll,
  onResetColumns,
}: {
  payments: Payment[]
  meta: Meta
  onMeta: (patch: Partial<Meta>) => void
  columnsByGroup: ColumnsByGroup
  onToggleColumnAll: (key: ColumnKey) => void
  onResetColumns: () => void
}) {
  const [variant, setVariant] = useState<EmailVariant>("cfo")
  const [copied, setCopied] = useState<"" | "rich" | "text">("")
  const [selectedGroups, setSelectedGroups] = useState<PaymentGroup[]>(GROUP_ORDER)

  // Groups that actually have payments
  const present = useMemo(() => GROUP_ORDER.filter((g) => payments.some((p) => p.group === g)), [payments])
  const countByGroup = useMemo(() => {
    const m = {} as Record<PaymentGroup, number>
    for (const g of GROUP_ORDER) m[g] = payments.filter((p) => p.group === g).length
    return m
  }, [payments])

  const html = useMemo(
    () => buildEmailHtml(payments, meta, variant, { columnsByGroup, selectedGroups }),
    [payments, meta, variant, columnsByGroup, selectedGroups],
  )
  const text = useMemo(
    () => buildEmailText(payments, meta, variant, { columnsByGroup, selectedGroups }),
    [payments, meta, variant, columnsByGroup, selectedGroups],
  )

  async function copyRich() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ])
      flash("rich")
    } catch {
      await navigator.clipboard.writeText(text)
      flash("text")
    }
  }

  async function copyText() {
    await navigator.clipboard.writeText(text)
    flash("text")
  }

  function flash(which: "rich" | "text") {
    setCopied(which)
    setTimeout(() => setCopied(""), 1600)
  }

  function toggleGroup(g: PaymentGroup) {
    setSelectedGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  // A column counts as visible if it's enabled for any group (tables are unified).
  const activeKeys = useMemo(() => {
    const set = new Set<ColumnKey>()
    for (const g of GROUP_ORDER) for (const k of columnsByGroup[g] ?? []) set.add(k)
    return set
  }, [columnsByGroup])

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Email variant</h3>
          <div className="flex flex-col gap-2">
            {VARIANTS.map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                  variant === v
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card text-foreground hover:bg-muted"
                }`}
              >
                {VARIANT_LABELS[v]} approval email
              </button>
            ))}
          </div>
        </div>

        {/* Groups to include */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Groups in email</h3>
            <div className="flex gap-2 text-xs">
              <button className="text-primary hover:underline" onClick={() => setSelectedGroups(GROUP_ORDER)}>
                All
              </button>
              <button className="text-muted-foreground hover:underline" onClick={() => setSelectedGroups([])}>
                None
              </button>
            </div>
          </div>
          {present.length === 0 ? (
            <p className="text-xs text-muted-foreground">No payments added yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {present.map((g) => (
                <label
                  key={g}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={selectedGroups.includes(g)}
                    onChange={() => toggleGroup(g)}
                  />
                  <span className="flex-1 text-foreground">{GROUP_LABELS[g]}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-secondary-foreground">
                    {countByGroup[g]}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Global column chooser — applies to every table so they stay identical */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Columns</h3>
            <button
              onClick={onResetColumns}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {COLUMNS.map((c) => {
              const checked = activeKeys.has(c.key)
              const isNo = c.key === "no"
              return (
                <label
                  key={c.key}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                    isNo ? "opacity-60" : "cursor-pointer hover:bg-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={isNo || checked}
                    disabled={isNo}
                    onChange={() => onToggleColumnAll(c.key)}
                  />
                  <span className="text-foreground">{c.label}</span>
                </label>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Columns apply to all tables so every group lines up identically.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Recipient name</label>
            <input className={field} value={meta.recipient} onChange={(e) => onMeta({ recipient: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Subject date</label>
            <input
              className={field}
              value={meta.subjectDate}
              onChange={(e) => onMeta({ subjectDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={copyRich}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {copied === "rich" ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied === "rich" ? "Copied for Outlook" : "Copy formatted email"}
          </button>
          <button
            onClick={copyText}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            {copied === "text" ? <Check className="size-4" /> : <FileText className="size-4" />}
            {copied === "text" ? "Copied" : "Copy plain text"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Subject: <span className="font-medium text-foreground">RE: Payments on {meta.subjectDate}</span>
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-2">
        <div className="rounded-lg bg-white p-6 shadow-inner" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
