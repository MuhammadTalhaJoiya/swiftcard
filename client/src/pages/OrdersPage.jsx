import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderService } from '../services/orderService'

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

  if (loading) return <p style={{ padding: '1rem' }}>Loading orders...</p>
  if (error) return <p style={{ padding: '1rem', color: 'red' }}>{error}</p>
  if (orders.length === 0) return <p style={{ padding: '1rem' }}>No orders yet.</p>

  return (
    <main style={{ padding: '1rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1>My Orders</h1>
      {orders.map(order => (
        <div key={order._id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
          <p><strong>Order #{order._id}</strong></p>
          <p>Status: {order.status}</p>
          <p>Total: ${order.totalPrice?.toFixed(2)}</p>
          <p>Placed: {new Date(order.createdAt).toLocaleDateString()}</p>
          <Link to={`/orders/${order._id}`}>View Details</Link>
        </div>
      ))}
    </main>
  )
}
