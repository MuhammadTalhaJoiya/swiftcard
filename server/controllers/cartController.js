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

    // Update qty if item already exists in cart
    let cart = await Cart.findOneAndUpdate(
      { user: req.user._id, 'items.product': productId },
      { $set: { 'items.$.qty': qty, 'items.$.price': product.price } },
      { new: true }
    );

    if (!cart) {
      // Item not in cart yet — push it, upsert creates cart atomically if missing
      cart = await Cart.findOneAndUpdate(
        { user: req.user._id },
        { $push: { items: { product: productId, qty, price: product.price } } },
        { new: true, upsert: true }
      );
    }

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
