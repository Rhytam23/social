import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Icon, Badge, StockBadge, StarRating, Price } from '../components/ui'
import { ProductGrid } from '../components/products/ProductCard'
import { useShop } from '../context/ShopContext'

export function ProductDetailsPage() {
  const { slug, id } = useParams()
  const navigate = useNavigate()
  const { products, addToCart, toggleWishlist, isInWishlist, wishlist, toggleCompare, isInCompare } = useShop()

  const product = useMemo(() => {
    if (slug) return products.find((p) => p.slug === slug)
    if (id) return products.find((p) => p.id === id)
    return undefined
  }, [slug, id, products])

  const [selectedImage, setSelectedImage] = useState<string>(product?.image || '')
  const [mainImgError, setMainImgError] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'specs' | 'overview' | 'reviews' | 'questions'>('specs')

  // Review form state
  const [newReviewAuthor, setNewReviewAuthor] = useState('')
  const [newReviewTitle, setNewReviewTitle] = useState('')
  const [newReviewContent, setNewReviewContent] = useState('')
  const [newReviewRating, setNewReviewRating] = useState(5)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  if (!product) {
    return (
      <main className="flex-1 container-max px-4 py-16 text-center">
        <Icon name="search_off" size={48} className="text-[#8b90a0] mb-4" />
        <h1 className="text-white font-bold text-2xl mb-2">Product Not Found</h1>
        <p className="text-[#8b90a0] mb-6">The hardware model you are looking for may have been moved or discontinued.</p>
        <Link to="/products" className="px-5 py-2.5 bg-[#007aff] text-white font-mono text-xs rounded font-bold">
          BROWSE ALL PRODUCTS
        </Link>
      </main>
    )
  }

  const gallery = product.gallery || [product.image]
  const isWishlisted = isInWishlist(product.id)
  const comparing = isInCompare(product.id)
  const relatedProducts = useMemo(() => {
    return products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 4)
  }, [products, product])

  const fbtItems = useMemo(() => {
    return products
      .filter((p) => p.id !== product.id && p.category !== product.category && p.category !== 'Gaming PCs')
      .slice(0, 2)
  }, [products, product])

  const fbtBundle = [product, ...fbtItems]
  const fbtTotal = fbtBundle.reduce((s, p) => s + p.price, 0)

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReviewAuthor || !newReviewContent) return
    setReviewSubmitted(true)
    setNewReviewAuthor('')
    setNewReviewTitle('')
    setNewReviewContent('')
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-[#8b90a0] mb-6 flex-wrap">
          <Link to="/" className="hover:text-white transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <Link to="/products" className="hover:text-white transition-colors">PRODUCTS</Link>
          <Icon name="chevron_right" size={12} />
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-white transition-colors uppercase">
            {product.category}
          </Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[#adc6ff] truncate max-w-[200px]">{product.brand}</span>
        </nav>

        {/* Top Product Section (Gallery + Purchase Info) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-[#292a2e]">

          {/* Left: Product Gallery (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails list */}
            {gallery.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded border overflow-hidden bg-[#1e1f23] shrink-0 transition-all ${
                      (selectedImage || product.image) === img ? 'border-[#007aff] ring-1 ring-[#007aff]' : 'border-[#414755] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Display */}
            <div className="flex-1 relative bg-[#16171d] border border-[#292a2e] rounded-lg overflow-hidden flex items-center justify-center p-6 min-h-[340px] sm:min-h-[440px] shadow-xl">
              {!mainImgError ? (
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  className="max-h-[400px] w-auto object-contain hover:scale-105 transition-transform duration-300"
                  onError={() => setMainImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#414755] py-12">
                  <Icon name="memory" size={64} className="text-[#007aff60] mb-3" />
                  <span className="font-mono text-xs text-[#8b90a0]">HARDWARE SHOWCASE</span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {product.isNew && <Badge variant="primary">NEW ARRIVAL</Badge>}
                {product.discount && <Badge variant="orange">SAVE {product.discount}%</Badge>}
              </div>
            </div>
          </div>

          {/* Right: Product Buy Box & Specs (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Brand & Stock */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-[#007aff] uppercase font-bold tracking-wider">{product.brand}</span>
                <StockBadge status={product.stockStatus} />
              </div>

              {/* Title */}
              <h1 className="text-white font-bold text-xl md:text-2xl leading-snug tracking-tight mb-3">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#292a2e]">
                <StarRating rating={product.rating} count={product.reviewCount} size="md" />
                <span className="text-[#8b90a0] text-xs">| SKU: <span className="font-mono text-[#c1c6d7]">{product.sku || product.id.toUpperCase()}</span></span>
              </div>

              {/* Pricing Box */}
              <div className="bg-[#1a1b1f] p-4 rounded border border-[#292a2e] mb-5">
                <div className="flex items-baseline gap-3 mb-1">
                  <Price price={product.price} previousPrice={product.previousPrice} discount={product.discount} size="lg" />
                </div>
                <div className="text-[11px] font-mono text-[#30d158] flex items-center gap-1.5 mt-1">
                  <Icon name="check_circle" size={14} /> Available for instant dispatch & tracking
                </div>
              </div>

              {/* Key Specs Quick Pill Grid */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {product.specifications.slice(0, 4).map((spec) => (
                  <div key={spec.label} className="p-2.5 bg-[#16171d] rounded border border-[#292a2e] text-xs">
                    <span className="text-[#8b90a0] font-mono text-[10px] block uppercase">{spec.label}</span>
                    <span className="text-white font-semibold truncate block mt-0.5">{spec.value}</span>
                  </div>
                ))}
              </div>

              {/* Quantity + Add to Cart Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                {/* Quantity input */}
                <div className="flex items-center justify-between border border-[#414755] rounded bg-[#1a1b1f] px-2 py-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 text-[#8b90a0] hover:text-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Icon name="remove" size={16} />
                  </button>
                  <span className="font-mono text-sm px-4 font-bold text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 text-[#8b90a0] hover:text-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Icon name="add" size={16} />
                  </button>
                </div>

                {/* Primary Add to Cart */}
                <button
                  type="button"
                  onClick={() => addToCart(product, quantity)}
                  disabled={product.stockStatus === 'out-of-stock'}
                  className="flex-1 py-3 px-6 bg-[#007aff] hover:bg-[#0066d6] active:bg-[#004fc2] disabled:opacity-40 text-white font-mono text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  <Icon name="add_shopping_cart" size={18} />
                  ADD TO CART
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`p-3 rounded border transition-colors flex items-center justify-center shrink-0 ${
                    isWishlisted ? 'bg-[#ff453a20] border-[#ff453a] text-[#ff453a]' : 'border-[#414755] bg-[#1a1b1f] text-[#8b90a0] hover:text-[#ff453a]'
                  }`}
                >
                  <Icon name="favorite" size={20} filled={isWishlisted} />
                </button>
              </div>

              {/* Direct Buy Now + Compare */}
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(product, quantity)
                    navigate('/checkout')
                  }}
                  className="flex-1 py-2.5 bg-transparent border border-[#343539] hover:border-white text-white font-mono text-xs font-semibold rounded transition-colors text-center"
                >
                  BUY NOW WITH 1-CLICK
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompare(product.id)}
                  className={`px-4 py-2.5 font-mono text-xs font-semibold rounded transition-colors flex items-center gap-1.5 shrink-0 ${
                    comparing ? 'bg-[#007aff20] border border-[#007aff] text-[#007aff]' : 'bg-transparent border border-[#343539] text-[#8b90a0] hover:text-white hover:border-white'
                  }`}
                >
                  <Icon name="balance" size={16} /> {comparing ? 'COMPARING' : 'COMPARE'}
                </button>
              </div>
            </div>

            {/* Guarantee / Delivery Checklist */}
            <div className="pt-4 border-t border-[#292a2e] space-y-2 text-xs font-mono text-[#8b90a0]">
              <div className="flex items-center gap-2 text-[#c1c6d7]">
                <Icon name="local_shipping" size={16} className="text-[#007aff]" /> Free 2-Day Express Shipping on orders over $99
              </div>
              <div className="flex items-center gap-2 text-[#c1c6d7]">
                <Icon name="verified" size={16} className="text-[#30d158]" /> 3-Year Official Manufacturer Warranty
              </div>
              <div className="flex items-center gap-2 text-[#c1c6d7]">
                <Icon name="history" size={16} className="text-[#ffd60a]" /> 30-Day No-Hassle Return Policy
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Specs, Overview, Reviews */}
        <div className="mt-12">
          <div className="flex border-b border-[#292a2e] gap-6 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`pb-3 font-mono text-xs font-bold tracking-wider uppercase transition-colors relative ${
                activeTab === 'specs' ? 'text-[#007aff]' : 'text-[#8b90a0] hover:text-white'
              }`}
            >
              TECHNICAL SPECIFICATIONS
              {activeTab === 'specs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007aff]" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-3 font-mono text-xs font-bold tracking-wider uppercase transition-colors relative ${
                activeTab === 'overview' ? 'text-[#007aff]' : 'text-[#8b90a0] hover:text-white'
              }`}
            >
              PRODUCT OVERVIEW
              {activeTab === 'overview' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007aff]" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 font-mono text-xs font-bold tracking-wider uppercase transition-colors relative ${
                activeTab === 'reviews' ? 'text-[#007aff]' : 'text-[#8b90a0] hover:text-white'
              }`}
            >
              REVIEWS ({product.reviewCount})
              {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007aff]" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`pb-3 font-mono text-xs font-bold tracking-wider uppercase transition-colors relative ${
                activeTab === 'questions' ? 'text-[#007aff]' : 'text-[#8b90a0] hover:text-white'
              }`}
            >
              Q&amp;A
              {activeTab === 'questions' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007aff]" />}
            </button>
          </div>

          {/* Tab 1: Full Technical Specifications Table */}
          {activeTab === 'specs' && (
            <div className="bg-[#1a1b1f] rounded border border-[#292a2e] overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  {product.specifications.map((spec, i) => (
                    <tr key={spec.label} className={i % 2 === 0 ? 'bg-[#1a1b1f]' : 'bg-[#16171d]'}>
                      <th className="py-3 px-4 font-mono text-xs text-[#8b90a0] font-semibold w-1/3 border-b border-[#292a2e]">
                        {spec.label}
                      </th>
                      <td className="py-3 px-4 text-[#e3e2e7] font-mono text-xs border-b border-[#292a2e]">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                  {product.wattage !== undefined && (
                    <tr className="bg-[#16171d]">
                      <th className="py-3 px-4 font-mono text-xs text-[#8b90a0] font-semibold border-b border-[#292a2e]">
                        Estimated Peak Wattage
                      </th>
                      <td className="py-3 px-4 text-[#007aff] font-mono text-xs font-bold border-b border-[#292a2e]">
                        {product.wattage} Watts
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Overview & Description */}
          {activeTab === 'overview' && (
            <div className="bg-[#1a1b1f] p-6 rounded border border-[#292a2e] text-[#c1c6d7] leading-relaxed space-y-4">
              <p className="text-base text-white font-medium">
                {product.description || `${product.name} is built for gamers and professionals demanding high performance and thermal reliability.`}
              </p>
              <p>
                Engineered with high-grade components, premium PCB traces, and industrial heat dissipators to maintain sustained boost clocks during extreme workloads.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {product.tags?.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-[#121317] border border-[#414755] rounded text-xs font-mono text-[#adc6ff]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Customer Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Existing Reviews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(product.reviews || [
                  {
                    id: 'rev-default-1',
                    author: 'Marcus K. (Verified Buyer)',
                    rating: 5,
                    title: 'Phenomenal Performance & Thermal Stability',
                    date: 'August 10, 2026',
                    verified: true,
                    content: 'Installed this into my custom build and the speeds are breathtaking. Thermals stayed under 65C during 4K testing.',
                  },
                  {
                    id: 'rev-default-2',
                    author: 'Devon T. (Verified Buyer)',
                    rating: 5,
                    title: 'Top tier build quality',
                    date: 'July 28, 2026',
                    verified: true,
                    content: 'Everything arrived in pristine condition, securely packaged with authentic factory seals. Works flawlessly out of the box.',
                  }
                ]).map((rev) => (
                  <div key={rev.id} className="p-4 bg-[#1a1b1f] rounded border border-[#292a2e]">
                    <div className="flex items-center justify-between mb-2">
                      <StarRating rating={rev.rating} showCount={false} />
                      <span className="text-[11px] font-mono text-[#8b90a0]">{rev.date}</span>
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">{rev.title}</h4>
                    <p className="text-[#8b90a0] text-xs leading-relaxed mb-3">{rev.content}</p>
                    <div className="text-[11px] font-mono text-[#30d158] flex items-center gap-1">
                      <Icon name="verified" size={12} /> {rev.author}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add a Review Form */}
              <div className="p-6 bg-[#16171d] rounded border border-[#292a2e]">
                <h3 className="text-white font-bold text-base mb-3">Write a Customer Review</h3>
                {reviewSubmitted ? (
                  <div className="p-4 bg-[#30d15815] border border-[#30d15840] rounded text-[#30d158] text-xs font-mono">
                    Thank you! Your verified review has been submitted for moderation.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-[#8b90a0] block mb-1">YOUR NAME</label>
                        <input
                          type="text"
                          required
                          value={newReviewAuthor}
                          onChange={(e) => setNewReviewAuthor(e.target.value)}
                          placeholder="e.g. Sarah J."
                          className="w-full bg-[#1e1f23] border border-[#414755] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007aff]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-[#8b90a0] block mb-1">RATING</label>
                        <select
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="w-full bg-[#1e1f23] border border-[#414755] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007aff]"
                        >
                          <option value="5">★★★★★ 5 Stars (Excellent)</option>
                          <option value="4">★★★★☆ 4 Stars (Good)</option>
                          <option value="3">★★★☆☆ 3 Stars (Average)</option>
                          <option value="2">★★☆☆☆ 2 Stars (Below Expectation)</option>
                          <option value="1">★☆☆☆☆ 1 Star (Poor)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#8b90a0] block mb-1">REVIEW TITLE</label>
                      <input
                        type="text"
                        value={newReviewTitle}
                        onChange={(e) => setNewReviewTitle(e.target.value)}
                        placeholder="Brief summary of your experience"
                        className="w-full bg-[#1e1f23] border border-[#414755] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007aff]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#8b90a0] block mb-1">DETAILED FEEDBACK</label>
                      <textarea
                        required
                        rows={3}
                        value={newReviewContent}
                        onChange={(e) => setNewReviewContent(e.target.value)}
                        placeholder="Describe performance, noise levels, temps, and installation..."
                        className="w-full bg-[#1e1f23] border border-[#414755] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#007aff]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors"
                    >
                      SUBMIT REVIEW
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Questions & Answers */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {[
                { q: 'Is this compatible with my current motherboard?', a: 'Check the socket and form factor in the specifications tab. Our PC Builder tool also validates compatibility automatically as you add parts.', by: 'PREMIUM PC Support', when: 'Aug 9, 2026', votes: 24 },
                { q: 'What warranty period is included?', a: 'This product ships with a full 3-year manufacturer warranty, plus our 30-day no-hassle return policy.', by: 'PREMIUM PC Support', when: 'Aug 2, 2026', votes: 18 },
                { q: 'Does it come with all required cables?', a: 'Yes — all necessary cables and mounting hardware are included in the retail box.', by: 'Verified Owner', when: 'Jul 21, 2026', votes: 11 },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-[#1a1b1f] rounded border border-[#292a2e]">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-mono text-xs text-[#007aff] font-bold shrink-0">Q:</span>
                    <p className="text-white text-sm font-medium">{item.q}</p>
                  </div>
                  <div className="flex items-start gap-2 pl-1">
                    <span className="font-mono text-xs text-[#30d158] font-bold shrink-0">A:</span>
                    <p className="text-[#c1c6d7] text-xs leading-relaxed">{item.a}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#292a2e] text-[11px] font-mono text-[#8b90a0]">
                    <span>{item.by} · {item.when}</span>
                    <span className="flex items-center gap-1 ml-auto"><Icon name="thumb_up" size={13} /> {item.votes} helpful</span>
                  </div>
                </div>
              ))}
              <div className="p-5 bg-[#16171d] rounded border border-[#292a2e] flex flex-col sm:flex-row items-center gap-3 justify-between">
                <span className="text-[#c1c6d7] text-sm">Have a question about this product?</span>
                <button className="px-5 py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded transition-colors">ASK A QUESTION</button>
              </div>
            </div>
          )}
        </div>

        {/* Frequently Bought Together */}
        {fbtItems.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[#292a2e]">
            <h3 className="text-white font-bold text-lg mb-6">Frequently Bought Together</h3>
            <div className="bg-[#1a1b1f] border border-[#414755] rounded p-5 flex flex-col lg:flex-row items-center gap-5">
              <div className="flex items-center gap-3 flex-wrap justify-center flex-1">
                {fbtBundle.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <Link to={`/products/${p.slug}`} className="w-24 text-center group">
                      <img src={p.image} alt={p.name} className="w-24 h-24 object-cover rounded bg-[#0d0e12] border border-[#292a2e] mb-1.5" />
                      <span className="text-[10px] text-[#c1c6d7] line-clamp-2 group-hover:text-[#adc6ff]">{p.name}</span>
                      <span className="font-mono text-[11px] text-white font-bold block mt-0.5">${p.price.toFixed(2)}</span>
                    </Link>
                    {i < fbtBundle.length - 1 && <Icon name="add" size={18} className="text-[#8b90a0] shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="text-center lg:text-right lg:border-l lg:border-[#292a2e] lg:pl-5 shrink-0">
                <span className="font-mono text-[10px] text-[#8b90a0] uppercase block">Bundle Total ({fbtBundle.length} items)</span>
                <span className="text-white font-bold text-2xl block my-1">${fbtTotal.toFixed(2)}</span>
                <button
                  onClick={() => fbtBundle.forEach((p) => addToCart(p))}
                  className="px-5 py-2.5 bg-[#007aff] hover:bg-[#0066d6] text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors mx-auto lg:ml-auto"
                >
                  <Icon name="add_shopping_cart" size={15} /> ADD ALL TO CART
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[#292a2e]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-bold text-lg">Related Hardware & Compatible Options</h3>
                <p className="text-[#8b90a0] text-xs mt-0.5">Explore popular items in {product.category}</p>
              </div>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="font-mono text-xs text-[#adc6ff] hover:text-white flex items-center gap-1">
                VIEW ALL <Icon name="chevron_right" size={14} />
              </Link>
            </div>
            <ProductGrid
              products={relatedProducts}
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              wishlistedIds={wishlist}
              columns={4}
            />
          </div>
        )}

      </div>
    </main>
  )
}
