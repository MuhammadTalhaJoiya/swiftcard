# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SwiftCard is a MERN stack ecommerce application with JWT auth, an admin dashboard, cart/order management, and product catalog.

- **Frontend**: React 18 + Vite, Tailwind CSS v4, located in `client/`
- **Backend**: Node.js + Express REST API, located in `server/`
- **Database**: MongoDB with Mongoose ODM (hosted on MongoDB Atlas)
- **Auth**: JWT-based (30-day tokens), stored in `localStorage`
- **Deployed backend**: `https://swiftcard-production.up.railway.app/api`

## Commands

### Install dependencies
```bash
cd client && npm install
cd server && npm install
```

### Development
```bash
# Client only (Vite dev server on http://localhost:5173)
cd client && npm run dev

# Server only (Express on http://localhost:5000)
cd server && npm run dev
```

### Build
```bash
cd client && npm run build
cd client && npm run preview   # preview production build
```

### Lint
```bash
cd client && npm run lint
```

### Seed database
```bash
cd server && node seed.js   # creates admin user + 12 products
```

## Architecture

### Backend (`server/`)
```
server/
  server.js             # Entry point — mounts routes, error middleware
  config/
    db.js               # mongoose.connect(), exits on failure
  models/
    User.js             # name, email, password (hashed), role
    Product.js          # name, description, price, category, stock, imageUrl, createdBy
    Cart.js             # user (unique), items[], virtual totalPrice
    Order.js            # user, orderItems[], shippingAddress, payment, status
  controllers/
    authController.js   # register, login, getUserProfile
    productController.js# getProducts (filtered), getById, create, update, delete
    cartController.js   # getCart, addToCart, removeFromCart, clearCart
    orderController.js  # createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus
  routes/
    authRoutes.js       # /api/auth
    productRoutes.js    # /api/products
    cartRoutes.js       # /api/cart
    orderRoutes.js      # /api/orders
  middleware/
    authMiddleware.js   # protect (JWT verify → req.user), adminOnly (role check)
    errorMiddleware.js  # notFound (404), errorHandler (JSON error responses)
  seed.js               # Database seeding script
```

### Frontend (`client/src/`)
```
main.jsx                # React entry point
App.jsx                 # React Router v6 routes + layout
pages/
  HomePage.jsx          # Product grid, search bar, category filter
  ProductDetailPage.jsx # Product detail, stock badge, add-to-cart
  CartPage.jsx          # Cart items, qty stepper, order summary, checkout
  LoginPage.jsx         # Email/password login form
  RegisterPage.jsx      # Name/email/password registration form
  OrdersPage.jsx        # User's order history list
  AdminPage.jsx         # Admin dashboard: Products tab + Orders tab
components/
  Navbar.jsx            # Logo, nav links, cart badge, auth buttons
  Footer.jsx            # Brand, links, copyright
  ProductCard.jsx       # Grid card with add-to-cart
  ProtectedRoute.jsx    # Auth guard; supports adminOnly prop
context/
  AuthContext.jsx       # user, login(), register(), logout() — persists to localStorage
  CartContext.jsx       # Reducer-based local cart: items, itemCount, total
services/
  api.js                # Axios instance — adds Bearer token, handles 401 redirect
  authService.js        # login, register
  productService.js     # getAll (with filters), getById, create, update, remove
  cartService.js        # get, addItem, removeItem, clear
  orderService.js       # getMyOrders, getById, create, getAll, updateStatus
```

## API Routes

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | public | Register new user |
| POST | `/login` | public | Login, returns JWT |
| GET | `/profile` | protect | Get current user profile |

### Products (`/api/products`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | public | List all; `?name=` `?category=` filters |
| GET | `/:id` | public | Get product by ID |
| POST | `/` | protect + adminOnly | Create product |
| PUT | `/:id` | protect + adminOnly | Update product |
| DELETE | `/:id` | protect + adminOnly | Delete product |

### Cart (`/api/cart`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | protect | Get user's cart |
| POST | `/` | protect | Add item `{ productId, qty }` |
| DELETE | `/` | protect | Clear entire cart |
| DELETE | `/:productId` | protect | Remove single item |

### Orders (`/api/orders`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | protect | Create order |
| GET | `/myorders` | protect | User's own orders |
| GET | `/` | protect + adminOnly | All orders |
| GET | `/:id` | protect | Order by ID (owner or admin) |
| PUT | `/:id/status` | protect + adminOnly | Update status `{ status }` |

## Models

### User
- `name` String, `email` String (unique), `password` String (bcrypt, min 6), `role` enum['user','admin']
- Pre-save: hashes password; method: `matchPassword(plain)`

### Product
- `name`, `description`, `category`, `imageUrl` Strings
- `price` Number (min 0), `stock` Number (min 0, default 0)
- `createdBy` → ref User

### Cart
- `user` → ref User (unique), `items[]` → `{ product, qty, price }`
- Virtual: `totalPrice` = sum(item.price × item.qty)

### Order
- `user` → ref User, `orderItems[]` → `{ product, name, imageUrl, price, qty }`
- `shippingAddress` → `{ address, city, postalCode, country }`
- `paymentMethod` String, `itemsPrice`, `shippingPrice`, `taxPrice`, `totalPrice` Numbers
- `status` enum['pending','processing','shipped','delivered','cancelled'] (default: 'pending')
- `isPaid` Boolean, `paidAt` Date, `isDelivered` Boolean, `deliveredAt` Date
- Admin setting status to 'delivered' auto-sets `isDelivered=true` and `deliveredAt`

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGO_URI=           # MongoDB Atlas connection string
JWT_SECRET=          # Long random secret
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

### Client (`client/.env`)
```
VITE_API_URL=        # Backend base URL (e.g. http://localhost:5000/api)
```

## Key Conventions

- **Entry point**: `server/server.js` (not `index.js`)
- **Auth middleware**: `protect` → attaches `req.user`; `adminOnly` → checks `req.user.role === 'admin'`
- **Error handling**: Controllers use `async/await` + `try/catch`, pass to `next(err)`; `errorMiddleware.js` returns JSON with stack in dev only
- **API prefix**: All routes at `/api/...`
- **Axios interceptor**: `services/api.js` auto-attaches JWT from localStorage; on 401, clears auth and redirects to `/login`
- **Cart sync**: CartContext is local-only (reducer); CartPage syncs to server immediately before order creation
- **Shipping logic**: Free if subtotal > $100, else $10 flat; tax is 15% of subtotal (calculated client-side in CartPage)
- **Admin check**: `ProtectedRoute` with `adminOnly` prop redirects non-admins to `/`; Navbar shows Admin link only for `role === 'admin'`
- **Vite proxy**: `/api` → `http://localhost:5000` in dev (no CORS issues locally)
- **Mongoose IDs**: Use `_id` (ObjectId); Admin order table trims to last 8 chars for display
