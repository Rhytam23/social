import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui'
import { authService } from '../services/authService'
import { useShop } from '../context/ShopContext'

export function EmailVerificationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useShop()

  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('otp')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!emailParam) {
      setStep('input')
    }
  }, [emailParam])

  const handleSendVerificationOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setErrorMsg(null)
    try {
      await authService.sendOtp(email.trim(), 'login')
      setStep('otp')
      showToast(`Verification code sent to ${email}`, 'info')

      // Cooldown timer
      setResendCooldown(60)
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpDigits.join('')
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    try {
      await authService.verifyOtp(email.trim(), code, 'login')
      setStep('success')
      showToast('Email verified successfully!', 'cart')
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <main className="flex-1 w-full flex items-center justify-center py-12 md:py-20 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="container-max px-4 max-w-md w-full">
        {step === 'input' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-3">
                <Icon name="mark_email_read" size={14} /> EMAIL VERIFICATION
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Verify Your Email
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                Enter your email address to receive your 6-digit account verification code.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500 font-mono">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSendVerificationOtp} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">
                  Email Address
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
                {loading ? 'SENDING CODE...' : 'SEND VERIFICATION CODE'}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-3">
                <Icon name="mark_email_read" size={14} /> VERIFICATION CODE
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Enter 6-Digit Code
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                We sent a 6-digit code to <strong className="text-[var(--text-primary)]">{email || 'your email'}</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500 font-mono">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">
                  Verification Code
                </label>
                <div className="flex gap-2 justify-between mt-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputRefs.current[idx] = el }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-14 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] focus:border-[var(--accent-blue)] text-center font-mono text-xl font-bold text-[var(--text-primary)] rounded-lg focus:outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {loading ? 'VERIFYING...' : 'VERIFY EMAIL'}
              </button>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ← Change Email
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleSendVerificationOtp}
                  className="text-[var(--accent-blue)] hover:underline disabled:opacity-40"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <Icon name="check_circle" size={32} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Email Verified Successfully
            </h1>

            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Your email address has been verified. You now have full access to order tracking, custom PC builds, and account management.
            </p>

            <button
              onClick={() => navigate('/account')}
              className="w-full py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              GO TO ACCOUNT DASHBOARD
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
