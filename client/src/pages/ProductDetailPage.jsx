import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { productService } from '../services/productService'
import { useCart } from '../context/CartContext'

function SkeletonDetail() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-48 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        <div className="bg-gray-200 rounded-xl aspect-square" />
        <div className="flex flex-col gap-4">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2 mt-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
          </div>
          <div className="h-5 bg-gray-200 rounded w-32 mt-2" />
          <div className="h-12 bg-gray-200 rounded-xl mt-4" />
        </div>
      </div>
    </main>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    productService.getById(id)
      .then(setProduct)
      .catch(() => setError('This product could not be found.'))
      .finally(() => setLoading(false))
  }, [id])

  function handleAddToCart() {
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <SkeletonDetail />

  if (error) return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl px-8 py-10 max-w-sm w-full">
          <svg className="h-10 w-10 text-red-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-red-700 font-medium mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    </main>
  )

  const outOfStock = product.stock === 0
  const lowStock = !outOfStock && product.stock <= 5

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8 flex-wrap">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
        <span>/</span>
        <button
          onClick={() => navigate('/?category=' + encodeURIComponent(product.category))}
          className="hover:text-indigo-600 transition-colors"
        >
          {product.category}
        </button>
        <span>/</span>
        <span className="text-gray-600 font-medium truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">

        {/* Product image */}
        <div className="rounded-xl overflow-hidden bg-gray-100 aspect-square shadow-sm">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product info */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">
            {product.category}
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-3">
            {product.name}
          </h1>

          <p className="text-3xl font-bold text-gray-900 mb-6">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-gray-600 leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Stock indicator */}
          <div className="flex items-center gap-2 mb-8">
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              outOfStock ? 'bg-red-500' : lowStock ? 'bg-amber-400' : 'bg-green-500'
            }`} />
            <span className={`text-sm font-medium ${
              outOfStock ? 'text-red-600' : lowStock ? 'text-amber-600' : 'text-green-600'
            }`}>
              {outOfStock
                ? 'Out of stock'
                : lowStock
                ? `Only ${product.stock} left in stock`
                : `In stock (${product.stock} available)`}
            </span>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`w-full py-3 rounded-xl font-semibold text-base transition-all duration-200 ${
              outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : added
                ? 'bg-green-600 text-white scale-[0.98]'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
            }`}
          >
            {outOfStock ? 'Out of Stock' : added ? '✓ Added to Cart' : 'Add to Cart'}
          </button>

          {added && (
            <Link
              to="/cart"
              className="mt-3 text-center text-sm text-indigo-600 hover:underline"
            >
              View cart →
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
