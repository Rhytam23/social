import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui'
import { authService } from '../services/authService'
import { useShop } from '../context/ShopContext'

export function PasswordResetPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useShop()

  const tokenParam = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const [step, setStep] = useState<'request' | 'reset' | 'success'>(
    tokenParam ? 'reset' : 'request'
  )
  const [email, setEmail] = useState(emailParam || '')
  const [code, setCode] = useState(tokenParam || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (tokenParam) {
      setCode(tokenParam)
      setStep('reset')
    }
  }, [tokenParam])

  // Step 1: Send Password Reset OTP
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setErrorMsg(null)
    try {
      await authService.sendOtp(email.trim(), 'reset_password')
      setStep('reset')
      showToast('If that email has an account, a reset code has been sent.', 'info')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset code.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    try {
      // The server consumes the reset code and sets the new password in one call.
      await authService.resetPassword(email.trim(), code.trim(), newPassword)
      setStep('success')
      showToast('Password updated. Please sign in.', 'cart')
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid reset code or expired session.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 w-full flex items-center justify-center py-12 md:py-20 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="container-max px-4 max-w-md w-full">
        {step === 'request' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-3">
                <Icon name="lock_reset" size={14} /> SECURITY RECOVERY
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Reset Your Password
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                Enter your registered account email to receive a secure 6-digit recovery code.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500 font-mono">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">
                  Account Email Address
                </label>
                <input
                  type="email"
                  className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? 'SENDING CODE...' : 'SEND RECOVERY CODE'}
                <Icon name="arrow_forward" size={16} />
              </button>
            </form>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-mono text-[var(--accent-blue)] hover:underline font-medium">
                ← Return to Sign In
              </Link>
            </div>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-3">
                <Icon name="key" size={14} /> VERIFY & RESET
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Enter Code & New Password
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                Enter the 6-digit recovery code sent to <strong className="text-[var(--text-primary)]">{email}</strong> and choose your new password.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500 font-mono">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">
                  6-Digit Recovery Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-3.5 text-center font-mono text-lg tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors font-bold"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? 'RESETTING PASSWORD...' : 'UPDATE PASSWORD'}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs font-mono pt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                ← Back
              </button>
              <Link to="/login" className="text-[var(--accent-blue)] hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <Icon name="check_circle" size={32} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Password Reset Complete
            </h1>

            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Your account password has been updated successfully. You can now sign in using your new credentials.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              SIGN IN NOW
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
