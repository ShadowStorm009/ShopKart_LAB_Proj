# 🛍️ ShopKart — Full-Stack MERN E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Gateway-0C2340?logo=razorpay&logoColor=white)](https://razorpay.com/)

**ShopKart** is a modern, responsive, production-ready full-stack e-commerce web platform built with the **MERN** stack (MongoDB, Express, React, Node.js). It provides a complete end-to-end shopping journey: secure customer authentication with JWT cookies, interactive product discovery and catalog filters, wishlist management, persistent shopping cart, and seamless checkout with **Razorpay** payment gateway integration.

---

## ✨ Features

- 🔐 **Authentication & Security**
  - Customer Registration & Login with client-side and server-side validation.
  - Password hashing with **`bcryptjs`** (salt rounds = 10).
  - Stateless session authorization using **JSON Web Tokens (JWT)** stored in secure **`HttpOnly` cookies** (with Bearer token header fallback).
  - Protected routes on both backend (Express middleware) and frontend (React route guards).
  - Customer profile dashboard and password change functionality.

- 📦 **Product Catalog & Dynamic Discovery**
  - Instant search across product titles and descriptions.
  - Category filtering (Electronics, Fashion, Books, Home & Kitchen, etc.).
  - Multi-criteria sorting (Price: Low to High, Price: High to Low, Newest arrivals).
  - Dynamic product details page with high-res previews, stock status, ratings, and customer reviews.
  - Automatic inventory stock validation.

- ❤️ **Wishlist System**
  - Save items to personal wishlist with a single click.
  - Live wishlist count badge in the navigation bar.
  - One-click "Move to Cart" action directly from the wishlist.

- 🛒 **Shopping Cart & Price Calculation**
  - Persistent user cart stored in database and synced across sessions.
  - Real-time quantity adjustment steppers with stock limit boundaries.
  - Automatic calculation of subtotal, sales tax (18% GST), shipping rates, and net total.
  - Duplicate prevention and empty state handling.

- 💳 **Checkout & Razorpay Payment Gateway**
  - Multi-step checkout form capturing shipping address and contact details.
  - Server-side Razorpay order generation with currency (`INR`) and amounts converted to paise.
  - Official Razorpay Checkout Modal integration.
  - Cryptographic **HMAC-SHA256 signature verification** on backend before order confirmation.
  - Automatic stock decrement and cart clearing upon successful payment.

- 📜 **Order Tracking & History**
  - Order success confirmation page with unique Order ID and payment receipt.
  - Comprehensive "My Orders" customer dashboard.
  - Order status progression (`Placed` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`).
  - Detailed order view with item snapshots, shipping destination, and price breakdowns.

- 🧠 **Zero-Config Database Fallback**
  - Automatically connects to your local or cloud MongoDB database.
  - If no MongoDB instance is detected, the backend gracefully falls back to an embedded in-memory database (`mongodb-memory-server`) and automatically seeds initial sample products!

---

## 🏗️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│                   React 18 + Vite                      │
│     Tailwind CSS  •  React Router  •  Context API      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST (Axios)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Express.js (Node.js)                   │
│    Native ES Modules  •  JWT HttpOnly  •  CORS         │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
    ┌────────────────────┐      ┌────────────────────┐
    │ MongoDB (Mongoose) │      │  Razorpay Gateway  │
    │  Users, Products,  │      │ Orders & Signature │
    │   Carts, Orders    │      │    Verification    │
    └────────────────────┘      └────────────────────┘
```

### Backend
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js 4 (Native ES Modules: `"type": "module"`)
- **Database:** MongoDB with Mongoose ODM
- **In-Memory Fallback:** `mongodb-memory-server`
- **Security & Auth:** `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`
- **Payments:** `razorpay`, Node.js `crypto` (HMAC SHA-256)

### Frontend
- **Framework:** React 18 (Vite bundler)
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS v3, PostCSS, Autoprefixer
- **Icons:** Lucide React
- **HTTP Client:** Axios (configured with `withCredentials: true`)
- **State Management:** React Context API (`AuthContext`, `CartContext`)

---

## 📂 Project Structure

```text
shopkart/
├── package.json                 # Monorepo root helper scripts
├── .gitignore                   # Excludes node_modules, .env, and sensitive files
│
├── backend/
│   ├── config/
│   │   ├── db.js                # MongoDB connection + in-memory fallback
│   │   └── razorpay.js          # Razorpay client instance setup
│   ├── controllers/
│   │   ├── customer.controller.js# Auth & Customer profile logic
│   │   ├── product.controller.js # Catalog search, filtering, and CRUD
│   │   ├── wishlist.controller.js# Wishlist add/remove/toggle
│   │   ├── cart.controller.js    # Cart management & stock checks
│   │   └── order.controller.js   # Razorpay checkout, verification, order history
│   ├── middlewares/
│   │   └── auth.middleware.js   # JWT authentication verification
│   ├── models/
│   │   ├── customer.model.js    # Customer schema & password hashing
│   │   ├── product.model.js     # Product schema & inventory validation
│   │   └── order.model.js       # Order schema & item snapshots
│   ├── routes/
│   │   ├── customer.routes.js   # /customers & /auth endpoints
│   │   ├── product.routes.js    # /products endpoints
│   │   ├── wishlist.routes.js   # /wishlist endpoints
│   │   ├── cart.routes.js       # /cart endpoints
│   │   └── order.routes.js      # /orders endpoints
│   ├── seeds/
│   │   └── seedProducts.js      # Realistic initial product catalog seed
│   ├── utils/
│   │   └── generateToken.js     # JWT signing & cookie configuration
│   ├── .env.example             # Template for required environment variables
│   ├── package.json             # Backend dependencies & scripts
│   └── index.js                 # Express server entry point
│
└── frontend/
    ├── public/                  # Static assets
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx       # Navigation bar with live cart/wishlist counters
    │   │   ├── ProductCard.jsx  # Catalog product card
    │   │   ├── WishlistCard.jsx # Wishlist item card
    │   │   ├── CartItem.jsx     # Line item with quantity stepper & remove
    │   │   └── SearchBar.jsx    # Live search component
    │   ├── context/
    │   │   ├── AuthContext.jsx  # Authentication state & session provider
    │   │   └── CartContext.jsx  # Cart state & live price computation
    │   ├── pages/
    │   │   ├── Home.jsx         # Customer profile & account dashboard
    │   │   ├── Products.jsx     # Full product catalog with filters & sorting
    │   │   ├── ProductDetails.jsx# Dynamic single product view
    │   │   ├── Wishlist.jsx     # Saved items view
    │   │   ├── Cart.jsx         # Shopping cart & order cost breakdown
    │   │   ├── Checkout.jsx     # Shipping address & Razorpay checkout modal
    │   │   ├── OrderSuccess.jsx # Post-payment confirmation receipt
    │   │   ├── Orders.jsx       # Order history dashboard
    │   │   ├── OrderDetails.jsx # Detailed single order timeline
    │   │   ├── Login.jsx        # Login page
    │   │   └── Register.jsx     # Registration page
    │   ├── services/
    │   │   └── api.js           # Centralized Axios instance
    │   ├── App.jsx              # Main routing & protected route boundaries
    │   ├── index.css            # Tailwind directives & custom CSS
    │   └── main.jsx             # React entry point
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Setup & Installation Guide

### Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (version **18.x** or **20.x+** recommended)
- [npm](https://www.npmjs.com/) (version 9.x or higher)
- *(Optional)* [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on port `27017` (if not running, the application will automatically launch an in-memory database).

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/ShadowStorm009/ShopKart_LAB_Proj.git
cd ShopKart_LAB_Proj
```

---

### Step 2: Configure Environment Variables

Navigate to the `backend/` folder and create a `.env` file based on `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and configure your settings:

```env
# Server Port
PORT=5000

# Environment Mode
NODE_ENV=development

# JWT Secret Key (Replace with a random secure string)
JWT_SECRET=shopkart_jwt_secret_key_2026_super_secure

# MongoDB Connection String (Leave as-is for local, or paste your MongoDB Atlas URI)
MONGODB_URI=mongodb://localhost:27017/shopkart

# Frontend URL (For CORS cookie authorization)
CLIENT_URL=http://localhost:5173

# Razorpay Test API Keys (From Razorpay Dashboard -> Settings -> API Keys)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

> 💡 **Razorpay Test Keys:** You can obtain free test API keys by creating a free account at [dashboard.razorpay.com](https://dashboard.razorpay.com), navigating to **Settings** ➔ **API Keys**, and clicking **Generate Test Key**.

---

### Step 3: Install Dependencies

You can install all dependencies for both backend and frontend from the root folder:

```bash
npm run install:all
```

*Or manually in each folder:*
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

### Step 4: Seed Initial Products (Optional)

The backend automatically seeds products if the database is empty. You can also manually populate the catalog anytime:

```bash
npm run seed
# or: cd backend && npm run seed
```

---

### Step 5: Start the Development Servers

Open two terminal windows:

#### Terminal 1: Backend Server
```bash
npm run backend:dev
# or: cd backend && npm run dev
```
> Server will start on **`http://localhost:5000`**

#### Terminal 2: Frontend Client
```bash
npm run frontend
# or: cd frontend && npm run dev
```
> Vite dev server will start on **`http://localhost:5173`**

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 📡 API Reference

### 🔐 Authentication & Customer (`/customers`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/customers/register` | Public | Register new customer account |
| `POST` | `/customers/login` | Public | Authenticate customer & set HttpOnly cookie |
| `POST` | `/customers/logout` | Public | Clear JWT authentication cookie |
| `GET` | `/customers/me` | Protected | Fetch current logged-in customer profile |
| `PUT` | `/customers/change-password` | Protected | Update customer account password |

### 📦 Product Catalog (`/products`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/products` | Public | Get products with search, categories, and sorting |
| `GET` | `/products/:id` | Public | Get single product details |
| `POST` | `/products` | Protected | Create a new product entry |

### ❤️ Wishlist (`/wishlist`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/wishlist` | Protected | Retrieve user's populated wishlist |
| `POST` | `/wishlist/:productId` | Protected | Add product to wishlist |
| `DELETE` | `/wishlist/:productId` | Protected | Remove product from wishlist |
| `POST` | `/wishlist/toggle/:productId` | Protected | Toggle product in wishlist |

### 🛒 Shopping Cart (`/cart`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/cart` | Protected | Retrieve user's cart with calculated total |
| `POST` | `/cart` | Protected | Add item with quantity (validates stock) |
| `PUT` | `/cart/:productId` | Protected | Update quantity of a cart line item |
| `DELETE` | `/cart/:productId` | Protected | Remove specific item from cart |
| `DELETE` | `/cart` | Protected | Clear entire shopping cart |

### 💳 Orders & Payments (`/orders`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/orders/checkout` | Protected | Create Razorpay order & snapshot cart items |
| `POST` | `/orders/verify` | Protected | Verify Razorpay HMAC signature & mark order paid |
| `GET` | `/orders` | Protected | Fetch user order history |
| `GET` | `/orders/:id` | Protected | Fetch single order details & tracking status |

---

## 🧪 Testing Payments (Razorpay Test Mode)

When placing a test order in the checkout flow, you can use Razorpay's standard test payment credentials:

- **UPI / QR:** Select UPI ➔ Enter `success@razorpay` or approve modal.
- **Card:** Enter any standard test card number (e.g. `4111 1111 1111 1111`), any future expiry date, and any 3-digit CVV.
- **OTP:** Enter `123456` or click **Success** on the Razorpay simulator screen.

---

## 📜 Available NPM Scripts

### Root Directory
- `npm run install:all` — Installs dependencies for both backend and frontend.
- `npm run backend` — Starts the Express backend server with `node`.
- `npm run backend:dev` — Starts the backend server with watch mode (`node --watch`).
- `npm run seed` — Runs the product catalog database seeder.
- `npm run frontend` — Starts the Vite React frontend development server.
- `npm run frontend:build` — Builds the frontend for production.

### Backend (`/backend`)
- `npm start` — Run server with Node.js.
- `npm run dev` — Run server in development watch mode.
- `npm run seed` — Seed sample products into MongoDB.

### Frontend (`/frontend`)
- `npm run dev` — Launch Vite dev server.
- `npm run build` — Build optimized production bundle to `frontend/dist/`.
- `npm run preview` — Locally preview the production build.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**.
