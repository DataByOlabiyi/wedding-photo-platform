"use client"

import { useState, useEffect, useCallback } from "react"

const GUEST_NAME_KEY = "bm_wedding_guest_name"

export function useGuestIdentity() {
  const [guestName, setGuestNameState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedName = localStorage.getItem(GUEST_NAME_KEY)
    setGuestNameState(storedName)
    setIsLoading(false)
  }, [])

  const setGuestName = useCallback((name: string) => {
    const trimmedName = name.trim()
    if (trimmedName) {
      localStorage.setItem(GUEST_NAME_KEY, trimmedName)
      setGuestNameState(trimmedName)
    }
  }, [])

  const clearGuestName = useCallback(() => {
    localStorage.removeItem(GUEST_NAME_KEY)
    setGuestNameState(null)
  }, [])

  return {
    guestName,
    setGuestName,
    clearGuestName,
    isLoading,
    hasIdentity: !!guestName,
  }
}
