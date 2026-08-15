import { useState } from 'react'
import { Icon } from '../ui'

// ─── Newsletter ───────────────────────────────────────────────────────────────

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setEmail('')
  }

  return (
    <section className="bg-[#1a1b1f] border border-[#414755] rounded p-6 md:p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="font-mono text-[10px] tracking-[0.12em] text-[#8b90a0] mb-2">STAY UPDATED</div>
        <h2 className="text-white font-semibold text-xl tracking-tight mb-2">
          Get Exclusive Deals & Tech News
        </h2>
        <p className="text-[#8b90a0] text-sm mb-6">
          Subscribe for early access to new products, flash deals, and hardware reviews. No spam.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-[#30d158]">
            <Icon name="check_circle" size={20} filled />
            <span className="font-mono text-sm tracking-[0.04em]">You're subscribed! Welcome to the community.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-[#292a2e] border border-[#414755] text-[#e3e2e7] text-sm px-4 py-2.5 rounded focus:outline-none focus:border-[#007aff] placeholder:text-[#8b90a0] transition-colors"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#007aff] text-white font-mono text-[11px] tracking-[0.06em] rounded hover:bg-[#0066d6] active:bg-[#004fc2] transition-colors whitespace-nowrap"
            >
              SUBSCRIBE <Icon name="arrow_forward" size={14} />
            </button>
          </form>
        )}

        <p className="text-[#414755] font-mono text-[9px] tracking-[0.04em] mt-4">
          By subscribing you agree to our Privacy Policy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  )
}
