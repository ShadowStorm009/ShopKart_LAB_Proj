# 🤖 ShopKart — Agent Handoff & Continuity Guide

> **Target Audience:** Any AI assistant, agent, or software engineer picking up this codebase.
> **Current Milestone Completed:** **Lab 06 (Checkout & Orders with Razorpay Test Mode)**
> **Project Status:** **All 6 Labs Complete (Full End-to-End MERN Commerce Journey)**

---

## 📌 1. Project Overview & Current State

ShopKart is a fullstack MERN e-commerce application developed across structured engineering labs.

| Lab | Theme | Status | Key Features |
|---|---|:---:|---|
| **Lab 01** | Backend Auth Service | ✅ Done | Customer Schema, bcryptjs hashing, JWT cookies, protected endpoints |
| **Lab 02** | Client-Server Auth | ✅ Done | React forms, HttpOnly auth flow, protected `/home` dashboard |
| **Lab 03** | Product Catalog | ✅ Done | MongoDB catalog, dynamic search, categories, sorting, details page |
| **Lab 04** | Wishlist System | ✅ Done | Normalized Mongoose relationships, toggle, populating, Navbar badge |
| **Lab 05** | Shopping Cart System | ✅ Done | Cart state, duplicate prevention, stock limit validation, steppers, derived totals |
| **Lab 06** | Checkout & Orders | ✅ Done | Checkout flow, Razorpay Test Mode, HMAC SHA256 signature verification, Order snapshot, My Orders, status progression |


---

## 🏗️ 2. Tech Stack & Critical Rules

### Backend
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js 4
- **Database:** MongoDB with Mongoose ODM
- **Module System:** **Native ES Modules (`"type": "module"`)**
  > ⚠️ **RULE FOR AGENTS:** Always use `import ... from ...` and `export ...` in all backend files. **Never use `require()` or `module.exports`**. When importing local files, always include the `.js` extension (e.g. `import Product from "./models/product.model.js"`).
- **Embedded Database Fallback:** If a local MongoDB instance is not detected, `backend/config/db.js` automatically starts an in-memory database (`mongodb-memory-server`) with automatic sample product seeding.
- **Authentication:** JWT stored in HttpOnly cookie (`token`) with Bearer token header fallback. Decoded in `backend/middlewares/auth.middleware.js` (`protect`) attaching `req.user`.

### Frontend
- **Framework:** React 18 (Vite bundler)
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS v3
- **State Management:** React Context API (`AuthContext` and `CartContext`)
  > ⚠️ **RULE FOR AGENTS:** The user prefers clean, standard React for new components without unnecessary third-party icon libraries. Keep components lightweight and readable.
- **API Client:** Axios with `withCredentials: true` (configured in `frontend/src/services/api.js`).

---

## 📂 3. Directory Layout & Key Files

```text
shopkart/
├── backend/
│   ├── config/
│   │   └── db.js                 # Mongo connection with MongoMemoryServer fallback
│   ├── controllers/
│   │   ├── customer.controller.js# Auth (Register, Login, Me, Logout, Change Password)
│   │   ├── product.controller.js # Catalog (Create, Search, Filter, Sort, GetById)
│   │   ├── wishlist.controller.js# Wishlist (Add, Get, Remove, Toggle)
│   │   └── cart.controller.js    # Cart (Add, Get, UpdateQty, Remove, Clear) [Lab 05]
│   ├── middlewares/
│   │   └── auth.middleware.js    # protect middleware (verifies JWT)
│   ├── models/
│   │   ├── customer.model.js     # User schema with wishlist & cart fields
│   │   └── product.model.js      # Product schema (price, stock, category, image)
│   ├── routes/
│   │   ├── customer.routes.js    # Mounted at /customers and /auth
│   │   ├── product.routes.js     # Mounted at /products
│   │   ├── wishlist.routes.js    # Mounted at /wishlist
│   │   └── cart.routes.js        # Mounted at /cart [Lab 05]
│   ├── seeds/
│   │   └── seedProducts.js       # Seed dataset
│   ├── utils/
│   │   └── generateToken.js      # JWT signing & cookie helpers
│   ├── index.js                  # Express server entrypoint
│   └── package.json              # "type": "module"
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Top navigation with live Wishlist & Cart badges
│   │   │   ├── ProductCard.jsx   # Catalog card with Add to Cart / Add Another
│   │   │   ├── CartItem.jsx      # Line item with stepper [-] [qty] [+] & Remove
│   │   │   ├── WishlistCard.jsx  # Wishlist item with Move to Cart action
│   │   │   └── SearchBar.jsx     # Reusable search bar
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Global session & customer profile
│   │   │   └── CartContext.jsx   # Global cart state & derived totals [Lab 05]
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Protected profile dashboard (/home)
│   │   │   ├── Login.jsx         # Login screen (/login)
│   │   │   ├── Register.jsx      # Registration screen (/register)
│   │   │   ├── Products.jsx      # Catalog with search & filter (/products)
│   │   │   ├── ProductDetails.jsx# Single product detail (/products/:id)
│   │   │   ├── Wishlist.jsx      # Saved items screen (/wishlist)
│   │   │   └── Cart.jsx          # Shopping cart screen (/cart) [Lab 05]
│   │   ├── services/
│   │   │   └── api.js            # Axios API calls
│   │   ├── App.jsx               # Route definitions & Context providers
│   │   └── main.jsx              # React DOM entry
│   ├── package.json
│   └── vite.config.js
│
├── Lab-01 (ShopKart).md
├── Lab-02 (client Server Auth).md
├── Lab-03 (Product Catalog).md
├── Lab-04 (Wishlist System).md
├── Lab-05 (Shopping Cart).md
└── README.md
```

---

## 🔌 4. API Endpoints Reference

### Authentication (`/customers` and `/auth`)
- `POST /customers/register` — Create new customer
- `POST /customers/login` — Sign in & set HttpOnly cookie
- `GET /customers/me` — Authenticated profile [Protected]
- `POST /customers/logout` — Clear session cookie
- `PATCH /customers/change-password` — Update password [Protected]

### Products (`/products`)
- `GET /products` — Query with `search`, `category`, `sort`
- `GET /products/:id` — Single product details
- `POST /products` — Create product (admin)

### Wishlist (`/wishlist`)
- `GET /wishlist` — Populated wishlist items [Protected]
- `POST /wishlist/:productId` — Add product to wishlist [Protected]
- `DELETE /wishlist/:productId` — Remove product [Protected]
- `PATCH /wishlist/:productId/toggle` — Toggle in/out of wishlist [Protected]

### Shopping Cart (`/cart`) [Lab 05]
- `GET /cart` — Get user's cart populated with product details [Protected]
- `POST /cart/:productId` — Add product (or increment quantity by 1 if already present) [Protected]
- `PATCH /cart/:productId` — Update item quantity `{ quantity: number }` [Protected]
- `DELETE /cart/:productId` — Remove single item from cart [Protected]
- `DELETE /cart` — Clear entire cart [Protected]

### Checkout & Orders (`/orders`) [Lab 06]
- `POST /orders/create-payment-order` — Validates address & stock, creates pending ShopKart order and Razorpay Order (amount in paise, INR) [Protected]
- `POST /orders/verify-payment` — Validates HMAC SHA256 payment signature, marks order PAID and PLACED, deducts catalog stock, clears cart [Protected]
- `POST /orders` — Direct / COD order creation fallback [Protected]
- `GET /orders` — Get current authenticated user's order history sorted newest first [Protected]
- `GET /orders/:id` — Get single order details with ownership verification [Protected]
- `PATCH /orders/:id/status` — Update order status (Bonus Challenge: progression PLACED → CONFIRMED → SHIPPED → DELIVERED) [Protected]

---

## 🧮 5. Core Architectural Decisions (Do Not Break)

1. **Normalized Cart Schema:**
   The `cart` array inside `Customer` stores only `{ product: ObjectId, quantity: Number }`.
   Full product details and prices are **never duplicated** inside the user cart document. They are dynamically populated on read via `.populate('cart.product')` so prices remain live.
2. **Derived Cart State:**
   `subtotal`, `totalCount`, and `itemCount` are calculated using `useMemo` in `CartContext.jsx`. They are **never stored as separate fields in MongoDB** to avoid stale data bugs.
3. **Strict Stock Verification:**
   `cart.controller.js` and `order.controller.js` verify `product.stock` before incrementing or placing orders. If `targetQuantity > product.stock`, they immediately reject with `400 Bad Request`.
4. **Order Price Snapshotting:**
   Unlike the cart, the `Order` model freezes product prices and names at purchase time (`items.price`, `items.name`) so catalog price changes never corrupt historical receipts.
5. **Mandatory Payment Signature Verification:**
   Razorpay order amount is calculated on the server. The cart is **never cleared** and order is **never marked PAID** until the HMAC SHA256 signature is verified with `RAZORPAY_KEY_SECRET`.

---

## 🏆 6. Lab 06 Implementation Architecture

Lab 06 completes the full MERN e-commerce lifecycle:

1. **Backend Order Architecture:**
   - Model: [`order.model.js`](file:///home/ritansh/Projects/shopkart/backend/models/order.model.js) (user/customer ref, frozen snapshot items, full shipping address, Razorpay order/payment IDs, paymentStatus, lifecycle status).
   - Razorpay Integration: [`razorpay.js`](file:///home/ritansh/Projects/shopkart/backend/config/razorpay.js) initialized with Test Mode keys.
   - Controller: [`order.controller.js`](file:///home/ritansh/Projects/shopkart/backend/controllers/order.controller.js) with server stock validation, server price computation, Razorpay order creation in paise, cryptographic signature verification, stock deduction, and cart clearing.
   - Routes: [`order.routes.js`](file:///home/ritansh/Projects/shopkart/backend/routes/order.routes.js) mounted at `/orders`.
2. **Frontend Architecture:**
   - APIs: [`api.js`](file:///home/ritansh/Projects/shopkart/frontend/src/services/api.js) with `createPaymentOrder`, `verifyPayment`, `getOrders`, `getOrderById`, `updateOrderStatus`.
   - Checkout Page: [`Checkout.jsx`](file:///home/ritansh/Projects/shopkart/frontend/src/pages/Checkout.jsx) with 6-point shipping form validation, order review, dynamic Razorpay checkout launcher, error banners, and handler wiring.
   - Confirmation Page: [`OrderSuccess.jsx`](file:///home/ritansh/Projects/shopkart/frontend/src/pages/OrderSuccess.jsx) with receipt snapshot and past order navigation.
   - Orders History: [`Orders.jsx`](file:///home/ritansh/Projects/shopkart/frontend/src/pages/Orders.jsx) with loading/empty/error states, delivery progress stepper, and interactive bonus status progression tester.
   - Order Details: [`OrderDetails.jsx`](file:///home/ritansh/Projects/shopkart/frontend/src/pages/OrderDetails.jsx) with item breakdowns, pricing, shipping, and Razorpay payment details.
   - State Sync: [`CartContext.jsx`](file:///home/ritansh/Projects/shopkart/frontend/src/context/CartContext.jsx) updated with `clearCartState` for instant Navbar badge synchronization (`Cart (0)`).


---

## 🛠️ 7. Useful Development Commands

```bash
# Run backend (with native ES modules)
npm --prefix backend run dev

# Run frontend (Vite)
npm --prefix frontend run dev

# Re-seed catalog products
npm --prefix backend run seed

# Build frontend bundle
npm --prefix frontend run build
```

---

*This guide guarantees zero context loss for any future engineer or AI agent.*
