import { cloneElement, useEffect, useRef, useState } from 'react'
import { productService } from '../services/productService'
import { orderService } from '../services/orderService'

const EMPTY_FORM = { name: '', description: '', price: '', category: '', stock: '', imageUrl: '' }
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_STYLES = {
  pending:    'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-amber-100 text-amber-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
}

// Wraps a single input/textarea child, injecting consistent Tailwind classes
function Field({ label, className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {cloneElement(children, {
        className:
          'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
      })}
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState('products')

  // ── Products ──────────────────────────────────────────────────────
  const [products, setProducts]       = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [editingId, setEditingId]     = useState(null)
  const [saving, setSaving]           = useState(false)
  const [formError, setFormError]     = useState(null)
  const formRef = useRef(null)

  // ── Orders ────────────────────────────────────────────────────────
  const [orders, setOrders]             = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState(null)

  useEffect(() => {
    productService.getAll()
      .then(setProducts)
      .finally(() => setLoadingProducts(false))
    orderService.getAll()
      .then(setOrders)
      .finally(() => setLoadingOrders(false))
  }, [])

  // ── Product form ──────────────────────────────────────────────────
  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function handleEdit(product) {
    setEditingId(product._id)
    setForm({
      name:        product.name,
      description: product.description,
      price:       product.price,
      category:    product.category,
      stock:       product.stock,
      imageUrl:    product.imageUrl,
    })
    setFormError(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) }
    try {
      if (editingId) {
        const updated = await productService.update(editingId, payload)
        setProducts(prev => prev.map(p => p._id === editingId ? updated : p))
        setEditingId(null)
      } else {
        const created = await productService.create(payload)
        setProducts(prev => [created, ...prev])
      }
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    try {
      await productService.remove(id)
      setProducts(prev => prev.filter(p => p._id !== id))
      if (editingId === id) handleCancelEdit()
    } catch {
      alert('Failed to delete product.')
    }
  }

  // ── Order status ──────────────────────────────────────────────────
  async function handleStatusChange(orderId, status) {
    setUpdatingOrder(orderId)
    try {
      await orderService.updateStatus(orderId, status)
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o))
    } catch {
      alert('Failed to update order status.')
    } finally {
      setUpdatingOrder(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-8">
        {['products', 'orders'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 -mb-px text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Products tab ────────────────────────────────────────────── */}
      {tab === 'products' && (
        <div className="space-y-10">

          {/* Add / Edit form */}
          <section ref={formRef}>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <Field label="Name">
                <input type="text" required value={form.name} onChange={set('name')} placeholder="Product name" />
              </Field>
              <Field label="Category">
                <input type="text" required value={form.category} onChange={set('category')} placeholder="e.g. Electronics" />
              </Field>
              <Field label="Price ($)">
                <input type="number" required min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" />
              </Field>
              <Field label="Stock">
                <input type="number" required min="0" value={form.stock} onChange={set('stock')} placeholder="0" />
              </Field>
              <Field label="Image URL" className="sm:col-span-2">
                <input type="url" required value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea required rows={3} value={form.description} onChange={set('description')} placeholder="Product description" />
              </Field>

              {formError && (
                <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="sm:col-span-2 flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Products table */}
          <section>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              All Products ({products.length})
            </h2>
            {loadingProducts ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-gray-400">No products yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {products.map(p => (
                      <tr
                        key={p._id}
                        className={`hover:bg-gray-50 transition-colors ${editingId === p._id ? 'bg-indigo-50' : ''}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px] truncate">{p.name}</td>
                        <td className="px-4 py-3 text-gray-500">{p.category}</td>
                        <td className="px-4 py-3 text-gray-700">${p.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-700">{p.stock}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEdit(p)}
                              className="text-xs font-medium text-indigo-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p._id)}
                              className="text-xs font-medium text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Orders tab ──────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <section>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
            All Orders ({orders.length})
          </h2>
          {loadingOrders ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Order ID', 'Customer', 'Date', 'Total', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {orders.map(o => (
                    <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        …{o._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{o.user?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{o.user?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        ${o.totalPrice?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={e => handleStatusChange(o._id, e.target.value)}
                          disabled={updatingOrder === o._id}
                          className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 ${STATUS_STYLES[o.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {ORDER_STATUSES.map(s => (
                            <option key={s} value={s} className="bg-white text-gray-700 font-normal">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
