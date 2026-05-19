import { cloneElement, useEffect, useRef, useState } from 'react'
import { productService } from '../services/productService'
import { orderService } from '../services/orderService'
import { analyticsService } from '../services/analyticsService'
import { aiService } from '../services/aiService'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts'

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

// ── Sidebar item helper ──────────────────────────────────────────
function SidebarItem({ label, section, activeSection, setActiveSection }) {
  const icons = { products: '📦', orders: '📋', analytics: '📊', aitools: '🤖' }
  const isActive = activeSection === section
  return (
    <button
      onClick={() => setActiveSection(section)}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
        isActive ? 'bg-indigo-900 font-semibold' : 'hover:bg-indigo-600'
      }`}
    >
      <span>{icons[section]}</span>
      {label}
    </button>
  )
}

// ── Analytics Panel ──────────────────────────────────────────────
const STATUS_COLORS = {
  pending: '#6366f1',
  processing: '#3b82f6',
  shipped: '#f59e0b',
  delivered: '#10b981',
  cancelled: '#ef4444',
}
const PIE_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444']

function AnalyticsPanel() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [insights, setInsights] = useState('')
  const [insightsLoading, setInsightsLoading] = useState(false)
  const insightsRef = useRef(null)

  useEffect(() => {
    analyticsService.getMetrics()
      .then(setMetrics)
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  const handleInsights = async () => {
    setInsightsLoading(true)
    try {
      const result = await analyticsService.getInsights(metrics)
      setInsights(result.insights)
      setTimeout(() => insightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (err) {
      const msg = err.response?.data?.message
      setInsights(msg || 'Failed to generate insights. Please try again.')
    } finally {
      setInsightsLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading analytics...</div>
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>

  const { summary, revenueByDay, ordersByStatus, topProducts } = metrics

  const pieData = ordersByStatus.map((s) => ({ name: s._id, value: s.count }))
  const barData = topProducts.map((p) => ({ name: p._id.length > 16 ? p._id.slice(0, 16) + '…' : p._id, revenue: parseFloat(p.totalRevenue.toFixed(2)) }))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Sales Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${Number(summary.totalRevenue).toFixed(2)}` },
          { label: 'Total Orders', value: summary.totalOrders },
          { label: 'Total Products', value: summary.totalProducts },
          { label: 'Total Customers', value: summary.totalCustomers },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Line Chart */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue — Last 30 Days</h3>
        {revenueByDay.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No order data in the last 30 days</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie + Bar side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Orders by Status</h3>
          {pieData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Products by Revenue</h3>
          {barData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div ref={insightsRef} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">AI Business Insights</h3>
          <button
            onClick={handleInsights}
            disabled={insightsLoading}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {insightsLoading ? 'Generating...' : 'Generate AI Insights'}
          </button>
        </div>
        {insights ? (
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed">
            {insights.split('\n').filter(l => l.trim()).map((line, i) => {
              const isBullet = /^[\*\-]\s/.test(line)
              const content = isBullet ? line.replace(/^[\*\-]\s/, '') : line
              const parts = content.split(/\*\*(.*?)\*\*/g)
              const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)
              return isBullet
                ? <li key={i} className="flex gap-2"><span className="text-indigo-500 mt-0.5">•</span><span>{rendered}</span></li>
                : <li key={i} className="text-gray-500 list-none">{rendered}</li>
            })}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">Click the button to generate AI-powered insights from your store data.</p>
        )}
      </div>
    </div>
  )
}

// ── AI Tools Panel ───────────────────────────────────────────────
function AIToolsPanel() {
  // Chatbot state
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  // Description generator state
  const [descName, setDescName] = useState('')
  const [descFeatures, setDescFeatures] = useState('')
  const [descResult, setDescResult] = useState(null)
  const [descLoading, setDescLoading] = useState(false)

  // Invoice OCR state
  const [invoiceFile, setInvoiceFile] = useState(null)
  const [invoiceResult, setInvoiceResult] = useState(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceError, setInvoiceError] = useState(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const result = await aiService.chat(userMsg.content, messages)
      setMessages([...newMessages, { role: 'assistant', content: result.reply }])
    } catch (err) {
      const msg = err.response?.data?.message || 'Sorry, something went wrong. Please try again.'
      setMessages([...newMessages, { role: 'assistant', content: msg }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleDescGenerate = async () => {
    if (!descName.trim() || descLoading) return
    setDescLoading(true)
    setDescResult(null)
    try {
      const result = await aiService.generateDescription(descName, descFeatures)
      setDescResult(result)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate. Please try again.'
      setDescResult({ description: msg, summary: '' })
    } finally {
      setDescLoading(false)
    }
  }

  const handleInvoiceAnalyze = async () => {
    if (!invoiceFile || invoiceLoading) return
    setInvoiceLoading(true)
    setInvoiceResult(null)
    setInvoiceError(null)
    try {
      const formData = new FormData()
      formData.append('invoice', invoiceFile)
      const result = await aiService.invoiceOcr(formData)
      setInvoiceResult(result)
    } catch (err) {
      setInvoiceError(err.response?.data?.message || 'Failed to analyze invoice. Check your OCR API key.')
    } finally {
      setInvoiceLoading(false)
    }
  }

  const copyToClipboard = (text) => navigator.clipboard.writeText(text)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">AI Tools</h2>

      {/* Chatbot */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Business Assistant Chatbot</h3>
          <p className="text-xs text-gray-400 mt-0.5">Ask questions about your store data</p>
        </div>
        <div className="h-72 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-gray-400 text-sm text-center pt-8">
              Try: "What are my top products?" or "Summarize sales this month"
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-indigo-100 text-indigo-900 rounded-l-xl rounded-tr-xl'
                  : 'bg-gray-100 text-gray-800 rounded-r-xl rounded-tl-xl'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 text-sm px-3 py-2 rounded-r-xl rounded-tl-xl">
                Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-3 border-t border-gray-100 flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
            placeholder="Ask about your store..."
            disabled={chatLoading}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
          />
          <button
            onClick={handleChatSend}
            disabled={chatLoading || !chatInput.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Product Description Generator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Product Description Generator</h3>
          <p className="text-xs text-gray-400 mt-0.5">Generate SEO-friendly descriptions with AI</p>
        </div>
        <div className="p-4 space-y-3">
          <input
            value={descName}
            onChange={(e) => setDescName(e.target.value)}
            placeholder="Product name (e.g. Wireless Headphones)"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <textarea
            value={descFeatures}
            onChange={(e) => setDescFeatures(e.target.value)}
            placeholder="Key features (e.g. noise cancelling, 30hr battery, USB-C charging)"
            rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <button
            onClick={handleDescGenerate}
            disabled={descLoading || !descName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {descLoading ? 'Generating...' : 'Generate Description'}
          </button>
          {descResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="border border-gray-200 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">SEO Description</span>
                  <button onClick={() => copyToClipboard(descResult.description)} className="text-xs text-indigo-600 hover:underline">Copy</button>
                </div>
                <p className="text-sm text-gray-700">{descResult.description}</p>
              </div>
              <div className="border border-gray-200 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Marketing Summary</span>
                  <button onClick={() => copyToClipboard(descResult.summary)} className="text-xs text-indigo-600 hover:underline">Copy</button>
                </div>
                <p className="text-sm text-gray-700">{descResult.summary}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice OCR */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Invoice OCR + AI Summary</h3>
          <p className="text-xs text-gray-400 mt-0.5">Upload an invoice image or PDF to extract and summarize</p>
        </div>
        <div className="p-4 space-y-3">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => { setInvoiceFile(e.target.files[0]); setInvoiceResult(null); setInvoiceError(null) }}
            className="text-sm text-gray-600"
          />
          <button
            onClick={handleInvoiceAnalyze}
            disabled={invoiceLoading || !invoiceFile}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {invoiceLoading ? 'Extracting text...' : 'Analyze Invoice'}
          </button>
          {invoiceError && <p className="text-red-500 text-sm">{invoiceError}</p>}
          {invoiceResult && (
            <div className="border border-gray-200 rounded p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Vendor:</span> <span className="font-medium">{invoiceResult.summary.vendor}</span></div>
                <div><span className="text-gray-500">Total:</span> <span className="font-medium">{invoiceResult.summary.totalAmount}</span></div>
                <div><span className="text-gray-500">Date:</span> <span className="font-medium">{invoiceResult.summary.date}</span></div>
              </div>
              {invoiceResult.summary.lineItems?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Line Items</p>
                  <table className="w-full text-sm">
                    <tbody>
                      {invoiceResult.summary.lineItems.map((item, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-1 text-gray-700">{item.description}</td>
                          <td className="py-1 text-right text-gray-700">{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {invoiceResult.summary.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {invoiceResult.summary.categories.map((cat, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{cat}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main AdminPage ───────────────────────────────────────────────
export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('products')

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

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-indigo-700 text-white flex flex-col shrink-0">
        <div className="p-4 font-bold text-lg border-b border-indigo-600">SwiftCard Admin</div>
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-xs text-indigo-300 uppercase tracking-wider px-2 pt-3 pb-1">Manage</p>
          <SidebarItem label="Products" section="products" activeSection={activeSection} setActiveSection={setActiveSection} />
          <SidebarItem label="Orders" section="orders" activeSection={activeSection} setActiveSection={setActiveSection} />
          <p className="text-xs text-indigo-300 uppercase tracking-wider px-2 pt-3 pb-1">Intelligence</p>
          <SidebarItem label="Analytics" section="analytics" activeSection={activeSection} setActiveSection={setActiveSection} />
          <SidebarItem label="AI Tools" section="aitools" activeSection={activeSection} setActiveSection={setActiveSection} />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {activeSection === 'products' && (
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

        {activeSection === 'orders' && (
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

        {activeSection === 'analytics' && <AnalyticsPanel />}
        {activeSection === 'aitools' && <AIToolsPanel />}
      </main>
    </div>
  )
}
