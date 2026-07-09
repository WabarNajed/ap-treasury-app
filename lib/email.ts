import { GROUP_ORDER, type EmailVariant, type Payment, type PaymentGroup } from "./types"
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

export const DISCLAIMER_EN =
  "Disclaimer: Najm is subject to the supervision and oversight by Insurance Authority. The information in this email and in any files transmitted with it, is intended only for the addressee and may contain confidential and/or privileged material. Access to this email by anyone else is unauthorized. If you receive this in error, please contact the sender immediately and delete the material from any computer. If you are not the intended recipient, any disclosure, copying, distribution or any action taken or omitted to be taken in reliance on it, is strictly prohibited. Statement and opinions expressed in this e-mail are those of the sender, and do not necessarily reflect those of Najm for Insurance Services."

/* ------------------------- HTML EMAIL ------------------------- */

const cellBase = "padding:6px 10px;border:1px solid #cfd8d0;font-size:13px;"
const th = `${cellBase}background:#2b4a34;color:#ffffff;text-align:left;font-weight:600;`
const td = `${cellBase}color:#1f2d24;`
const tdNum = `${td}text-align:right;white-space:nowrap;`
const totalTd = `${cellBase}background:#eef3ee;font-weight:700;color:#1f2d24;`

function tableHtml(group: PaymentGroup, rows: Payment[]): string {
  if (!rows.length) return ""
  const title =
    group === "alrajhi"
      ? "Al Rajhi Payments."
      : group === "local"
        ? "Local Payments."
        : group === "international"
          ? "International Payment."
          : "SADAD Payments."

  let head = ""
  let body = ""
  let cols = 5

  if (group === "international") {
    cols = 6
    head = `<tr>
      <th style="${th}width:36px">No</th>
      <th style="${th}">Beneficiary Name</th>
      <th style="${th}">Payment</th>
      <th style="${th}">Currency</th>
      <th style="${th}">Ref Number</th>
      <th style="${th}">Short description</th></tr>`
    body = rows
      .map(
        (p, i) => `<tr>
        <td style="${td}">${i + 1}</td>
        <td style="${td}">${esc(p.beneficiary)}</td>
        <td style="${tdNum}">${money(p.amount)}</td>
        <td style="${td}">${esc(p.currency || "USD")}</td>
        <td style="${td}">${esc(p.ref)}</td>
        <td style="${td}">${esc(p.description)}</td></tr>`,
      )
      .join("")
  } else if (group === "sadad") {
    head = `<tr>
      <th style="${th}width:36px">No</th>
      <th style="${th}">Bill Name</th>
      <th style="${th}">Bill ref</th>
      <th style="${th}">Payment Amount</th>
      <th style="${th}">Ref Number</th></tr>`
    body = rows
      .map(
        (p, i) => `<tr>
        <td style="${td}">${i + 1}</td>
        <td style="${td}">${esc(p.beneficiary)}</td>
        <td style="${td}">${esc(p.billRef)}</td>
        <td style="${tdNum}">${money(p.amount)}</td>
        <td style="${td}">${esc(p.ref)}</td></tr>`,
      )
      .join("")
    body += `<tr>
      <td style="${totalTd}" colspan="3">Total</td>
      <td style="${totalTd}text-align:right">${money(total(rows))}</td>
      <td style="${totalTd}"></td></tr>`
  } else {
    const amtLabel = group === "alrajhi" ? "Payment in SAR" : "Payment Amount"
    head = `<tr>
      <th style="${th}width:36px">No</th>
      <th style="${th}">Beneficiary Name</th>
      <th style="${th}">${amtLabel}</th>
      <th style="${th}">Ref Number</th>
      <th style="${th}">Short description</th></tr>`
    body = rows
      .map(
        (p, i) => `<tr>
        <td style="${td}">${i + 1}</td>
        <td style="${td}">${esc(p.beneficiary)}</td>
        <td style="${tdNum}">${money(p.amount)}</td>
        <td style="${td}">${esc(p.ref)}</td>
        <td style="${td}">${esc(p.description)}</td></tr>`,
      )
      .join("")
    body += `<tr>
      <td style="${totalTd}" colspan="2">Total</td>
      <td style="${totalTd}text-align:right">${money(total(rows))}</td>
      <td style="${totalTd}"></td><td style="${totalTd}"></td></tr>`
  }

  return `<p style="font-weight:700;color:#2b4a34;margin:22px 0 8px">${title}</p>
    <table style="border-collapse:collapse;width:100%;table-layout:fixed" cellspacing="0" cellpadding="0">
      <colgroup>${Array.from({ length: cols })
        .map(() => "<col>")
        .join("")}</colgroup>
      <thead>${head}</thead><tbody>${body}</tbody></table>`
}

export function buildEmailHtml(payments: Payment[], meta: Meta, variant: EmailVariant): string {
  const tables = GROUP_ORDER.map((g) => tableHtml(g, groupOf(payments, g)))
    .filter(Boolean)
    .join("")

  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#1f2d24;line-height:1.5;max-width:820px">
    <p>Dear ${esc(meta.recipient || "Team")},</p>
    <p>${VARIANT_INTRO[variant]}</p>
    ${tables || '<p style="color:#8a8a8a">No payments added yet.</p>'}
    <p style="margin-top:28px;font-weight:600;color:#2b4a34">TreasuryDep@najm.sa</p>
    <p style="margin:2px 0;color:#4a5a50">P.O Box 85890 | Riyadh 11612</p>
    <p style="margin:2px 0"><a href="http://www.najm.sa/" style="color:#2b4a34">http://www.najm.sa/</a></p>
    <p style="margin-top:16px;font-size:11px;color:#8a948c">${DISCLAIMER_EN}</p>
  </div>`
}

/* ------------------------- PLAIN TEXT ------------------------- */

function tableText(group: PaymentGroup, rows: Payment[]): string {
  if (!rows.length) return ""
  const lines: string[] = []
  if (group === "alrajhi") {
    lines.push("Al Rajhi Payments.")
    lines.push("No | Beneficiary Name | Payment in SAR | Ref Number | Short description")
    rows.forEach((p, i) => lines.push(`${i + 1} | ${p.beneficiary} | ${money(p.amount)} | ${p.ref} | ${p.description}`))
    lines.push(`Total: ${money(total(rows))}`)
  } else if (group === "local") {
    lines.push("Local Payments.")
    lines.push("No | Beneficiary Name | Payment Amount | Ref Number | Short description")
    rows.forEach((p, i) => lines.push(`${i + 1} | ${p.beneficiary} | ${money(p.amount)} | ${p.ref} | ${p.description}`))
    lines.push(`Total: ${money(total(rows))}`)
  } else if (group === "international") {
    lines.push("International Payment.")
    lines.push("No | Beneficiary Name | Payment | Currency | Ref Number | Short description")
    rows.forEach((p, i) =>
      lines.push(`${i + 1} | ${p.beneficiary} | ${money(p.amount)} | ${p.currency || "USD"} | ${p.ref} | ${p.description}`),
    )
  } else {
    lines.push("SADAD Payments.")
    lines.push("No | Bill Name | Bill ref | Payment Amount | Ref Number")
    rows.forEach((p, i) => lines.push(`${i + 1} | ${p.beneficiary} | ${p.billRef} | ${money(p.amount)} | ${p.ref}`))
    lines.push(`Total: ${money(total(rows))}`)
  }
  return lines.join("\n")
}

export function buildEmailText(payments: Payment[], meta: Meta, variant: EmailVariant): string {
  const blocks = GROUP_ORDER.map((g) => tableText(g, groupOf(payments, g))).filter(Boolean)
  return [
    `Dear ${meta.recipient || "Team"},`,
    "",
    VARIANT_INTRO[variant],
    "",
    blocks.join("\n\n"),
    "",
    "TreasuryDep@najm.sa",
    "P.O Box 85890 | Riyadh 11612",
    "http://www.najm.sa/",
    "",
    DISCLAIMER_EN,
  ].join("\n")
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
