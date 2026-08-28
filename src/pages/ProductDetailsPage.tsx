import { useState, useCallback, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Icon, Badge, StockBadge, StarRating, Price, Button, EmptyState } from '../components/ui'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductGrid } from '../components/products/ProductCard'
import { PageSkeleton } from '../components/ui/SkeletonLoader'
import { useShop } from '../context/ShopContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { productService } from '../services/productService'
import { reviewService } from '../services/reviewService'

export function ProductDetailsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { toggleCompare, isInCompare, showToast } = useShop()
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { status: authStatus } = useAuth()

  const [selectedImage, setSelectedImage] = useState<string>('')
  const [mainImgError, setMainImgError] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'specs' | 'overview' | 'reviews'>('specs')
  const [adding, setAdding] = useState(false)

  // Review form state
  const [newReviewTitle, setNewReviewTitle] = useState('')
  const [newReviewContent, setNewReviewContent] = useState('')
  const [newReviewRating, setNewReviewRating] = useState(5)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const productFn = useCallback(() => productService.getBySlug(slug!), [slug])
  const { data: product, loading, error, reload } = useApi(productFn, [slug])

  const reviewsFn = useCallback(
    () => (product ? reviewService.listForProduct(product.id) : Promise.resolve([])),
    [product]
  )
  const { data: reviews, reload: reloadReviews } = useApi(reviewsFn, [product?.id])

  const relatedFn = useCallback(
    () =>
      product?.categorySlug
        ? productService.list({ category: product.categorySlug, limit: 5 })
        : Promise.resolve(null),
    [product?.categorySlug]
  )
  const { data: related } = useApi(relatedFn, [product?.categorySlug])

  // Reset the gallery selection whenever a different product loads
  useEffect(() => {
    setSelectedImage(product?.primaryImage ?? '')
    setMainImgError(false)
    setQuantity(1)
  }, [product?.id, product?.primaryImage])

  if (loading) return <PageSkeleton />

  if (error || !product) {
    return (
      <main className="flex-1 container-max px-4 py-16">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <EmptyState
            icon="search_off"
            title="Product not found"
            message="The hardware model you are looking for may have been moved or discontinued."
            action={
              <Link to="/products">
                <Button variant="primary" size="lg">BROWSE ALL PRODUCTS</Button>
              </Link>
            }
          />
        )}
      </main>
    )
  }

  const gallery = product.images?.length
    ? product.images.map((i) => i.url)
    : product.primaryImage
      ? [product.primaryImage]
      : []
  const isWishlisted = isInWishlist(product.id)
  const comparing = isInCompare(product.id)
  const outOfStock = product.stockStatus === 'out-of-stock'
  const relatedProducts = (related?.data ?? []).filter((p) => p.id !== product.id).slice(0, 4)
  const productReviews = reviews ?? []

  const handleAddToCart = async (thenCheckout = false) => {
    setAdding(true)
    try {
      await addItem(product.id, quantity)
      showToast('Added to cart', 'cart')
      if (thenCheckout) navigate('/checkout')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add to cart', 'info')
    } finally {
      setAdding(false)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewError(null)
    setSubmitting(true)
    try {
      await reviewService.create(product.id, {
        rating: newReviewRating,
        title: newReviewTitle,
        content: newReviewContent,
      })
      setNewReviewTitle('')
      setNewReviewContent('')
      setNewReviewRating(5)
      reloadReviews()
      reload()
      showToast('Your review has been published', 'info')
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Could not submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex-1 w-full pb-16">
      <div className="container-max px-4 md:px-6 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-(--text-secondary) mb-6 flex-wrap">
          <Link to="/" className="hover:text-(--text-primary) transition-colors">HOME</Link>
          <Icon name="chevron_right" size={12} />
          <Link to="/products" className="hover:text-(--text-primary) transition-colors">PRODUCTS</Link>
          <Icon name="chevron_right" size={12} />
          {product.categorySlug && (
            <>
              <Link
                to={`/products?category=${encodeURIComponent(product.categorySlug)}`}
                className="hover:text-(--text-primary) transition-colors uppercase"
              >
                {product.categoryName}
              </Link>
              <Icon name="chevron_right" size={12} />
            </>
          )}
          <span className="text-(--accent-blue) truncate max-w-[200px]">{product.brandName}</span>
        </nav>

        {/* Top Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-(--border-theme)">
          {/* Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {gallery.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
                {gallery.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedImage(img)
                      setMainImgError(false)
                    }}
                    className={`w-16 h-16 rounded-lg border overflow-hidden bg-(--bg-surface-secondary) shrink-0 transition-all cursor-pointer ${
                      selectedImage === img
                        ? 'border-(--accent-blue) ring-1 ring-(--accent-blue)'
                        : 'border-(--border-theme) opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 relative bg-(--bg-surface-secondary) border border-(--border-theme) rounded-xl overflow-hidden flex items-center justify-center p-6 min-h-[340px] sm:min-h-[440px] shadow-sm">
              {selectedImage && !mainImgError ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="max-h-[400px] w-auto object-contain hover:scale-105 transition-transform duration-300"
                  onError={() => setMainImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-(--text-secondary) py-12">
                  <Icon name="memory" size={64} className="text-(--accent-blue)/40 mb-3" />
                  <span className="font-mono text-xs text-(--text-secondary)">HARDWARE SHOWCASE</span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {product.isNew && <Badge variant="primary">NEW ARRIVAL</Badge>}
                {product.discountPercent > 0 && <Badge variant="orange">SAVE {product.discountPercent}%</Badge>}
              </div>
            </div>
          </div>

          {/* Buy Box */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-(--accent-blue) uppercase font-bold tracking-wider">
                  {product.brandName}
                </span>
                <StockBadge status={product.stockStatus} />
              </div>

              <h1 className="text-(--text-primary) font-bold text-xl md:text-2xl leading-snug tracking-tight mb-3">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-(--border-theme) flex-wrap">
                {product.reviewCount > 0 ? (
                  <StarRating rating={product.rating} count={product.reviewCount} size="md" />
                ) : (
                  <span className="font-mono text-[11px] text-(--text-muted)">NO REVIEWS YET</span>
                )}
                <span className="text-(--text-secondary) text-xs">
                  | SKU: <span className="font-mono text-(--text-primary)">{product.sku}</span>
                </span>
              </div>

              <div className="bg-(--bg-surface) p-4 rounded-xl border border-(--border-theme) mb-5">
                <div className="flex items-baseline gap-3 mb-1">
                  <Price
                    price={product.price}
                    previousPrice={product.previousPrice ?? undefined}
                    discount={product.discountPercent || undefined}
                    size="lg"
                  />
                </div>
                <div className="text-[11px] font-mono text-(--text-secondary) flex items-center gap-1.5 mt-1">
                  <Icon name="inventory_2" size={14} className="text-(--accent-blue)" />
                  {outOfStock
                    ? 'Currently unavailable'
                    : `${product.stockAvailable} unit${product.stockAvailable === 1 ? '' : 's'} available`}
                </div>
              </div>

              {/* Key Specs */}
              {product.specs.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {product.specs.slice(0, 4).map((spec) => (
                    <div
                      key={spec.label}
                      className="p-2.5 bg-(--bg-surface-secondary) rounded-lg border border-(--border-theme) text-xs"
                    >
                      <span className="text-(--text-secondary) font-mono text-[10px] block uppercase font-semibold">
                        {spec.label}
                      </span>
                      <span className="text-(--text-primary) font-semibold truncate block mt-0.5">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity + Add to Cart */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <div className="flex items-center justify-between border border-(--border-theme) rounded-xl bg-(--bg-surface-secondary) px-2 py-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Icon name="remove" size={16} />
                  </button>
                  <span className="font-mono text-sm px-4 font-bold text-(--text-primary)">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stockAvailable || 1, q + 1))}
                    disabled={quantity >= product.stockAvailable}
                    className="p-1 text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Icon name="add" size={16} />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={outOfStock || adding}
                  onClick={() => void handleAddToCart()}
                  className="flex-1"
                >
                  <Icon name="add_shopping_cart" size={18} />
                  {outOfStock ? 'Out of Stock' : adding ? 'Adding…' : 'Add to Cart'}
                </Button>

                <button
                  type="button"
                  onClick={() => void toggleWishlist(product.id)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
                    isWishlisted
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      : 'border-(--border-theme) bg-(--bg-surface-secondary) text-(--text-secondary) hover:text-rose-500'
                  }`}
                >
                  <Icon name="favorite" size={20} filled={isWishlisted} />
                </button>
              </div>

              <div className="flex gap-3 mb-4">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  disabled={outOfStock || adding}
                  onClick={() => void handleAddToCart(true)}
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

            <div className="pt-4 border-t border-(--border-theme) space-y-2 text-xs font-sans text-(--text-secondary)">
              <Link to="/shipping-policy" className="flex items-center gap-2 hover:text-(--text-primary) transition-colors">
                <Icon name="local_shipping" size={16} className="text-(--accent-blue)" /> Shipping &amp; Dispatch Details
              </Link>
              <Link to="/terms" className="flex items-center gap-2 hover:text-(--text-primary) transition-colors">
                <Icon name="verified" size={16} className="text-(--color-stock-green)" /> Manufacturer Warranty Terms
              </Link>
              <Link to="/return-policy" className="flex items-center gap-2 hover:text-(--text-primary) transition-colors">
                <Icon name="history" size={16} className="text-(--color-stock-yellow-val)" /> Return &amp; RMA Guidelines
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex border-b border-(--border-theme) gap-6 mb-6">
            {([
              { key: 'specs', label: 'Technical Specifications' },
              { key: 'overview', label: 'Product Overview' },
              { key: 'reviews', label: `Reviews (${product.reviewCount})` },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 font-sans text-xs font-semibold tracking-wider transition-colors relative cursor-pointer ${
                  activeTab === tab.key ? 'text-(--accent-blue)' : 'text-(--text-secondary) hover:text-(--text-primary)'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--accent-blue)" />}
              </button>
            ))}
          </div>

          {/* Specs */}
          {activeTab === 'specs' && (
            <div className="bg-(--bg-surface) rounded-xl border border-(--border-theme) overflow-hidden">
              {product.specs.length > 0 || product.wattage ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <tbody>
                      {product.specs.map((spec, i) => (
                        <tr key={spec.label} className={i % 2 === 0 ? 'bg-(--bg-surface)' : 'bg-(--bg-surface-secondary)'}>
                          <th className="py-3 px-4 font-mono text-xs text-(--text-secondary) font-semibold w-1/3 border-b border-(--border-theme)">
                            {spec.label}
                          </th>
                          <td className="py-3 px-4 text-(--text-primary) font-mono text-xs border-b border-(--border-theme)">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                      {product.wattage !== null && (
                        <tr className="bg-(--bg-surface-secondary)">
                          <th className="py-3 px-4 font-mono text-xs text-(--text-secondary) font-semibold border-b border-(--border-theme)">
                            Estimated Peak Wattage
                          </th>
                          <td className="py-3 px-4 text-(--accent-blue) font-mono text-xs font-bold border-b border-(--border-theme)">
                            {product.wattage} Watts
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-6 text-(--text-secondary) text-xs">
                  No specifications have been published for this product yet.
                </p>
              )}
            </div>
          )}

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="bg-(--bg-surface) p-6 rounded-xl border border-(--border-theme) text-(--text-secondary) leading-relaxed space-y-4">
              {product.description ? (
                <p className="text-base text-(--text-primary) font-medium">{product.description}</p>
              ) : (
                <p className="text-xs">No description has been published for this product yet.</p>
              )}
              {!!product.tags?.length && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-(--bg-surface-secondary) border border-(--border-theme) rounded-md text-xs font-mono text-(--accent-blue)"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews — real records only */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {productReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productReviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-(--bg-surface) rounded-xl border border-(--border-theme)">
                      <div className="flex items-center justify-between mb-2">
                        <StarRating rating={rev.rating} showCount={false} />
                        <span className="text-[11px] font-mono text-(--text-secondary)">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-(--text-primary) font-bold text-sm mb-1">{rev.title}</h4>
                      <p className="text-(--text-secondary) text-xs leading-relaxed mb-3">{rev.content}</p>
                      <div
                        className={`text-[11px] font-mono flex items-center gap-1 font-semibold ${
                          rev.verifiedPurchase ? 'text-(--color-stock-green)' : 'text-(--text-secondary)'
                        }`}
                      >
                        {rev.verifiedPurchase && <Icon name="verified" size={12} />}
                        {rev.authorName}
                        {rev.verifiedPurchase ? ' · Verified Purchase' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="rate_review"
                  title="No reviews yet"
                  message="Be the first to review this product."
                />
              )}

              {/* Review form — authenticated customers only */}
              <div className="p-6 bg-(--bg-surface) rounded-xl border border-(--border-theme)">
                <h3 className="text-(--text-primary) font-bold text-base mb-3">Write a Customer Review</h3>
                {authStatus !== 'authed' ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <p className="text-(--text-secondary) text-xs">
                      Sign in to your account to publish a review for this product.
                    </p>
                    <Link to={`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`}>
                      <Button variant="primary" size="md">SIGN IN TO REVIEW</Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {reviewError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-mono">
                        {reviewError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="review-title" className="text-xs font-mono text-(--text-secondary) block mb-1 uppercase font-semibold">
                          Review Title
                        </label>
                        <input
                          id="review-title"
                          type="text"
                          required
                          minLength={2}
                          maxLength={150}
                          value={newReviewTitle}
                          onChange={(e) => setNewReviewTitle(e.target.value)}
                          placeholder="Brief summary of your experience"
                          className="w-full bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg px-3 py-2 text-xs text-(--text-primary) focus:outline-none focus:border-(--accent-blue)"
                        />
                      </div>
                      <div>
                        <label htmlFor="review-rating" className="text-xs font-mono text-(--text-secondary) block mb-1 uppercase font-semibold">
                          Rating
                        </label>
                        <select
                          id="review-rating"
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="w-full bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg px-3 py-2 text-xs text-(--text-primary) focus:outline-none focus:border-(--accent-blue)"
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
                      <label htmlFor="review-content" className="text-xs font-mono text-(--text-secondary) block mb-1 uppercase font-semibold">
                        Detailed Feedback
                      </label>
                      <textarea
                        id="review-content"
                        required
                        minLength={5}
                        maxLength={2000}
                        rows={3}
                        value={newReviewContent}
                        onChange={(e) => setNewReviewContent(e.target.value)}
                        placeholder="Describe performance, noise levels, temps, and installation…"
                        className="w-full bg-(--bg-surface-secondary) border border-(--border-theme) rounded-lg px-3 py-2 text-xs text-(--text-primary) focus:outline-none focus:border-(--accent-blue)"
                      />
                    </div>
                    <Button type="submit" variant="primary" size="md" disabled={submitting}>
                      {submitting ? 'SUBMITTING…' : 'SUBMIT REVIEW'}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-(--border-theme)">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-(--text-primary) font-bold text-lg">Related Hardware</h3>
                <p className="text-(--text-secondary) text-xs mt-0.5">More items in {product.categoryName}</p>
              </div>
              {product.categorySlug && (
                <Link
                  to={`/products?category=${encodeURIComponent(product.categorySlug)}`}
                  className="font-sans text-xs font-semibold text-(--accent-blue) hover:underline flex items-center gap-1"
                >
                  View All <Icon name="chevron_right" size={14} />
                </Link>
              )}
            </div>
            <ProductGrid products={relatedProducts} columns={4} />
          </div>
        )}
      </div>
    </main>
  )
}
