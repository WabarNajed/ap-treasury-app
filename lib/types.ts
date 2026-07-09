export type PaymentGroup =
  | "alrajhi"
  | "local"
  | "international"
  | "sadad"
  | "da"
  | "nrn"
  | "bt"
  | "bulk"

export const GROUP_LABELS: Record<PaymentGroup, string> = {
  alrajhi: "Al Rajhi Payments",
  local: "Local Payments",
  international: "International Payment",
  sadad: "SADAD Payments",
  da: "DA Payments",
  nrn: "NRN Payments",
  bt: "BT Payments",
  bulk: "BULK Payments",
}

export const GROUP_ORDER: PaymentGroup[] = [
  "alrajhi",
  "local",
  "international",
  "sadad",
  "da",
  "nrn",
  "bt",
  "bulk",
]

export type Payment = {
  id: string
  group: PaymentGroup
  /** Beneficiary Name — for SADAD this is the Bill Name */
  beneficiary: string
  amount: number
  currency: string
  /** Ref Number (bank payment reference, e.g. 5105637077) */
  ref: string
  /** Short description */
  description: string
  /** SADAD only: Bill ref */
  billRef: string
  // --- extra fields carried from the Excel upload (editable) ---
  enteredOn: string
  supplierCode: string
  companyCode: string
  assignment: string
  jeDate: string
  je: string
  jeType: string
}

export type EmailVariant = "cfo" | "ceo" | "danrn"

export const VARIANT_LABELS: Record<EmailVariant, string> = {
  cfo: "CFO",
  ceo: "CEO",
  danrn: "DA / NRN",
}

export function emptyPayment(group: PaymentGroup = "local"): Payment {
  return {
    id: crypto.randomUUID(),
    group,
    beneficiary: "",
    amount: 0,
    currency: "SAR",
    ref: "",
    description: "",
    billRef: "",
    enteredOn: "",
    supplierCode: "",
    companyCode: "",
    assignment: "",
    jeDate: "",
    je: "",
    jeType: "",
  }
}
