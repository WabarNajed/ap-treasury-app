import { GROUP_LABELS, GROUP_ORDER, type EmailVariant, type Payment, type PaymentGroup } from "./types"
import { type ColumnsByGroup, defaultColumnsByGroup, visibleColumns } from "./columns"
import type { Meta } from "./store"

const nf = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function money(n: number): string {
  return nf.format(n || 0)
}

function groupOf(payments: Payment[], g: PaymentGroup) {
  return payments.filter((p) => p.group === g)
}

function total(rows: Payment[]): number {
  return rows.reduce((s, p) => s + (p.amount || 0), 0)
}

const VARIANT_INTRO: Record<EmailVariant, string> = {
  cfo: "For your kind review and approval, the following payments are uploaded in the bank.",
  ceo: "For your kind review and approval, the following payments are uploaded in the bank.",
  danrn: "The following DA / NRN payments are uploaded in the bank for your kind approval.",
}

export const NAJM_LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Picture2-jyEtLzhDE8zC6Xwa9lBKp6DlPg5DWA.png"

export type EmailOptions = {
  columnsByGroup?: ColumnsByGroup
  /** Groups to include, in order. Defaults to all groups. */
  selectedGroups?: PaymentGroup[]
}

function resolveOptions(opts?: EmailOptions) {
  return {
    columnsByGroup: opts?.columnsByGroup ?? defaultColumnsByGroup(),
    selectedGroups: opts?.selectedGroups ?? GROUP_ORDER,
  }
}

/* ------------------------- HTML EMAIL ------------------------- */

const cellBase = "padding:6px 10px;border:1px solid #cfd8d0;font-size:13px;"
const th = `${cellBase}background:#2b4a34;color:#ffffff;text-align:left;font-weight:600;`
const td = `${cellBase}color:#1f2d24;`
const tdNum = `${td}text-align:right;white-space:nowrap;`
const totalTd = `${cellBase}background:#eef3ee;font-weight:700;color:#1f2d24;`

function tableHtml(group: PaymentGroup, rows: Payment[], columnsByGroup: ColumnsByGroup): string {
  if (!rows.length) return ""
  const cols = visibleColumns(columnsByGroup[group])
  if (!cols.length) return ""
  const title = `${GROUP_LABELS[group]}.`

  const head = `<tr>${cols
    .map((c) => `<th style="${th}${c.key === "no" ? "width:36px" : ""}">${esc(c.label)}</th>`)
    .join("")}</tr>`

  const body = rows
    .map(
      (p, i) =>
        `<tr>${cols
          .map((c) => `<td style="${c.numeric ? tdNum : td}">${esc(c.value(p, i))}</td>`)
          .join("")}</tr>`,
    )
    .join("")

  // Total row (only when an amount column is visible)
  let totalRow = ""
  const amountIdx = cols.findIndex((c) => c.key === "amount")
  if (amountIdx !== -1) {
    const cells = cols.map((c, i) => {
      if (i === amountIdx) return `<td style="${totalTd}text-align:right">${money(total(rows))}</td>`
      if (i === 0) return `<td style="${totalTd}">Total</td>`
      return `<td style="${totalTd}"></td>`
    })
    // Merge the leading label cells up to the amount column for a cleaner look
    if (amountIdx > 1) {
      totalRow =
        `<tr><td style="${totalTd}" colspan="${amountIdx}">Total</td>` +
        cols
          .slice(amountIdx)
          .map((c, j) =>
            j === 0
              ? `<td style="${totalTd}text-align:right">${money(total(rows))}</td>`
              : `<td style="${totalTd}"></td>`,
          )
          .join("") +
        `</tr>`
    } else {
      totalRow = `<tr>${cells.join("")}</tr>`
    }
  }

  return `<p style="font-weight:700;color:#2b4a34;margin:22px 0 8px">${title}</p>
    <table style="border-collapse:collapse;width:100%;table-layout:fixed" cellspacing="0" cellpadding="0">
      <colgroup>${cols.map(() => "<col>").join("")}</colgroup>
      <thead>${head}</thead><tbody>${body}${totalRow}</tbody></table>`
}

export function buildEmailHtml(payments: Payment[], meta: Meta, variant: EmailVariant, opts?: EmailOptions): string {
  const { columnsByGroup, selectedGroups } = resolveOptions(opts)
  const order = GROUP_ORDER.filter((g) => selectedGroups.includes(g))
  const tables = order
    .map((g) => tableHtml(g, groupOf(payments, g), columnsByGroup))
    .filter(Boolean)
    .join("")

  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#1f2d24;line-height:1.5;max-width:820px">
    <div style="margin-bottom:18px">
      <img src="${NAJM_LOGO_URL}" alt="Najm" width="120" style="display:block;height:auto;border:0" />
    </div>
    <p>Dear ${esc(meta.recipient || "Team")},</p>
    <p>${VARIANT_INTRO[variant]}</p>
    ${tables || '<p style="color:#8a8a8a">No payments to show for the selected groups.</p>'}
  </div>`
}

/* ------------------------- PLAIN TEXT ------------------------- */

function tableText(group: PaymentGroup, rows: Payment[], columnsByGroup: ColumnsByGroup): string {
  if (!rows.length) return ""
  const cols = visibleColumns(columnsByGroup[group])
  if (!cols.length) return ""
  const lines: string[] = [`${GROUP_LABELS[group]}.`]
  lines.push(cols.map((c) => c.label).join(" | "))
  rows.forEach((p, i) => lines.push(cols.map((c) => c.value(p, i)).join(" | ")))
  if (cols.some((c) => c.key === "amount")) lines.push(`Total: ${money(total(rows))}`)
  return lines.join("\n")
}

export function buildEmailText(payments: Payment[], meta: Meta, variant: EmailVariant, opts?: EmailOptions): string {
  const { columnsByGroup, selectedGroups } = resolveOptions(opts)
  const order = GROUP_ORDER.filter((g) => selectedGroups.includes(g))
  const blocks = order.map((g) => tableText(g, groupOf(payments, g), columnsByGroup)).filter(Boolean)
  return [
    `Dear ${meta.recipient || "Team"},`,
    "",
    VARIANT_INTRO[variant],
    "",
    blocks.join("\n\n"),
  ].join("\n")
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
