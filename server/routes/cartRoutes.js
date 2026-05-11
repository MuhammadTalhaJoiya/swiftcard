const express = require('express');
const { getCart, addToCart, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getCart).post(protect, addToCart).delete(protect, clearCart);
router.delete('/:productId', protect, removeFromCart);

module.exports = router;
