"use client"

import { useMemo, useState } from "react"
import { Copy, Check, FileText } from "lucide-react"
import { buildEmailHtml, buildEmailText } from "@/lib/email"
import { VARIANT_LABELS, type EmailVariant, type Payment } from "@/lib/types"
import type { Meta } from "@/lib/store"

const VARIANTS: EmailVariant[] = ["cfo", "ceo", "danrn"]
const field = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"

export function EmailPanel({
  payments,
  meta,
  onMeta,
}: {
  payments: Payment[]
  meta: Meta
  onMeta: (patch: Partial<Meta>) => void
}) {
  const [variant, setVariant] = useState<EmailVariant>("cfo")
  const [copied, setCopied] = useState<"" | "rich" | "text">("")

  const html = useMemo(() => buildEmailHtml(payments, meta, variant), [payments, meta, variant])
  const text = useMemo(() => buildEmailText(payments, meta, variant), [payments, meta, variant])

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

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
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
