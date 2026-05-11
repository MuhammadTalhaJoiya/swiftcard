import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const outOfStock = product.stock === 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      <Link to={`/product/${product._id}`} className="block shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-1">
          {product.category}
        </span>

        <Link to={`/product/${product._id}`} className="hover:text-indigo-600 transition-colors">
          <h3 className="font-semibold text-gray-800 leading-snug line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
