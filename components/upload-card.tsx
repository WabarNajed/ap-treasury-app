"use client"

import { useRef, useState } from "react"
import { Upload, Loader2, FileSpreadsheet } from "lucide-react"
import { parseWorkbook } from "@/lib/parse"
import type { Payment } from "@/lib/types"

export function UploadCard({ onImport }: { onImport: (rows: Payment[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    setBusy(true)
    setError("")
    setMsg("")
    try {
      const name = file.name.toLowerCase()
      if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
        throw new Error("Please choose an .xlsx or .xls file.")
      }
      const { payments, skipped } = await parseWorkbook(file)
      if (!payments.length) throw new Error("No payment rows were found in the file.")
      onImport(payments)
      setMsg(`Imported ${payments.length} payment${payments.length > 1 ? "s" : ""}${skipped ? ` · skipped ${skipped} empty row(s)` : ""}. All default to “Local” — set the correct group per row.`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handleFile(f)
      }}
      className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
        dragging ? "border-primary bg-accent/50" : "border-border bg-card"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ""
        }}
      />
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <FileSpreadsheet className="size-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">Upload the daily payments Excel</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Drag & drop or browse. Columns: Entered On, Supplier, Supplier Name, Amount, Original Reference…
      </p>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {busy ? "Reading…" : "Choose Excel file"}
      </button>
      {msg && <p className="mt-3 text-xs text-primary">{msg}</p>}
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  )
}
