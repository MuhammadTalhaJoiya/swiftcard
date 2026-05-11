import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { cartService } from '../services/cartService'
import { orderService } from '../services/orderService'

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <svg className="h-16 w-16 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p className="text-xl font-semibold text-gray-700 mb-1">Your cart is empty</p>
      <p className="text-sm text-gray-400 mb-8">Looks like you haven't added anything yet.</p>
      <Link
        to="/"
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  )
}

function QtyButton({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
    >
      {children}
    </button>
  )
}

export default function CartPage() {
  const { items, total, itemCount, removeFromCart, updateQty, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [placing, setPlacing] = useState(false)
  const [orderError, setOrderError] = useState(null)

  // Mirror the server's pricing logic exactly
  const shipping = total > 0 ? (total > 100 ? 0 : 10) : 0
  const tax = parseFloat((total * 0.15).toFixed(2))
  const grandTotal = parseFloat((total + shipping + tax).toFixed(2))

  async function handlePlaceOrder() {
    if (!user) {
      navigate('/login')
      return
    }
    setPlacing(true)
    setOrderError(null)
    try {
      // Sync local cart state to the server before creating the order,
      // because the order controller reads from the server-side Cart model.
      await cartService.clear()
      await Promise.all(items.map(item => cartService.addItem(item._id, item.qty)))
      await orderService.create({ paymentMethod: 'Credit Card', shippingAddress: {} })
      clearCart()
      navigate('/orders')
    } catch (err) {
      setOrderError(err.response?.data?.message ?? 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyCart />
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Shopping Cart
        <span className="ml-2 text-base font-normal text-gray-400">
          ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </span>
      </h1>

      <div className="lg:grid lg:grid-cols-3 lg:gap-10 space-y-8 lg:space-y-0">

        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div
              key={item._id}
              className="flex gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              {/* Image */}
              <Link to={`/product/${item._id}`} className="shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                />
              </Link>

              {/* Name + price */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item._id}`}
                  className="font-medium text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2 text-sm leading-snug"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-gray-400 mt-0.5">${item.price.toFixed(2)} each</p>

                {/* Qty stepper */}
                <div className="flex items-center gap-2 mt-3">
                  <QtyButton onClick={() => updateQty(item._id, item.qty - 1)}>−</QtyButton>
                  <span className="w-6 text-center text-sm font-medium text-gray-700">
                    {item.qty}
                  </span>
                  <QtyButton onClick={() => updateQty(item._id, item.qty + 1)}>+</QtyButton>
                </div>
              </div>

              {/* Subtotal + remove */}
              <div className="flex flex-col items-end justify-between shrink-0">
                <span className="font-semibold text-gray-900">
                  ${(item.price * item.qty).toFixed(2)}
                </span>
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors mt-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {shipping === 0
                    ? <span className="text-green-600 font-medium">Free</span>
                    : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (15%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400 pt-1">
                  Free shipping on orders over $100
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {orderError && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {orderError}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="mt-5 w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {placing
                ? 'Placing Order…'
                : user
                ? 'Place Order'
                : 'Sign in to Checkout'}
            </button>

            <Link
              to="/"
              className="mt-3 block text-center text-sm text-gray-400 hover:text-indigo-600 transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
