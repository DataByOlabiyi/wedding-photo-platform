'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function EventSearchInput({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(defaultValue)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setValue(q)
    startTransition(() => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      router.replace(`${pathname}${q ? `?${params.toString()}` : ''}`)
    })
  }, [router, pathname])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={handleChange}
        placeholder="Search by event slug or couple name…"
        className="pl-9"
      />
    </div>
  )
}
