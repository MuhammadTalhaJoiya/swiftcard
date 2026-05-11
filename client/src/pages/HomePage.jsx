import { useEffect, useMemo, useState } from 'react'
import { productService } from '../services/productService'
import ProductCard from '../components/ProductCard'

function SkeletonCard() {
  return <div className="bg-gray-100 rounded-xl h-72 animate-pulse" />
}

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    productService.getAll()
      .then(setProducts)
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(
    () => [...new Set(products.map(p => p.category))].sort(),
    [products]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter(p => {
      const matchesName = p.name.toLowerCase().includes(q)
      const matchesCategory = category === '' || p.category === category
      return matchesName && matchesCategory
    })
  }, [products, search, category])

  function clearFilters() {
    setSearch('')
    setCategory('')
  }

  const isFiltering = search !== '' || category !== ''

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          disabled={loading}
          className="sm:w-48 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Status row */}
      {!loading && !error && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            {category && <> in <span className="font-medium text-gray-700">"{category}"</span></>}
            {search && <> matching <span className="font-medium text-gray-700">"{search}"</span></>}
          </p>
          {isFiltering && (
            <button onClick={clearFilters} className="text-sm text-indigo-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Product grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="h-12 w-12 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <p className="text-lg font-medium">No products found</p>
          {isFiltering && (
            <button onClick={clearFilters} className="mt-2 text-sm text-indigo-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}

    </main>
  )
}
