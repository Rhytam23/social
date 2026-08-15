import { useLocation, Link } from 'react-router-dom'
import { Icon } from '../components/ui'
import { useShop } from '../context/ShopContext'

export function OrderConfirmationPage() {
  const location = useLocation()
  const { orders } = useShop()
  const orderId = (location.state as { orderId?: string } | null)?.orderId
  const order = orders.find((o) => o.id === orderId) || orders[0]

  if (!order) {
    return (
      <main className="flex-1 w-full py-16 text-center container-max px-4">
        <Icon name="receipt_long" size={48} className="text-[#8b90a0] mb-4 mx-auto" />
        <h1 className="text-white font-bold text-2xl mb-3">No Recent Order</h1>
        <p className="text-[#8b90a0] mb-6">Place an order to see your confirmation here.</p>
        <Link to="/products" className="px-5 py-2.5 bg-[#007aff] text-white font-mono text-xs rounded font-bold inline-block">
          BROWSE HARDWARE
        </Link>
      </main>
    )
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-8 max-w-3xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#30d15820] text-[#30d158] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#30d15840]">
            <Icon name="check_circle" size={38} filled />
          </div>
          <span className="font-mono text-xs text-[#30d158] uppercase font-bold tracking-wider block mb-1">Order Confirmed</span>
          <h1 className="text-white font-bold text-2xl md:text-3xl tracking-tight mb-2">Thank you for your order!</h1>
          <p className="text-[#8b90a0] text-sm">
            A confirmation email has been sent. Your order <span className="text-[#adc6ff] font-mono font-bold">{order.id}</span> is now being prepared.
          </p>
        </div>

        {/* Order meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#292a2e] border border-[#414755] rounded overflow-hidden mb-6">
          {[
            { label: 'Order Number', value: order.id },
            { label: 'Order Total', value: `$${order.total.toFixed(2)}` },
            { label: 'Tracking', value: order.trackingNumber },
            { label: 'Est. Delivery', value: order.estimatedDelivery },
          ].map((m) => (
            <div key={m.label} className="bg-[#1a1b1f] p-4">
              <span className="font-mono text-[10px] text-[#8b90a0] uppercase block mb-1">{m.label}</span>
              <span className="text-white text-sm font-bold break-words">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="bg-[#1a1b1f] border border-[#414755] rounded overflow-hidden mb-6">
          <div className="p-4 bg-[#1e1f23] border-b border-[#292a2e] font-mono text-xs text-[#8b90a0] font-semibold uppercase">
            Order Items ({order.items.length})
          </div>
          <div className="divide-y divide-[#292a2e]">
            {order.items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-4 p-4">
                <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded bg-[#0d0e12] shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-white text-xs font-bold truncate">{product.name}</h3>
                  <span className="font-mono text-[10px] text-[#8b90a0]">Qty: {quantity}</span>
                </div>
                <span className="font-mono text-white font-bold text-sm shrink-0">${(product.price * quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-[#16171d] border-t border-[#292a2e] space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-[#8b90a0]"><span>Subtotal</span><span className="text-white">${order.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-[#8b90a0]"><span>Shipping</span><span className={order.shipping === 0 ? 'text-[#30d158]' : 'text-white'}>{order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}</span></div>
            <div className="flex justify-between text-[#8b90a0]"><span>Tax</span><span className="text-white">${order.tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#292a2e]"><span>Total</span><span className="text-[#007aff]">${order.total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5 mb-8">
          <h2 className="font-mono text-xs font-bold text-white uppercase mb-3 flex items-center gap-1.5">
            <Icon name="local_shipping" size={16} className="text-[#007aff]" /> Shipping To
          </h2>
          <div className="text-xs font-mono text-[#c1c6d7] leading-relaxed">
            <strong className="text-white block text-sm">{order.shippingAddress.name}</strong>
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/account/orders/${order.id}`} className="px-6 py-3 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors">
            <Icon name="local_shipping" size={16} /> TRACK YOUR ORDER
          </Link>
          <Link to="/products" className="px-6 py-3 bg-[#121317] border border-[#414755] hover:border-white text-white font-mono text-xs font-bold rounded flex items-center justify-center transition-colors">
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    </main>
  )
}
