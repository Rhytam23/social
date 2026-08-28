import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui'
import { authService } from '../services/authService'
import { useShop } from '../context/ShopContext'
import { useAuth } from '../context/AuthContext'
import { config } from '../lib/config'

type Mode = 'login' | 'register' | 'forgot'
type AuthMethod = 'otp' | 'password'

const BENEFITS = [
  { icon: 'package_2', text: 'Track orders & manage returns' },
  { icon: 'favorite', text: 'Save wishlists across devices' },
  { icon: 'memory', text: 'Store custom PC builds' },
  { icon: 'bolt', text: 'Early access to flash deals' },
]

export function AuthPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useShop()
  const { setUser } = useAuth()
  // Return the user to wherever they were sent from (e.g. /checkout).
  const nextPath = searchParams.get('next') || '/account'

  // State
  const [authMethod, setAuthMethod] = useState<AuthMethod>('otp')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // OTP input references for auto-focus
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Check for OAuth errors in URL query string
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'google_cancelled') {
        showToast('Google sign-in was cancelled or interrupted.', 'info')
      } else if (errorParam === 'github_cancelled') {
        showToast('GitHub sign-in was cancelled or interrupted.', 'info')
      } else {
        showToast(decodeURIComponent(errorParam), 'wishlist')
      }
    }
  }, [searchParams, showToast])

  // Send OTP handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      await authService.sendOtp(email.trim(), mode === 'register' ? 'register' : 'login')
      setStep('otp')
      showToast(`OTP code sent to ${email}`, 'info')

      // Start 60s resend timer
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
      showToast(err.message || 'Failed to send OTP code', 'wishlist')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpDigits.join('')
    if (code.length !== 6) {
      showToast('Please enter all 6 digits of your OTP code', 'wishlist')
      return
    }

    setLoading(true)
    try {
      const { user } = await authService.verifyOtp(email.trim(), code, mode === 'register' ? 'register' : 'login')
      setUser(user)
      showToast('Successfully authenticated', 'cart')
      navigate(nextPath)
    } catch (err: any) {
      showToast(err.message || 'Invalid OTP code', 'wishlist')
    } finally {
      setLoading(false)
    }
  }

  // Password login handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result =
        mode === 'register'
          ? await (async () => {
              const [firstName, ...rest] = fullName.trim().split(' ')
              return authService.register({
                email: email.trim(),
                password,
                firstName: firstName || 'Customer',
                lastName: rest.join(' ') || '-',
              })
            })()
          : await authService.login(email.trim(), password)

      setUser(result.user)
      showToast(mode === 'register' ? 'Account created' : 'Welcome back', 'cart')
      navigate(nextPath)
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'wishlist')
    } finally {
      setLoading(false)
    }
  }

  // OAuth Redirect Handlers
  const handleOAuthRedirect = (provider: 'google' | 'github') => {
    const targetUrl = `${config.api.baseUrl}/api/auth/${provider}`
    window.location.href = targetUrl
  }

  // Handle individual OTP digit change
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)

    // Auto-advance focus to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const titles: Record<Mode, string> = {
    login: step === 'otp' ? 'Enter 6-Digit OTP' : 'Sign in to your account',
    register: step === 'otp' ? 'Verify your Email' : 'Create your account',
    forgot: 'Reset your password',
  }

  return (
    <main className="flex-1 w-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="container-max px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 max-w-5xl mx-auto items-center">
          
          {/* Left Section: Directly on page background without container */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-8 pr-0 lg:pr-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-mono text-xs font-semibold mb-4">
                <span>PREMIUM PC PLATFORM</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
                Build & Order High-Performance Rigs
              </h2>
              <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">
                Join thousands of enthusiasts building and buying premium hardware with confidence.
              </p>
            </div>

            <ul className="space-y-4">
              {BENEFITS.map((b) => (
                <li key={b.text} className="flex items-center gap-3.5 text-sm text-[var(--text-primary)]">
                  <span className="w-9 h-9 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] flex items-center justify-center shrink-0">
                    <Icon name={b.icon} size={18} />
                  </span>
                  <span className="font-medium">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Section: Form sitting directly on page background without outer card container */}
          <div className="lg:col-span-7 flex flex-col justify-center py-2">
            <div className="lg:hidden mb-6">
              <span className="font-extrabold text-xl text-[var(--text-primary)] tracking-tight">PREMIUM PC</span>
            </div>

            {/* Navigation Tabs */}
            {mode !== 'forgot' && (
              <div className="flex gap-1 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-1 mb-8">
                <Link
                  to="/login"
                  onClick={() => setStep('email')}
                  className={`flex-1 text-center py-2.5 rounded-md font-mono text-xs font-bold transition-all ${
                    mode === 'login'
                      ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  SIGN IN
                </Link>
                <Link
                  to="/register"
                  onClick={() => setStep('email')}
                  className={`flex-1 text-center py-2.5 rounded-md font-mono text-xs font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  REGISTER
                </Link>
              </div>
            )}

            <h1 className="text-[var(--text-primary)] font-bold text-2xl sm:text-3xl tracking-tight mb-2">{titles[mode]}</h1>
            <p className="text-[var(--text-secondary)] text-sm mb-8">
              {step === 'otp' ? (
                <span>We sent a 6-digit verification code to <strong className="text-[var(--text-primary)]">{email}</strong>.</span>
              ) : (
                mode === 'login'
                  ? 'Enter your email to receive an instant OTP verification code.'
                  : 'It only takes a minute to get started with your account.'
              )}
            </p>

            {/* OTP Flow */}
            {authMethod === 'otp' && mode !== 'forgot' ? (
              step === 'email' ? (
                // Step 1: Send OTP Form
                <form onSubmit={handleSendOtp} className="space-y-5">
                  {mode === 'register' && (
                    <div>
                      <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">Full Name</label>
                      <input
                        className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                        placeholder="Alex Rider"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">Email Address</label>
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
                    className="w-full py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? 'SENDING OTP...' : 'SEND OTP CODE'}
                    <Icon name="arrow_forward" size={16} />
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('password')}
                      className="text-xs font-mono text-[var(--accent-blue)] hover:underline font-medium"
                    >
                      Use Password Instead
                    </button>
                  </div>
                </form>
              ) : (
                // Step 2: 6-Digit OTP Verification Form
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">Enter 6-Digit OTP Code</label>
                    <div className="flex gap-2 sm:gap-3 justify-between mt-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpInputRefs.current[idx] = el }}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-11 h-14 sm:w-14 sm:h-16 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] focus:border-[var(--accent-blue)] text-center font-mono text-xl font-bold text-[var(--text-primary)] rounded-lg focus:outline-none transition-colors"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {loading ? 'VERIFYING...' : 'VERIFY & SIGN IN'}
                  </button>

                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                    >
                      ← Change Email
                    </button>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleSendOtp}
                      className="text-[var(--accent-blue)] hover:underline disabled:opacity-40"
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )
            ) : (
              // Password Login / Registration Fallback
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {mode === 'register' && (
                  <div>
                    <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">Full Name</label>
                    <input
                      className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                      placeholder="Alex Rider"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-mono text-[var(--text-secondary)] block mb-2 uppercase tracking-wider font-semibold">Email Address</label>
                  <input
                    type="email"
                    className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Password</label>
                      {mode === 'login' && <Link to="/forgot-password" className="text-xs font-mono text-[var(--accent-blue)] hover:underline">Forgot?</Link>}
                    </div>
                    <input
                      type="password"
                      className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] rounded-lg p-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white font-mono text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'PROCESSING...' : mode === 'login' ? 'SIGN IN WITH PASSWORD' : 'CREATE ACCOUNT'}
                </button>

                {mode !== 'forgot' && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('otp')}
                      className="text-xs font-mono text-[var(--accent-blue)] hover:underline font-medium"
                    >
                      ← Switch to Email OTP Authentication
                    </button>
                  </div>
                )}
              </form>
            )}

            {mode !== 'forgot' && (
              <>
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-[var(--border-theme)]" />
                  <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider">OR CONTINUE WITH</span>
                  <div className="flex-1 h-px bg-[var(--border-theme)]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleOAuthRedirect('google')}
                    className="py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Icon name="public" size={16} /> Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuthRedirect('github')}
                    className="py-3 bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-secondary)] text-[var(--text-primary)] font-mono text-xs rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Icon name="code" size={16} /> GitHub
                  </button>
                </div>
              </>
            )}

            {mode === 'forgot' && (
              <Link to="/login" className="block text-center font-mono text-xs text-[var(--accent-blue)] hover:underline pt-4">
                ← Back to sign in
              </Link>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
