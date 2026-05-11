# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SwiftCard is a MERN stack ecommerce application.

- **Frontend**: React (Vite), located in `client/`
- **Backend**: Node.js + Express REST API, located in `server/`
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT-based authentication

## Commands

### Install dependencies
```bash
# Root (if using workspaces or concurrently)
npm install

# Or separately
cd client && npm install
cd server && npm install
```

### Development
```bash
# Run both client and server concurrently (from root)
npm run dev

# Client only (Vite dev server on http://localhost:5173)
cd client && npm run dev

# Server only (Express on http://localhost:5000)
cd server && npm run dev
```

### Build
```bash
cd client && npm run build
```

### Lint
```bash
cd client && npm run lint
cd server && npm run lint
```

### Tests
```bash
# Server tests
cd server && npm test

# Run a single test file
cd server && npm test -- path/to/file.test.js
```

## Architecture

### Backend (`server/`)
```
server/
  index.js          # Entry point — connects to MongoDB, starts Express
  config/           # DB connection, env config
  models/           # Mongoose models (User, Product, Order, Cart)
  routes/           # Express route definitions
  controllers/      # Route handler logic (imported by routes)
  middleware/        # Auth (verifyToken), error handler, etc.
  utils/            # Helpers (e.g., generateToken)
```

- Routes delegate to controllers; controllers use Mongoose models directly.
- Auth middleware (`middleware/auth.js`) attaches `req.user` from the JWT payload.
- A central error-handling middleware in `index.js` catches errors thrown from controllers.

### Frontend (`client/`)
```
client/
  src/
    main.jsx        # React entry point
    App.jsx         # Routes (React Router)
    pages/          # Top-level page components
    components/     # Reusable UI components
    context/        # React Context providers (AuthContext, CartContext)
    hooks/          # Custom hooks
    services/       # Axios API call functions (one file per resource)
    assets/         # Static assets
```

- All API calls go through `services/` using Axios with a configured base URL pointing to the Express server.
- `AuthContext` stores the JWT and user info; token is persisted in `localStorage`.
- `CartContext` manages cart state (may be synced to backend for logged-in users).

## Key Conventions

- **Environment variables**: Server reads from `server/.env` (`MONGO_URI`, `JWT_SECRET`, `PORT`). Client reads from `client/.env` (`VITE_API_URL`).
- **API prefix**: All backend routes are prefixed with `/api` (e.g., `/api/products`, `/api/auth`, `/api/orders`).
- **Async handlers**: Use `async/await` with try/catch in controllers; pass errors to `next(err)`.
- **Mongoose models**: Use `_id` (ObjectId) as the primary key — map to `id` on the frontend when needed.
