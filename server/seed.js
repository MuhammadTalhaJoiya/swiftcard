require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');

const products = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and foldable design.',
    price: 79.99,
    category: 'Electronics',
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  },
  {
    name: 'Mechanical Keyboard',
    description: 'Compact TKL mechanical keyboard with Cherry MX Brown switches and RGB backlighting.',
    price: 59.99,
    category: 'Electronics',
    stock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
  },
  {
    name: 'USB-C Hub 7-in-1',
    description: 'Multiport adapter with 4K HDMI, 3x USB-A, SD card reader, and 100W PD charging.',
    price: 34.99,
    category: 'Electronics',
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=600&q=80',
  },
  {
    name: 'Running Sneakers',
    description: 'Lightweight breathable running shoes with responsive foam cushioning and anti-slip outsole.',
    price: 89.95,
    category: 'Footwear',
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  },
  {
    name: 'Leather Wallet',
    description: 'Slim genuine leather bifold wallet with 6 card slots and RFID blocking.',
    price: 24.99,
    category: 'Accessories',
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80',
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Double-wall vacuum insulated bottle, keeps drinks cold 24h or hot 12h. 32oz.',
    price: 19.99,
    category: 'Kitchen',
    stock: 75,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip 6mm thick TPE yoga mat with alignment lines and carrying strap.',
    price: 29.99,
    category: 'Sports',
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80',
  },
  {
    name: 'Desk Lamp with USB Charging',
    description: 'LED desk lamp with 5 brightness levels, 3 color modes, and a built-in USB-A charging port.',
    price: 39.99,
    category: 'Home',
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 minimalist 12oz ceramic mugs, dishwasher and microwave safe.',
    price: 22.00,
    category: 'Kitchen',
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
  },
  {
    name: 'Hardcover Notebook A5',
    description: 'Dotted hardcover notebook, 200 pages of 100gsm paper, lay-flat binding.',
    price: 14.99,
    category: 'Stationery',
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&q=80',
  },
  {
    name: 'Backpack 20L',
    description: 'Water-resistant 20L daypack with laptop sleeve, padded straps, and USB charging port.',
    price: 49.99,
    category: 'Accessories',
    stock: 22,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
  },
  {
    name: 'Sunglasses Polarized',
    description: 'UV400 polarized sunglasses with lightweight TR90 frame and spring hinges.',
    price: 18.99,
    category: 'Accessories',
    stock: 0,
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Create or reuse an admin user
  let admin = await User.findOne({ email: 'admin@swiftcard.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: 'admin@swiftcard.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Admin user created — email: admin@swiftcard.com  password: admin123');
  } else {
    console.log('Admin user already exists, reusing it');
  }

  // Clear existing products and insert fresh ones
  await Product.deleteMany({});
  const inserted = await Product.insertMany(
    products.map(p => ({ ...p, createdBy: admin._id }))
  );
  console.log(`Seeded ${inserted.length} products`);

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
