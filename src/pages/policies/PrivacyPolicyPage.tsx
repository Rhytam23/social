import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui'

export function PrivacyPolicyPage() {
  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-6">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff]">PRIVACY POLICY</span>
        </nav>

        <header className="mb-10 border-b border-[#292a2e] pb-6">
          <h1 className="text-white font-sans font-bold text-3xl md:text-4xl tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-[#8b90a0] text-sm max-w-2xl leading-relaxed">
            PREMIUM PC is committed to protecting customer data, payment confidentiality, and account security.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-8 space-y-8 text-sm text-[#c1c6d7] leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">1. Personal Data Collection</h2>
              <p>
                When you place orders on PREMIUM PC, we collect necessary account data to fulfill product delivery, provide technical support, and manage order history.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#8b90a0]">
                <li><strong className="text-white">Account Information:</strong> Name, email address, billing/shipping address, and contact details.</li>
                <li><strong className="text-white">Transaction Logs:</strong> Order histories and custom PC builder configuration saves.</li>
                <li><strong className="text-white">Payment Processing:</strong> Tokenized payment details handled via standard payment gateway providers.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">2. Usage & Data Rights</h2>
              <p>
                Your personal data is used solely for order processing, logistics updates, and customer support inquiries. You retain the right to request account data export or deletion.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white font-bold text-lg tracking-tight">3. Corporate Entity Details</h2>
              <div className="p-4 bg-[#16171d] border border-[#292a2e] rounded-lg text-xs font-mono space-y-1 text-[#8b90a0]">
                <div><span className="text-white font-semibold">Legal Entity:</span> [CLIENT CONFIRMATION REQUIRED: Legal Company Name]</div>
                <div><span className="text-white font-semibold">Address:</span> [CLIENT CONFIRMATION REQUIRED: Physical Business Address]</div>
                <div><span className="text-white font-semibold">Privacy Email:</span> [CLIENT CONFIRMATION REQUIRED: Privacy Contact Email]</div>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-[#16171d] border border-[#292a2e] rounded-xl p-6 space-y-4 sticky top-24">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Icon name="shield" size={18} className="text-[#007aff]" />
                Privacy & Data Support
              </h3>
              <p className="text-xs text-[#8b90a0] leading-relaxed">
                Contact our customer support desk for privacy inquiries or account requests.
              </p>
              <Link to="/support" className="text-[#007aff] font-mono text-xs hover:underline block pt-1">
                Contact Support Portal →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
