import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui'
import { authService } from '../services/authService'
import { useShop } from '../context/ShopContext'

type Mode = 'login' | 'register' | 'forgot'
type AuthMethod = 'otp' | 'password'

const inputClass = 'w-full bg-[#121317] border border-[#414755] rounded p-3 text-sm text-white focus:outline-none focus:border-[#007aff] placeholder:text-[#8b90a0]'
const labelClass = 'text-[11px] font-mono text-[#8b90a0] block mb-1.5 uppercase tracking-wider'

const BENEFITS = [
  { icon: 'package_2', text: 'Track orders & manage returns' },
  { icon: 'favorite', text: 'Save wishlists across devices' },
  { icon: 'memory', text: 'Store custom PC builds' },
  { icon: 'bolt', text: 'Early access to flash deals' },
]

export function AuthPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const { showToast } = useShop()

  // State
  const [authMethod, setAuthMethod] = useState<AuthMethod>('otp')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  // OTP input references for auto-focus
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Send OTP handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const res = await authService.sendOtp(email.trim(), mode === 'register' ? 'register' : 'login')
      if (res.demoCode) {
        setDemoCode(res.demoCode)
      }
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
      await authService.verifyOtp(email.trim(), code, mode === 'register' ? 'register' : 'login')
      showToast('Successfully authenticated!', 'cart')
      navigate('/account')
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
      if (mode === 'register') {
        const [firstName, ...rest] = fullName.split(' ')
        await authService.register({
          email: email.trim(),
          password,
          firstName: firstName || 'Valued',
          lastName: rest.join(' ') || 'Customer',
        })
      } else {
        await authService.login(email.trim(), password)
      }
      showToast('Welcome back!', 'cart')
      navigate('/account')
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'wishlist')
    } finally {
      setLoading(false)
    }
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
    <main className="flex-1 w-full">
      <div className="container-max px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Brand panel */}
          <div className="hidden lg:flex flex-col justify-between rounded border border-[#414755] bg-gradient-to-br from-[#16171d] to-[#1a1b1f] p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(#007aff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <span className="font-black text-2xl text-white tracking-tighter">PREMIUM PC</span>
              <p className="text-[#8b90a0] text-sm mt-4 leading-relaxed max-w-xs">
                Join thousands of enthusiasts building and buying premium hardware with confidence.
              </p>
            </div>
            <ul className="relative z-10 space-y-3 mt-8">
              {BENEFITS.map((b) => (
                <li key={b.text} className="flex items-center gap-3 text-sm text-[#c1c6d7]">
                  <span className="w-8 h-8 rounded bg-[#007aff15] border border-[#007aff30] flex items-center justify-center text-[#007aff] shrink-0">
                    <Icon name={b.icon} size={16} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Form panel */}
          <div className="bg-[#1a1b1f] border border-[#414755] rounded p-6 sm:p-8">
            <div className="lg:hidden mb-6"><span className="font-black text-xl text-white tracking-tighter">PREMIUM PC</span></div>

            {/* Navigation Tabs */}
            {mode !== 'forgot' && (
              <div className="flex gap-1 bg-[#121317] border border-[#292a2e] rounded p-1 mb-6">
                <Link to="/login" onClick={() => setStep('email')} className={`flex-1 text-center py-2 rounded font-mono text-xs font-bold transition-colors ${mode === 'login' ? 'bg-[#007aff] text-white' : 'text-[#8b90a0] hover:text-white'}`}>SIGN IN</Link>
                <Link to="/register" onClick={() => setStep('email')} className={`flex-1 text-center py-2 rounded font-mono text-xs font-bold transition-colors ${mode === 'register' ? 'bg-[#007aff] text-white' : 'text-[#8b90a0] hover:text-white'}`}>REGISTER</Link>
              </div>
            )}

            <h1 className="text-white font-bold text-xl tracking-tight mb-1">{titles[mode]}</h1>
            <p className="text-[#8b90a0] text-xs mb-6">
              {step === 'otp' ? (
                <span>We sent a 6-digit verification code to <strong className="text-white">{email}</strong>.</span>
              ) : (
                mode === 'login' && 'Enter your email to receive an instant OTP verification code.'
              )}
            </p>

            {/* OTP Flow */}
            {authMethod === 'otp' && mode !== 'forgot' ? (
              step === 'email' ? (
                // Step 1: Send OTP Form
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {mode === 'register' && (
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <input
                        className={inputClass}
                        placeholder="Alex Rider"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'SENDING OTP...' : 'SEND OTP CODE'}
                    <Icon name="arrow_forward" size={16} />
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('password')}
                      className="text-[11px] font-mono text-[#adc6ff] hover:text-white underline"
                    >
                      Use Password Instead
                    </button>
                  </div>
                </form>
              ) : (
                // Step 2: 6-Digit OTP Verification Form
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {demoCode && (
                    <div className="p-3 bg-[#007aff15] border border-[#007aff40] rounded text-xs text-[#adc6ff] font-mono text-center">
                      🔑 <strong>Demo Mode OTP Code</strong>: <span className="text-white font-bold text-sm tracking-wider ml-1">{demoCode}</span>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Enter 6-Digit OTP Code</label>
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
                          className="w-12 h-14 bg-[#121317] border border-[#414755] focus:border-[#007aff] text-center font-mono text-xl font-bold text-white rounded focus:outline-none transition-colors"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors disabled:opacity-50"
                  >
                    {loading ? 'VERIFYING...' : 'VERIFY & SIGN IN'}
                  </button>

                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-[#8b90a0] hover:text-white flex items-center gap-1"
                    >
                      ← Change Email
                    </button>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleSendOtp}
                      className="text-[#adc6ff] hover:text-white disabled:opacity-40"
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )
            ) : (
              // Password Login / Reset Fallback
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      className={inputClass}
                      placeholder="Alex Rider"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-mono text-[#8b90a0] uppercase tracking-wider">Password</label>
                      {mode === 'login' && <Link to="/forgot-password" className="text-[10px] font-mono text-[#adc6ff] hover:text-white">Forgot?</Link>}
                    </div>
                    <input
                      type="password"
                      className={inputClass}
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
                  className="w-full py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors disabled:opacity-50"
                >
                  {loading ? 'PROCESSING...' : mode === 'login' ? 'SIGN IN WITH PASSWORD' : 'CREATE ACCOUNT'}
                </button>

                {mode !== 'forgot' && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('otp')}
                      className="text-[11px] font-mono text-[#adc6ff] hover:text-white underline"
                    >
                      ← Switch to Email OTP Authentication
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
