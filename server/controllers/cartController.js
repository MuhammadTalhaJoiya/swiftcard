const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name imageUrl price stock');
    res.json(cart || { items: [] });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existingItem = cart.items.find((i) => i.product.toString() === productId);
    if (existingItem) {
      existingItem.qty = qty;
    } else {
      cart.items.push({ product: productId, qty, price: product.price });
    }

    await cart.save();
    res.json(await cart.populate('items.product', 'name imageUrl price stock'));
  } catch (err) {
    next(err);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, removeFromCart, clearCart };
