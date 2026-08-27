import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface PaginationState {
  page: number
  totalPages: number
  total: number
  hasNext: boolean
  hasPrev: boolean
  limit: number
}

export interface UsePaginationReturn extends PaginationState {
  setPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
  pages: number[]
}

export function usePagination(initialLimit = 24): UsePaginationReturn {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const [pagination, setPagination] = useState<PaginationState>({
    page,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
    limit: initialLimit,
  })

  const setPage = useCallback((newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (newPage === 1) next.delete('page')
      else next.set('page', String(newPage))
      return next
    }, { replace: false }) // preserve browser history
  }, [setSearchParams])

  const nextPage = useCallback(() => {
    if (pagination.hasNext) setPage(pagination.page + 1)
  }, [pagination, setPage])

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) setPage(pagination.page - 1)
  }, [pagination, setPage])

  // Generate visible page numbers (e.g., 1 ... 4 5 6 ... 20)
  const pages = (() => {
    const { page: p, totalPages: t } = pagination
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
    const result: number[] = [1]
    if (p > 3) result.push(-1) // ellipsis marker
    for (let i = Math.max(2, p - 1); i <= Math.min(t - 1, p + 1); i++) result.push(i)
    if (p < t - 2) result.push(-1)
    result.push(t)
    return result
  })()

  return { ...pagination, setPage, nextPage, prevPage, setPagination, pages }
}

// Separate updater — call this after every API response
export function usePaginationUpdater(
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
) {
  return useCallback((data: {
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
  }) => {
    setPagination(data.pagination)
  }, [setPagination])
}
