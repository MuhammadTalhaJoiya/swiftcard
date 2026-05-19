# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SwiftCard is a MERN stack ecommerce application with JWT auth, an admin dashboard, cart/order management, product catalog, analytics, and AI-powered features.

- **Frontend**: React 18 + Vite, Tailwind CSS v4, Recharts, located in `client/`
- **Backend**: Node.js + Express REST API, located in `server/` (deps: express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv, openai, axios, multer)
- **Database**: MongoDB with Mongoose ODM (hosted on MongoDB Atlas)
- **Auth**: JWT-based (30-day tokens), stored in `localStorage`
- **AI**: Google Gemini API (`gemini-2.5-flash-lite`, OpenAI-compatible endpoint) — insights, chat, product description generation, invoice OCR
- **Deployed backend**: `https://swiftcard-production.up.railway.app/api`

## Commands

### Install dependencies
```bash
cd client && npm install
cd server && npm install
```

### Development (Windows — use PowerShell, not Bash)
```powershell
# Start backend (Express on http://localhost:5000)
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location C:\swiftcard\server; npm run dev'

# Start frontend (Vite on http://localhost:5173)
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location C:\swiftcard\client; npm run dev'
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

## Admin Credentials
- **Email**: `admin@swiftcard.com`
- **Password**: `admin123`

## Architecture

### Backend (`server/`)
```
server/
  server.js             # Entry point — sets DNS to 8.8.8.8 (Railway fix), mounts routes, error middleware
  config/
    db.js               # mongoose.connect(), exits on failure
  models/
    User.js             # name, email, password (hashed), role
    Product.js          # name, description, price, category, stock, imageUrl, createdBy
    Cart.js             # user (unique), items[], virtual totalPrice
    Order.js            # user, orderItems[], shippingAddress, payment, status
  controllers/
    authController.js       # register, login, getUserProfile
    productController.js    # getProducts (filtered), getById, create, update, delete
    cartController.js       # getCart, addToCart, removeFromCart, clearCart
    orderController.js      # createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus
    analyticsController.js  # getAnalytics — revenue, orders, top products, top customers (last 30 days)
    aiController.js         # generateInsights, chat, generateDescription, invoiceOcr (all use Gemini API)
  routes/
    authRoutes.js       # /api/auth
    productRoutes.js    # /api/products
    cartRoutes.js       # /api/cart
    orderRoutes.js      # /api/orders
    analyticsRoutes.js  # /api/analytics  (admin only)
    aiRoutes.js         # /api/ai         (admin only)
  middleware/
    authMiddleware.js   # protect (JWT verify → req.user), adminOnly (role check)
    errorMiddleware.js  # notFound (404), errorHandler (JSON error responses)
    upload.js           # multer — memoryStorage, 5MB limit, jpeg/jpg/png/pdf only
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
  AdminPage.jsx         # Admin dashboard: Products | Orders | Analytics | AI Tools tabs
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
  analyticsService.js   # getMetrics(), getInsights(metrics)
  aiService.js          # chat(message, history), generateDescription(name, features), invoiceOcr(formData)
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

### Analytics (`/api/analytics`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | protect + adminOnly | Revenue by day, orders by status, top products, top customers, summary |

### AI (`/api/ai`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/insights` | protect + adminOnly | Generate bullet-point insights from analytics data |
| POST | `/chat` | protect + adminOnly | Chat with store data (uses live DB context) |
| POST | `/generate-description` | protect + adminOnly | Generate SEO product description + summary `{ name, features }` |
| POST | `/invoice-ocr` | protect + adminOnly | Upload invoice image/PDF → extract fields via OCR + Gemini |

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
MONGO_URI=              # MongoDB Atlas connection string
JWT_SECRET=             # Long random secret
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=         # Google Gemini API key — required for all AI features
OCR_SPACE_API_KEY=      # Required for invoice OCR (ocr.space free tier available)
```

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:5000/api   # Local dev — use this, not the Railway URL
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
- **AI model**: All Gemini calls use `gemini-2.5-flash-lite` via OpenAI-compatible SDK (`baseURL: https://generativelanguage.googleapis.com/v1beta/openai/`), max_tokens 512–1024. Do not use `gemini-2.5-flash` (only 20 RPD free tier — exhausts fast) or `gemini-2.0-flash` (free tier limit is 0 for this project). `gemini-2.5-flash-lite` has 1,500 RPD on the free tier.
- **Chatbot tool calling**: `chat` uses an agentic loop (max 5 rounds) with 3 tools — `query_revenue_by_date_range`, `query_orders_by_date`, `query_top_products`. AI reads from the snapshot first; calls tools only for specific dates/ranges not already in the snapshot. Each chat message can trigger up to 2 Gemini API calls (initial + after tool result).
- **Rate limit handling**: All AI endpoints use `withRetry` (1 retry, 2s delay) on 429. If retries exhausted, returns `429` with a human-readable message to the client.
- **File uploads**: `upload.js` (multer) stores in memory (no disk), 5MB max, image/jpeg + image/jpg + image/png + application/pdf only
- **Windows dev**: Use PowerShell to start dev servers — Bash tool uses Linux paths and breaks on Windows `C:\` paths
