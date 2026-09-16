import { useState } from 'react'
import { Icon } from '../components/ui'
import { contactService, type ContactFormData } from '../services/contactService'
import { FadeUp, SlideReveal } from '../components/motion/MotionPrimitives'

export function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (status) setStatus(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus({
        type: 'error',
        message: 'Please fill in all required fields (Name, Email, and Message).',
      })
      return
    }

    setLoading(true)
    setStatus(null)

    const result = await contactService.sendMessage(formData)

    setLoading(false)

    if (result.success) {
      setStatus({
        type: 'success',
        message: result.message || 'Thank you for your message. We will get back to you shortly!',
      })
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } else {
      setStatus({
        type: 'error',
        message: result.message || 'Unable to send your message right now. Please contact us directly by phone or email.',
      })
    }
  }

  return (
    <main className="flex-1 bg-(--bg-primary) text-(--text-primary)">
      
      {/* ─── Contact Header ─── */}
      <section className="py-12 md:py-16 px-4 md:px-6 bg-(--bg-surface-secondary) border-b border-(--border-theme)">
        <div className="container-max max-w-4xl mx-auto text-center space-y-4">
          <FadeUp delay={100}>
            <span className="text-xs font-bold uppercase tracking-wider text-(--accent-green)">
              Get in Touch
            </span>
          </FadeUp>

          <FadeUp delay={200}>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-(--text-primary)">
              Contact Us
            </h1>
          </FadeUp>

          <FadeUp delay={300}>
            <p className="text-xs sm:text-sm md:text-base text-(--text-secondary) max-w-xl mx-auto">
              Have a question or want to get in touch with [CAFÉ NAME]? Send us a message or reach out directly.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ─── Main Content Grid ─── */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="container-max max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Contact Details Cards (Left Column) */}
          <SlideReveal direction="left" distance={25} delay={150} className="lg:col-span-5 space-y-6">
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-2xl p-6 md:p-8 space-y-6 shadow-xs hover:shadow-sm transition-shadow">
              <h2 className="font-bold text-xl text-(--text-primary)">
                Contact Information
              </h2>

              <ul className="space-y-5 text-xs sm:text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-(--bg-surface-secondary) text-(--accent-green) flex items-center justify-center shrink-0 border border-(--border-theme)">
                    <Icon name="location_on" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-(--text-primary)">Address</h3>
                    <p className="text-(--text-secondary) mt-0.5">[ADDRESS]</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-(--bg-surface-secondary) text-(--accent-green) flex items-center justify-center shrink-0 border border-(--border-theme)">
                    <Icon name="call" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-(--text-primary)">Phone</h3>
                    <p className="text-(--text-secondary) mt-0.5">[PHONE]</p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-(--bg-surface-secondary) text-(--accent-green) flex items-center justify-center shrink-0 border border-(--border-theme)">
                    <Icon name="mail" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-(--text-primary)">Email</h3>
                    <p className="text-(--text-secondary) mt-0.5">[EMAIL]</p>
                  </div>
                </li>

                <li className="flex items-start gap-3 pt-3 border-t border-(--border-subtle)">
                  <div className="w-9 h-9 rounded-lg bg-(--bg-surface-secondary) text-(--accent-green) flex items-center justify-center shrink-0 border border-(--border-theme)">
                    <Icon name="schedule" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-(--text-primary)">Opening Hours</h3>
                    <p className="text-(--text-secondary) mt-0.5">[OPENING HOURS]</p>
                  </div>
                </li>
              </ul>
            </div>
          </SlideReveal>

          {/* Contact Form (Right Column) */}
          <SlideReveal direction="right" distance={25} delay={250} className="lg:col-span-7">
            <div className="bg-(--bg-surface) border border-(--border-theme) rounded-2xl p-6 sm:p-8 md:p-10 shadow-xs space-y-6">
              <div>
                <h2 className="font-bold text-xl text-(--text-primary)">Send a Message</h2>
                <p className="text-xs sm:text-sm text-(--text-secondary) mt-1">
                  Fill out the form below and we will respond as soon as possible.
                </p>
              </div>

              {status && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 animate-fadeIn transition-all duration-300 ${
                    status.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-800'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-800'
                  }`}
                >
                  <Icon
                    name={status.type === 'success' ? 'check_circle' : 'error'}
                    size={20}
                    className="shrink-0 mt-0.5"
                  />
                  <span>{status.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="block text-xs font-semibold text-(--text-primary)">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) text-xs sm:text-sm text-(--text-primary) transition-all duration-200 focus:outline-none focus:border-(--accent-green) focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--accent-green)/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-semibold text-(--text-primary)">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) text-xs sm:text-sm text-(--text-primary) transition-all duration-200 focus:outline-none focus:border-(--accent-green) focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--accent-green)/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-xs font-semibold text-(--text-primary)">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your phone number"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) text-xs sm:text-sm text-(--text-primary) transition-all duration-200 focus:outline-none focus:border-(--accent-green) focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--accent-green)/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="block text-xs font-semibold text-(--text-primary)">
                      Subject (Optional)
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="General inquiry, event, etc."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) text-xs sm:text-sm text-(--text-primary) transition-all duration-200 focus:outline-none focus:border-(--accent-green) focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--accent-green)/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="block text-xs font-semibold text-(--text-primary)">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-(--bg-surface-secondary) border border-(--border-theme) text-xs sm:text-sm text-(--text-primary) transition-all duration-200 focus:outline-none focus:border-(--accent-green) focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--accent-green)/20 resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-(--accent-green) text-white text-xs sm:text-sm font-semibold hover:bg-(--accent-green-hover) disabled:opacity-50 transition-all duration-200 shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Icon name="send" size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </SlideReveal>

        </div>
      </section>

    </main>
  )
}
