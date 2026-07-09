"use client"

import { useCallback, useEffect, useState } from "react"
import type { Payment, PaymentGroup } from "./types"
import { GROUP_ORDER } from "./types"
import { type ColumnKey, type ColumnsByGroup, defaultColumnsByGroup } from "./columns"

const KEY = "najm.payments.v1"
const META_KEY = "najm.meta.v1"
const COLS_KEY = "najm.columns.v1"

export type Meta = {
  recipient: string
  subjectDate: string
  senderName: string
}

export const DEFAULT_META: Meta = {
  recipient: "Ibrahim",
  subjectDate: new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
  senderName: "Treasury Department",
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [meta, setMetaState] = useState<Meta>(DEFAULT_META)
  const [columnsByGroup, setColumnsState] = useState<ColumnsByGroup>(defaultColumnsByGroup())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setPayments(read<Payment[]>(KEY, []))
    setMetaState(read<Meta>(META_KEY, DEFAULT_META))
    setColumnsState({ ...defaultColumnsByGroup(), ...read<Partial<ColumnsByGroup>>(COLS_KEY, {}) })
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    window.localStorage.setItem(KEY, JSON.stringify(payments))
  }, [payments, loaded])

  useEffect(() => {
    if (!loaded) return
    window.localStorage.setItem(META_KEY, JSON.stringify(meta))
  }, [meta, loaded])

  useEffect(() => {
    if (!loaded) return
    window.localStorage.setItem(COLS_KEY, JSON.stringify(columnsByGroup))
  }, [columnsByGroup, loaded])

  const addPayment = useCallback((p: Payment) => {
    setPayments((prev) => [...prev, p])
  }, [])

  const addMany = useCallback((rows: Payment[]) => {
    setPayments((prev) => [...prev, ...rows])
  }, [])

  const updatePayment = useCallback((id: string, patch: Partial<Payment>) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const removePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const clearAll = useCallback(() => setPayments([]), [])

  const setMeta = useCallback((patch: Partial<Meta>) => {
    setMetaState((prev) => ({ ...prev, ...patch }))
  }, [])

  const toggleColumn = useCallback((group: PaymentGroup, key: ColumnKey) => {
    setColumnsState((prev) => {
      const current = prev[group] ?? []
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
      return { ...prev, [group]: next }
    })
  }, [])

  const setGroupColumns = useCallback((group: PaymentGroup, keys: ColumnKey[]) => {
    setColumnsState((prev) => ({ ...prev, [group]: keys }))
  }, [])

  /** Toggle a column for EVERY group at once so all email tables stay identical. */
  const toggleColumnAll = useCallback((key: ColumnKey) => {
    setColumnsState((prev) => {
      // A column is considered "on" if it's enabled for any group.
      const on = GROUP_ORDER.some((g) => (prev[g] ?? []).includes(key))
      const next = {} as ColumnsByGroup
      for (const g of GROUP_ORDER) {
        const cur = prev[g] ?? []
        next[g] = on ? cur.filter((k) => k !== key) : cur.includes(key) ? cur : [...cur, key]
      }
      return next
    })
  }, [])

  const resetColumns = useCallback(() => setColumnsState(defaultColumnsByGroup()), [])

  return {
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
    toggleColumnAll,
    setGroupColumns,
    resetColumns,
  }
}
