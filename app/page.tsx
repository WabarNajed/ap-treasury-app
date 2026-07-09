"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Trash2, ListChecks, Mail } from "lucide-react"
import { usePayments } from "@/lib/store"
import { emptyPayment, type Payment, type PaymentGroup } from "@/lib/types"
import { money } from "@/lib/email"
import { UploadCard } from "@/components/upload-card"
import { PaymentsTable } from "@/components/payments-table"
import { PaymentDialog } from "@/components/payment-dialog"
import { EmailPanel } from "@/components/email-panel"

type Tab = "payments" | "email"

export default function Page() {
  const {
    payments,
    meta,
    columnsByGroup,
    loaded,
    addPayment,
    addMany,
    updatePayment,
    removePayment,
    clearAll,
    setMeta,
    toggleColumn,
    resetColumns,
  } = usePayments()
  const [tab, setTab] = useState<Tab>("payments")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)

  const grandTotal = payments.reduce((s, p) => s + (p.amount || 0), 0)

  function openAdd() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(p: Payment) {
    setEditing(p)
    setDialogOpen(true)
  }
  function save(p: Payment) {
    if (editing) updatePayment(p.id, p)
    else addPayment({ ...p, id: p.id || emptyPayment().id })
    setDialogOpen(false)
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/najm-logo.png"
              alt="Najm"
              width={64}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight text-foreground">Treasury Payment Email Builder</p>
              <p className="text-xs text-muted-foreground">Upload payments · build the bank email</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-secondary p-1">
            <TabButton
              active={tab === "payments"}
              onClick={() => setTab("payments")}
              icon={<ListChecks className="size-4" />}
            >
              Payments
            </TabButton>
            <TabButton active={tab === "email"} onClick={() => setTab("email")} icon={<Mail className="size-4" />}>
              Email
            </TabButton>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tab === "payments" ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[1fr_320px]">
              <UploadCard onImport={(rows) => addMany(rows)} />
              <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Payments loaded</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{payments.length}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Grand total <span className="font-semibold text-foreground">{money(grandTotal)} SAR</span>
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={openAdd}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="size-4" /> Add payment
                  </button>
                  {payments.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Remove all payments?")) clearAll()
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Trash2 className="size-4" /> Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <PaymentsTable
              payments={payments}
              onEdit={openEdit}
              onDelete={removePayment}
              onChangeGroup={(id, g: PaymentGroup) => updatePayment(id, { group: g })}
            />
          </div>
        ) : (
          <EmailPanel
            payments={payments}
            meta={meta}
            onMeta={setMeta}
            columnsByGroup={columnsByGroup}
            onToggleColumn={toggleColumn}
            onResetColumns={resetColumns}
          />
        )}
      </div>

      <PaymentDialog open={dialogOpen} initial={editing} onClose={() => setDialogOpen(false)} onSave={save} />
    </main>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
