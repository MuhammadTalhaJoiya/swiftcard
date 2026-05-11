const express = require('express');
const { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, adminOnly, getAllOrders);

router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
