import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderService } from '../services/orderService'

const STATUS_STYLES = {
  pending:    'bg-zinc-100 text-zinc-600',
  processing: 'bg-blue-50 text-blue-700',
  shipped:    'bg-amber-50 text-amber-700',
  delivered:  'bg-emerald-50 text-emerald-700',
  cancelled:  'bg-red-50 text-red-600',
}

function SkeletonOrder() {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-4 bg-zinc-200 rounded w-32" />
        <div className="h-5 bg-zinc-200 rounded w-20" />
      </div>
      <div className="h-3 bg-zinc-200 rounded w-24 mb-3" />
      <div className="flex justify-between">
        <div className="h-4 bg-zinc-200 rounded w-20" />
        <div className="h-4 bg-zinc-200 rounded w-16" />
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    orderService.getMyOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-8 tracking-tight">My Orders</h1>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonOrder key={i} />)}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
          <svg className="h-14 w-14 mb-4 text-zinc-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-semibold text-zinc-600 mb-1">No orders yet</p>
          <p className="text-sm text-zinc-400 mb-6">Your order history will appear here.</p>
          <Link
            to="/"
            className="bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order._id}
              className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs font-mono text-zinc-400">
                    Order #{order._id.slice(-10).toUpperCase()}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                  {order.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                  {order.orderItems?.length ?? 0} {order.orderItems?.length === 1 ? 'item' : 'items'}
                </p>
                <p className="text-base font-bold text-zinc-900">
                  ${order.totalPrice?.toFixed(2)}
                </p>
              </div>

              {order.orderItems?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100">
                  <p className="text-xs text-zinc-400 line-clamp-1">
                    {order.orderItems.map(i => i.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
