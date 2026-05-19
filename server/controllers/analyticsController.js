const Order = require('../models/Order')
const Product = require('../models/Product')
const User = require('../models/User')

const getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [revenueByDay, ordersByStatus, topProducts, topCustomers, [orderStats, productCount, userCount]] =
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

        Order.aggregate([
          { $group: { _id: '$user', totalSpent: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } },
          { $sort: { totalSpent: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          { $project: { name: '$user.name', email: '$user.email', totalSpent: 1, orderCount: 1 } },
        ]),

        Promise.all([
          Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } }]),
          Product.countDocuments(),
          User.countDocuments({ role: 'user' }),
        ]),
      ])

    res.json({
      revenueByDay,
      ordersByStatus,
      topProducts,
      topCustomers,
      summary: {
        totalRevenue: orderStats[0]?.total || 0,
        totalOrders: orderStats[0]?.count || 0,
        totalProducts: productCount,
        totalCustomers: userCount,
      },
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getAnalytics }
