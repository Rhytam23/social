import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Icon, Badge, StockBadge, StarRating, Price, Button } from '../components/ui'
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

  const relatedProducts = useMemo(() => {
    if (!product) return []
    return products
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 4)
  }, [products, product])

  const fbtItems = useMemo(() => {
    if (!product) return []
    return products
      .filter((p) => p.id !== product.id && p.category !== product.category && p.category !== 'Gaming PCs')
      .slice(0, 2)
  }, [products, product])

  if (!product) {
    return (
      <main className="flex-1 container-max px-4 py-16 text-center">
        <Icon name="search_off" size={48} className="text-[var(--text-secondary)] mb-4" />
        <h1 className="text-[var(--text-primary)] font-bold text-2xl mb-2">Product Not Found</h1>
        <p className="text-[var(--text-secondary)] mb-6">The hardware model you are looking for may have been moved or discontinued.</p>
        <Link to="/products">
          <Button variant="primary" size="lg">
            Browse All Products
          </Button>
        </Link>
      </main>
    )
  }

  const gallery = product.gallery || [product.image]
  const isWishlisted = isInWishlist(product.id)
  const comparing = isInCompare(product.id)

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
        <nav className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] mb-6 flex-wrap">
          <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <Link to="/products" className="hover:text-[var(--text-primary)] transition-colors">PRODUCTS</Link>
          <Icon name="chevron_right" size={12} />
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-[var(--text-primary)] transition-colors uppercase">
            {product.category}
          </Link>
          <Icon name="chevron_right" size={12} />
          <span className="text-[var(--accent-blue)] truncate max-w-[200px]">{product.brand}</span>
        </nav>

        {/* Top Product Section (Gallery + Purchase Info) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-[var(--border-theme)]">

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
                    className={`w-16 h-16 rounded-lg border overflow-hidden bg-[var(--bg-surface-secondary)] shrink-0 transition-all cursor-pointer ${
                      (selectedImage || product.image) === img ? 'border-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]' : 'border-[var(--border-theme)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Display */}
            <div className="flex-1 relative bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-xl overflow-hidden flex items-center justify-center p-6 min-h-[340px] sm:min-h-[440px] shadow-sm">
              {!mainImgError ? (
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  className="max-h-[400px] w-auto object-contain hover:scale-105 transition-transform duration-300"
                  onError={() => setMainImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[var(--text-secondary)] py-12">
                  <Icon name="memory" size={64} className="text-[var(--accent-blue)]/40 mb-3" />
                  <span className="font-mono text-xs text-[var(--text-secondary)]">HARDWARE SHOWCASE</span>
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
                <span className="font-mono text-xs text-[var(--accent-blue)] uppercase font-bold tracking-wider">{product.brand}</span>
                <StockBadge status={product.stockStatus} />
              </div>

              {/* Title */}
              <h1 className="text-[var(--text-primary)] font-bold text-xl md:text-2xl leading-snug tracking-tight mb-3">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border-theme)]">
                <StarRating rating={product.rating} count={product.reviewCount} size="md" />
                <span className="text-[var(--text-secondary)] text-xs">| SKU: <span className="font-mono text-[var(--text-primary)]">{product.sku || product.id.toUpperCase()}</span></span>
              </div>

              {/* Pricing Box */}
              <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-theme)] mb-5">
                <div className="flex items-baseline gap-3 mb-1">
                  <Price price={product.price} previousPrice={product.previousPrice} discount={product.discount} size="lg" />
                </div>
                <div className="text-[11px] font-mono text-[var(--color-stock-green)] flex items-center gap-1.5 mt-1 font-semibold">
                  <Icon name="check_circle" size={14} /> Available for instant dispatch & tracking
                </div>
              </div>

              {/* Key Specs Quick Pill Grid */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {product.specifications.slice(0, 4).map((spec) => (
                  <div key={spec.label} className="p-2.5 bg-[var(--bg-surface-secondary)] rounded-lg border border-[var(--border-theme)] text-xs">
                    <span className="text-[var(--text-secondary)] font-mono text-[10px] block uppercase font-semibold">{spec.label}</span>
                    <span className="text-[var(--text-primary)] font-semibold truncate block mt-0.5">{spec.value}</span>
                  </div>
                ))}
              </div>

              {/* Quantity + Add to Cart Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                {/* Quantity input */}
                <div className="flex items-center justify-between border border-[var(--border-theme)] rounded-xl bg-[var(--bg-surface-secondary)] px-2 py-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Icon name="remove" size={16} />
                  </button>
                  <span className="font-mono text-sm px-4 font-bold text-[var(--text-primary)]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Icon name="add" size={16} />
                  </button>
                </div>

                {/* Primary Add to Cart */}
                <Button
                  variant="primary"
                  size="lg"
                  disabled={product.stockStatus === 'out-of-stock'}
                  onClick={() => addToCart(product, quantity)}
                  className="flex-1"
                >
                  <Icon name="add_shopping_cart" size={18} />
                  Add to Cart
                </Button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
                    isWishlisted ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'border-[var(--border-theme)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] hover:text-rose-500'
                  }`}
                >
                  <Icon name="favorite" size={20} filled={isWishlisted} />
                </button>
              </div>

              {/* Direct Buy Now + Compare */}
              <div className="flex gap-3 mb-4">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    addToCart(product, quantity)
                    navigate('/checkout')
                  }}
                >
                  Buy Now
                </Button>
                <Button
                  variant={comparing ? 'outline' : 'secondary'}
                  size="md"
                  onClick={() => toggleCompare(product.id)}
                >
                  <Icon name="balance" size={16} /> {comparing ? 'Comparing' : 'Compare'}
                </Button>
              </div>
            </div>

            {/* Guarantee / Delivery Checklist */}
            <div className="pt-4 border-t border-[var(--border-theme)] space-y-2 text-xs font-sans text-[var(--text-secondary)]">
              <Link to="/shipping-policy" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <Icon name="local_shipping" size={16} className="text-[var(--accent-blue)]" /> Express Shipping & Dispatch Details
              </Link>
              <Link to="/terms" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <Icon name="verified" size={16} className="text-[var(--color-stock-green)]" /> Official Manufacturer Warranty Terms
              </Link>
              <Link to="/return-policy" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <Icon name="history" size={16} className="text-[var(--color-stock-yellow-val)]" /> Store Return & RMA Guidelines
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Specs, Overview, Reviews */}
        <div className="mt-12">
          <div className="flex border-b border-[var(--border-theme)] gap-6 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`pb-3 font-sans text-xs font-semibold tracking-wider transition-colors relative cursor-pointer ${
                activeTab === 'specs' ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Technical Specifications
              {activeTab === 'specs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-blue)]" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-3 font-sans text-xs font-semibold tracking-wider transition-colors relative cursor-pointer ${
                activeTab === 'overview' ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Product Overview
              {activeTab === 'overview' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-blue)]" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 font-sans text-xs font-semibold tracking-wider transition-colors relative cursor-pointer ${
                activeTab === 'reviews' ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Reviews ({product.reviewCount})
              {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-blue)]" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`pb-3 font-sans text-xs font-semibold tracking-wider transition-colors relative cursor-pointer ${
                activeTab === 'questions' ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Q&amp;A
              {activeTab === 'questions' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-blue)]" />}
            </button>
          </div>

          {/* Tab 1: Full Technical Specifications Table */}
          {activeTab === 'specs' && (
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-theme)] overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  {product.specifications.map((spec, i) => (
                    <tr key={spec.label} className={i % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-surface-secondary)]'}>
                      <th className="py-3 px-4 font-mono text-xs text-[var(--text-secondary)] font-semibold w-1/3 border-b border-[var(--border-theme)]">
                        {spec.label}
                      </th>
                      <td className="py-3 px-4 text-[var(--text-primary)] font-mono text-xs border-b border-[var(--border-theme)]">
                        {spec.value}
                      </td>
                    </tr>
                  ))}
                  {product.wattage !== undefined && (
                    <tr className="bg-[var(--bg-surface-secondary)]">
                      <th className="py-3 px-4 font-mono text-xs text-[var(--text-secondary)] font-semibold border-b border-[var(--border-theme)]">
                        Estimated Peak Wattage
                      </th>
                      <td className="py-3 px-4 text-[var(--accent-blue)] font-mono text-xs font-bold border-b border-[var(--border-theme)]">
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
            <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-theme)] text-[var(--text-secondary)] leading-relaxed space-y-4">
              <p className="text-base text-[var(--text-primary)] font-medium">
                {product.description || `${product.name} is built for gamers and professionals demanding high performance and thermal reliability.`}
              </p>
              <p>
                Engineered with high-grade components, premium PCB traces, and industrial heat dissipators to maintain sustained boost clocks during extreme workloads.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {product.tags?.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-md text-xs font-mono text-[var(--accent-blue)]">
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
                  <div key={rev.id} className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-theme)]">
                    <div className="flex items-center justify-between mb-2">
                      <StarRating rating={rev.rating} showCount={false} />
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">{rev.date}</span>
                    </div>
                    <h4 className="text-[var(--text-primary)] font-bold text-sm mb-1">{rev.title}</h4>
                    <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-3">{rev.content}</p>
                    <div className="text-[11px] font-mono text-[var(--color-stock-green)] flex items-center gap-1 font-semibold">
                      <Icon name="verified" size={12} /> {rev.author}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add a Review Form */}
              <div className="p-6 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-theme)]">
                <h3 className="text-[var(--text-primary)] font-bold text-base mb-3">Write a Customer Review</h3>
                {reviewSubmitted ? (
                  <div className="p-4 bg-[var(--color-stock-green)]/10 border border-[var(--color-stock-green)]/20 rounded-lg text-[var(--color-stock-green)] text-xs font-mono">
                    Thank you! Your verified review has been submitted for moderation.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold">Your Name</label>
                        <input
                          type="text"
                          required
                          value={newReviewAuthor}
                          onChange={(e) => setNewReviewAuthor(e.target.value)}
                          placeholder="e.g. Sarah J."
                          className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold">Rating</label>
                        <select
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
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
                      <label className="text-xs font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold">Review Title</label>
                      <input
                        type="text"
                        value={newReviewTitle}
                        onChange={(e) => setNewReviewTitle(e.target.value)}
                        placeholder="Brief summary of your experience"
                        className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[var(--text-secondary)] block mb-1 uppercase font-semibold">Detailed Feedback</label>
                      <textarea
                        required
                        rows={3}
                        value={newReviewContent}
                        onChange={(e) => setNewReviewContent(e.target.value)}
                        placeholder="Describe performance, noise levels, temps, and installation..."
                        className="w-full bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                      />
                    </div>
                    <Button type="submit" variant="primary" size="md">
                      Submit Review
                    </Button>
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
                <div key={i} className="p-4 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-theme)]">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-mono text-xs text-[var(--accent-blue)] font-bold shrink-0">Q:</span>
                    <p className="text-[var(--text-primary)] text-sm font-medium">{item.q}</p>
                  </div>
                  <div className="flex items-start gap-2 pl-1">
                    <span className="font-mono text-xs text-[var(--color-stock-green)] font-bold shrink-0">A:</span>
                    <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{item.a}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[var(--border-theme)] text-[11px] font-mono text-[var(--text-secondary)]">
                    <span>{item.by} · {item.when}</span>
                    <span className="flex items-center gap-1 ml-auto"><Icon name="thumb_up" size={13} /> {item.votes} helpful</span>
                  </div>
                </div>
              ))}
              <div className="p-5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-theme)] flex flex-col sm:flex-row items-center gap-3 justify-between">
                <span className="text-[var(--text-primary)] text-sm">Have a question about this product?</span>
                <Button variant="primary" size="md">
                  Ask a Question
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Frequently Bought Together */}
        {fbtItems.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[var(--border-theme)]">
            <h3 className="text-[var(--text-primary)] font-bold text-lg mb-6">Frequently Bought Together</h3>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-theme)] rounded-xl p-5 flex flex-col lg:flex-row items-center gap-5">
              <div className="flex items-center gap-3 flex-wrap justify-center flex-1">
                {fbtBundle.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <Link to={`/products/${p.slug}`} className="w-24 text-center group">
                      <img src={p.image} alt={p.name} className="w-24 h-24 object-cover rounded-lg bg-[var(--bg-surface-secondary)] border border-[var(--border-theme)] mb-1.5" />
                      <span className="text-[10px] text-[var(--text-secondary)] line-clamp-2 group-hover:text-[var(--accent-blue)]">{p.name}</span>
                      <span className="font-mono text-[11px] text-[var(--text-primary)] font-bold block mt-0.5">${p.price.toFixed(2)}</span>
                    </Link>
                    {i < fbtBundle.length - 1 && <Icon name="add" size={18} className="text-[var(--text-secondary)] shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="text-center lg:text-right lg:border-l lg:border-[var(--border-theme)] lg:pl-5 shrink-0">
                <span className="font-mono text-[10px] text-[var(--text-secondary)] uppercase block font-semibold">Bundle Total ({fbtBundle.length} items)</span>
                <span className="text-[var(--text-primary)] font-bold text-2xl block my-1">${fbtTotal.toFixed(2)}</span>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => fbtBundle.forEach((p) => addToCart(p))}
                  className="mx-auto lg:ml-auto"
                >
                  <Icon name="add_shopping_cart" size={15} /> Add All to Cart
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-[var(--border-theme)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[var(--text-primary)] font-bold text-lg">Related Hardware & Compatible Options</h3>
                <p className="text-[var(--text-secondary)] text-xs mt-0.5">Explore popular items in {product.category}</p>
              </div>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="font-sans text-xs font-semibold text-[var(--accent-blue)] hover:underline flex items-center gap-1">
                View All <Icon name="chevron_right" size={14} />
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
