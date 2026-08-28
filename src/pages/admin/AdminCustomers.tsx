import { useState, useCallback } from 'react'
import { EmptyState, Button } from '../../components/ui'
import { ErrorState } from '../../components/ui/ErrorState'
import { AdminPageHeader, StatCard, Pill } from './AdminLayout'
import { useApi } from '../../hooks/useApi'
import { adminService } from '../../services/adminService'

const ROLES = ['', 'customer', 'staff', 'manager', 'admin'] as const

export function AdminCustomers() {
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data, loading, error, reload } = useApi(
    useCallback(() => adminService.listUsers(page, 20, roleFilter || undefined), [page, roleFilter]),
    [page, roleFilter]
  )

  const users = data?.users ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 20))
  const activeCount = users.filter((u) => u.status === 'active').length

  const setStatus = async (id: string, status: 'active' | 'suspended') => {
    setBusyId(id)
    setActionError(null)
    try {
      await adminService.updateUserStatus(id, status)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update account status')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        subtitle={loading ? 'Loading accounts…' : `${total} registered account${total === 1 ? '' : 's'}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Accounts" value={loading ? '—' : String(total)} icon="group" />
        <StatCard label="Active (this page)" value={loading ? '—' : String(activeCount)} icon="verified_user" color="#30d158" />
        <StatCard label="Page" value={`${page} / ${totalPages}`} icon="list" color="#ff9500" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label htmlFor="role-filter" className="font-mono text-[10px] text-[var(--text-secondary)] uppercase">
          Role
        </label>
        <select
          id="role-filter"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
          className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--accent-blue)] capitalize"
        >
          {ROLES.map((r) => (
            <option key={r || 'all'} value={r}>
              {r === '' ? 'All roles' : r}
            </option>
          ))}
        </select>
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl animate-pulse" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : users.length === 0 ? (
        <EmptyState icon="group" title="No accounts" message="Customer accounts will appear here after registration." />
      ) : (
        <>
          <div className="bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[720px]">
                <thead>
                  <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                    {['Customer', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 font-mono text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-[var(--text-primary)] text-xs font-semibold">
                          {u.firstName} {u.lastName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-secondary)]">{u.email}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)] capitalize">{u.role}</td>
                      <td className="px-4 py-3">
                        <Pill status={u.status === 'active' ? 'Active' : 'Inactive'} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-secondary)]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {u.status === 'active' ? (
                          <button
                            type="button"
                            disabled={busyId === u.id}
                            onClick={() => void setStatus(u.id, 'suspended')}
                            className="font-mono text-[10px] text-rose-500 hover:underline cursor-pointer disabled:opacity-50"
                          >
                            SUSPEND
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === u.id}
                            onClick={() => void setStatus(u.id, 'active')}
                            className="font-mono text-[10px] text-[var(--accent-blue)] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            REACTIVATE
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                PREVIOUS
              </Button>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                PAGE {page} / {totalPages}
              </span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                NEXT
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
