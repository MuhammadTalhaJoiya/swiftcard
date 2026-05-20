import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const outOfStock = product.stock === 0

  return (
    <div className="bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group">
      <Link to={`/product/${product._id}`} className="block shrink-0 overflow-hidden bg-zinc-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-1">
          {product.category}
        </span>

        <Link to={`/product/${product._id}`} className="hover:text-amber-600 transition-colors">
          <h3 className="font-semibold text-zinc-800 leading-snug line-clamp-2 mb-3 text-sm">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-xl font-bold text-zinc-900">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              outOfStock
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : 'bg-amber-500 text-white hover:bg-amber-400'
            }`}
          >
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
