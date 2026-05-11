import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function CartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-indigo-600 tracking-tight hover:text-indigo-500 transition-colors">
            SwiftCart
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <Link to="/orders" className="hover:text-indigo-600 transition-colors">Orders</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="hover:text-indigo-600 transition-colors">Admin</Link>
            )}
          </div>

          {/* Right side: cart + auth */}
          <div className="flex items-center gap-4">

            {/* Cart */}
            <Link to="/cart" className="relative text-gray-600 hover:text-indigo-600 transition-colors">
              <CartIcon />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-sm text-gray-500">Hi, {user.name ?? user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
