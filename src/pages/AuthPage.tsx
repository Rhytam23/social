import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui'

type Mode = 'login' | 'register' | 'forgot'

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
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'forgot') { setSent(true); return }
    navigate('/account')
  }

  const titles: Record<Mode, string> = {
    login: 'Sign in to your account',
    register: 'Create your account',
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

            {/* Tabs */}
            {mode !== 'forgot' && (
              <div className="flex gap-1 bg-[#121317] border border-[#292a2e] rounded p-1 mb-6">
                <Link to="/login" className={`flex-1 text-center py-2 rounded font-mono text-xs font-bold transition-colors ${mode === 'login' ? 'bg-[#007aff] text-white' : 'text-[#8b90a0] hover:text-white'}`}>SIGN IN</Link>
                <Link to="/register" className={`flex-1 text-center py-2 rounded font-mono text-xs font-bold transition-colors ${mode === 'register' ? 'bg-[#007aff] text-white' : 'text-[#8b90a0] hover:text-white'}`}>REGISTER</Link>
              </div>
            )}

            <h1 className="text-white font-bold text-xl tracking-tight mb-1">{titles[mode]}</h1>
            <p className="text-[#8b90a0] text-xs mb-6">
              {mode === 'login' && 'Enter your credentials to access your dashboard.'}
              {mode === 'register' && 'It only takes a minute to get started.'}
              {mode === 'forgot' && 'We will email you a secure link to reset your password.'}
            </p>

            {sent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-[#30d15820] text-[#30d158] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#30d15840]">
                  <Icon name="mark_email_read" size={28} />
                </div>
                <h2 className="text-white font-bold text-lg mb-1">Check your inbox</h2>
                <p className="text-[#8b90a0] text-xs mb-6">A password reset link has been sent to your email address.</p>
                <Link to="/login" className="px-5 py-2.5 bg-[#007aff] text-white font-mono text-xs rounded font-bold inline-block">BACK TO SIGN IN</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div><label className={labelClass}>Full Name</label><input className={inputClass} placeholder="Alex Rider" required /></div>
                )}
                <div><label className={labelClass}>Email Address</label><input type="email" className={inputClass} placeholder="you@example.com" required /></div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-mono text-[#8b90a0] uppercase tracking-wider">Password</label>
                      {mode === 'login' && <Link to="/forgot-password" className="text-[10px] font-mono text-[#adc6ff] hover:text-white">Forgot?</Link>}
                    </div>
                    <input type="password" className={inputClass} placeholder="••••••••" required />
                  </div>
                )}

                {mode === 'register' && (
                  <div><label className={labelClass}>Confirm Password</label><input type="password" className={inputClass} placeholder="••••••••" required /></div>
                )}

                {mode === 'login' && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#c1c6d7]">
                    <input type="checkbox" className="w-4 h-4 rounded bg-[#121317] border-[#414755] accent-[#007aff]" /> Keep me signed in
                  </label>
                )}
                {mode === 'register' && (
                  <label className="flex items-start gap-2 cursor-pointer text-xs font-mono text-[#c1c6d7]">
                    <input type="checkbox" required className="w-4 h-4 rounded bg-[#121317] border-[#414755] accent-[#007aff] mt-0.5" />
                    <span>I agree to the <Link to="/terms" className="text-[#adc6ff] hover:text-white">Terms of Service</Link> and <Link to="/privacy" className="text-[#adc6ff] hover:text-white">Privacy Policy</Link></span>
                  </label>
                )}

                <button type="submit" className="w-full py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors">
                  {mode === 'login' ? 'SIGN IN' : mode === 'register' ? 'CREATE ACCOUNT' : 'SEND RESET LINK'}
                </button>

                {mode !== 'forgot' && (
                  <>
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-[#292a2e]" />
                      <span className="font-mono text-[10px] text-[#8b90a0]">OR CONTINUE WITH</span>
                      <div className="flex-1 h-px bg-[#292a2e]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['Google', 'GitHub'].map((provider) => (
                        <button key={provider} type="button" onClick={() => navigate('/account')} className="py-2.5 bg-[#121317] border border-[#414755] hover:border-[#8b90a0] text-white font-mono text-xs rounded transition-colors flex items-center justify-center gap-2">
                          <Icon name={provider === 'Google' ? 'public' : 'code'} size={16} /> {provider}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {mode === 'forgot' && (
                  <Link to="/login" className="block text-center font-mono text-xs text-[#adc6ff] hover:text-white pt-2">← Back to sign in</Link>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
