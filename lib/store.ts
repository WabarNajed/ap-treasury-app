"use client"

import { useCallback, useEffect, useState } from "react"
import type { Payment } from "./types"

const KEY = "najm.payments.v1"
const META_KEY = "najm.meta.v1"

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
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setPayments(read<Payment[]>(KEY, []))
    setMetaState(read<Meta>(META_KEY, DEFAULT_META))
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

  return {
    payments,
    meta,
    loaded,
    addPayment,
    addMany,
    updatePayment,
    removePayment,
    clearAll,
    setMeta,
  }
}
