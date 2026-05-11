import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">SwiftCard</span>
            </div>
            <p className="text-sm leading-relaxed">
              Your one-stop shop for quality products delivered fast. Shop smarter, live better.
            </p>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">My Cart</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Admin Panel</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>&copy; {new Date().getFullYear()} SwiftCard. All rights reserved.</p>
          <p>Built with React &amp; Node.js</p>
        </div>
      </div>
    </footer>
  )
}
