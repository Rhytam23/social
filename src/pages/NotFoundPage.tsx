import { Link } from 'react-router-dom'
import { Icon } from '../components/ui'

export function NotFoundPage() {
  return (
    <main className="flex-1 w-full flex items-center justify-center py-24">
      <div className="container-max px-4 text-center max-w-md">
        <div className="font-black text-7xl text-[#007aff] tracking-tighter mb-2 font-mono">404</div>
        <div className="w-14 h-14 bg-[#1a1b1f] border border-[#414755] rounded-full flex items-center justify-center mx-auto mb-5 text-[#8b90a0]">
          <Icon name="report" size={28} />
        </div>
        <h1 className="text-white font-bold text-2xl tracking-tight mb-2">Page Not Found</h1>
        <p className="text-[#8b90a0] text-sm mb-8">
          The page you're looking for may have been moved, discontinued, or never existed. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="px-6 py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors">RETURN HOME</Link>
          <Link to="/products" className="px-6 py-3 bg-[#121317] border border-[#414755] hover:border-white text-white font-mono text-xs font-bold rounded transition-colors">BROWSE HARDWARE</Link>
        </div>
      </div>
    </main>
  )
}
