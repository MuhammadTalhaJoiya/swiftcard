const OpenAI = require('openai')
const axios = require('axios')
const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

const MODEL = 'gemini-2.5-flash-lite'

const withRetry = async (fn, retries = 1, delayMs = 2000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (err.status === 429 && i < retries) {
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      throw err
    }
  }
}

const generateInsights = async (req, res, next) => {
  try {
    const { summary, ordersByStatus, topProducts } = req.body
    const slim = { summary, ordersByStatus, topProducts }
    const response = await withRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a business analyst for a small e-commerce store. Based on this data, write exactly 5 concise bullet points covering trends, underperformers, and quick wins. Each bullet must be a complete sentence. Be specific with numbers.\n\nData: ${JSON.stringify(slim)}`,
          },
        ],
      })
    )
    res.json({ insights: response.choices[0].message.content })
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ message: 'AI service is rate limited. Please wait a minute and try again.' })
    }
    next(err)
  }
}

const getLiveContext = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const todayStr = new Date().toISOString().split('T')[0]

  const [revenueByDay, ordersByStatus, topProducts, recentOrders, [orderStats, productCount, userCount]] =
    await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.name',
            totalQty: { $sum: '$orderItems.qty' },
            totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
      ]),
      Order.find({}).sort({ createdAt: -1 }).limit(10)
        .select('totalPrice status createdAt orderItems').lean(),
      Promise.all([
        Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } }]),
        Product.countDocuments(),
        User.countDocuments({ role: 'user' }),
      ]),
    ])

  const recentSummary = recentOrders.map((o) => ({
    date: new Date(o.createdAt).toISOString().split('T')[0],
    total: o.totalPrice,
    status: o.status,
    itemCount: o.orderItems.length,
  }))

  return `Today's Date: ${todayStr}

Store Summary (all-time):
- Total Revenue: $${(orderStats[0]?.total || 0).toFixed(2)}
- Total Orders: ${orderStats[0]?.count || 0}
- Total Products: ${productCount}
- Total Customers: ${userCount}
- Orders by Status: ${JSON.stringify(ordersByStatus)}

Top Products (last 30 days): ${JSON.stringify(topProducts)}
Revenue by Day (last 30 days): ${revenueByDay.length ? JSON.stringify(revenueByDay) : 'No orders placed in the last 30 days'}

Most Recent Orders (newest first, up to 10):
${JSON.stringify(recentSummary)}`
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'query_revenue_by_date_range',
      description: 'Get total revenue and order count broken down by day for any date range. Use this for questions about sales on specific dates, weeks, months, or custom ranges.',
      parameters: {
        type: 'object',
        properties: {
          start_date: { type: 'string', description: 'Start date inclusive, YYYY-MM-DD' },
          end_date:   { type: 'string', description: 'End date inclusive, YYYY-MM-DD' },
        },
        required: ['start_date', 'end_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_orders_by_date',
      description: 'Get every individual order placed on a specific date with items and totals.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_top_products',
      description: 'Get top selling products by revenue for any date range.',
      parameters: {
        type: 'object',
        properties: {
          start_date: { type: 'string', description: 'Start date inclusive, YYYY-MM-DD' },
          end_date:   { type: 'string', description: 'End date inclusive, YYYY-MM-DD' },
          limit:      { type: 'number', description: 'Max number of products to return (default 5)' },
        },
        required: ['start_date', 'end_date'],
      },
    },
  },
]

const executeTool = async (name, args) => {
  const toEnd = (dateStr) => { const d = new Date(dateStr); d.setHours(23, 59, 59, 999); return d }
  const toStart = (dateStr) => new Date(dateStr)

  if (name === 'query_revenue_by_date_range') {
    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: toStart(args.start_date), $lte: toEnd(args.end_date) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    return {
      dailyBreakdown: rows,
      totalRevenue: rows.reduce((s, r) => s + r.revenue, 0),
      totalOrders:  rows.reduce((s, r) => s + r.orders, 0),
    }
  }

  if (name === 'query_orders_by_date') {
    const orders = await Order.find({
      createdAt: { $gte: toStart(args.date), $lte: toEnd(args.date) },
    }).select('totalPrice status orderItems createdAt').lean()
    return {
      date: args.date,
      count: orders.length,
      totalRevenue: orders.reduce((s, o) => s + o.totalPrice, 0),
      orders: orders.map((o) => ({
        total: o.totalPrice,
        status: o.status,
        items: o.orderItems.map((i) => `${i.name} x${i.qty}`),
      })),
    }
  }

  if (name === 'query_top_products') {
    return Order.aggregate([
      { $match: { createdAt: { $gte: toStart(args.start_date), $lte: toEnd(args.end_date) } } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.name',
          totalQty:     { $sum: '$orderItems.qty' },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: args.limit || 5 },
    ])
  }

  throw new Error(`Unknown tool: ${name}`)
}

const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body
    const context = await getLiveContext()

    const messages = [
      {
        role: 'system',
        content: `You are a business assistant for a SwiftCard ecommerce store. You ONLY answer questions about this store's data. Do not answer unrelated questions.

SNAPSHOT (already loaded — answer directly from this when possible):
${context}

TOOLS: Use the tools ONLY when the user asks about a specific date or date range that is NOT already covered in the snapshot above. Do not call tools if the answer is visible in the snapshot.`,
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    // agentic loop: run until the model stops requesting tool calls (max 5 rounds)
    let response
    for (let round = 0; round < 5; round++) {
      response = await withRetry(() =>
        client.chat.completions.create({
          model: MODEL,
          max_tokens: 2048,
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
        })
      )

      const choice = response.choices[0]
      if (choice.finish_reason !== 'tool_calls') break

      messages.push(choice.message)
      for (const tc of choice.message.tool_calls) {
        const args = JSON.parse(tc.function.arguments)
        const result = await executeTool(tc.function.name, args)
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) })
      }
    }

    res.json({ reply: response.choices[0].message.content })
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ message: 'AI service is rate limited. Please wait a minute and try again.' })
    }
    next(err)
  }
}

const generateDescription = async (req, res, next) => {
  try {
    const { name, features } = req.body
    const response = await withRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `Generate an SEO-friendly product description (2-3 sentences) and a 1-sentence marketing summary for: "${name}". Features: ${features}. Return ONLY valid JSON with no markdown, no code blocks: {"description": "...", "summary": "..."}`,
          },
        ],
      })
    )

    const text = response.choices[0].message.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
    const parsed = JSON.parse(text)
    res.json(parsed)
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ message: 'AI service is rate limited. Please wait a minute and try again.' })
    }
    next(err)
  }
}

const invoiceOcr = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const base64Image = req.file.buffer.toString('base64')
    const mimeType = req.file.mimetype
    const base64String = `data:${mimeType};base64,${base64Image}`

    const ocrResponse = await axios.post(
      'https://api.ocr.space/parse/image',
      new URLSearchParams({
        base64Image: base64String,
        apikey: process.env.OCR_SPACE_API_KEY,
        language: 'eng',
        isCreateSearchablePdf: 'false',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const extractedText = ocrResponse.data?.ParsedResults?.[0]?.ParsedText || ''
    if (!extractedText.trim()) {
      return res.status(422).json({ message: 'Could not extract text from the file' })
    }

    const aiResponse = await withRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Extract invoice details from the following text and return ONLY valid JSON with no markdown, no code blocks: {"vendor": "...", "totalAmount": "...", "date": "...", "lineItems": [{"description": "...", "amount": "..."}], "categories": ["..."]}.\n\nInvoice text:\n${extractedText}`,
          },
        ],
      })
    )

    const summaryText = aiResponse.choices[0].message.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
    const summary = JSON.parse(summaryText)
    res.json({ extractedText, summary })
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ message: 'AI service is rate limited. Please wait a minute and try again.' })
    }
    next(err)
  }
}

module.exports = { generateInsights, chat, generateDescription, invoiceOcr }
