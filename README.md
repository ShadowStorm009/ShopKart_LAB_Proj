# 🛍️ ShopKart — Fullstack MERN Application

A contemporary, production-grade e-commerce application developed phasewise across **Labs 01 through 05** following standard **MVC architecture** and the MERN stack with native ES modules.

> 🤖 **For AI Agents & Developers:** See [`AGENT_HANDOFF.md`](./AGENT_HANDOFF.md) for full context, code conventions, API contracts, and roadmap to continue with **Lab 06**.

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed     # Seeds rich catalog products (Electronics, Fashion, Books, Home)
npm start        # Starts Express server on http://localhost:5000
```
> **Note:** The backend automatically connects to MongoDB via `process.env.MONGODB_URI`. If no local MongoDB service is running, it automatically starts an embedded in-memory MongoDB instance with zero configuration required.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Runs Vite dev server on http://localhost:5173
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🏗️ Project Architecture

```text
shopkart/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & embedded fallback
│   ├── controllers/
│   │   ├── customer.controller.js# Auth (Register, Login, Me, Logout, Change Password)
│   │   ├── product.controller.js # Catalog (Create, Search, Filter, Sort, Single)
│   │   ├── wishlist.controller.js# Wishlist (Add, Get + populate, Remove, Toggle)
│   │   └── cart.controller.js    # Cart (Add, Get, UpdateQty, Remove, Clear) [Lab 05]
│   ├── models/
│   │   ├── customer.model.js     # Customer Schema + Wishlist & Cart ref arrays
│   │   └── product.model.js      # Product Schema with price & stock validation
│   ├── routes/
│   │   ├── customer.routes.js    # /customers and /auth routes
│   │   ├── product.routes.js     # /products routes
│   │   ├── wishlist.routes.js    # /wishlist routes
│   │   └── cart.routes.js        # /cart routes [Lab 05]
│   ├── middlewares/
│   │   └── auth.middleware.js    # JWT verification from HttpOnly cookie or Bearer
│   ├── utils/
│   │   └── generateToken.js      # JWT signing & cookie configuration
│   ├── seeds/
│   │   └── seedProducts.js       # Seed script with realistic catalog items
│   ├── .env                      # Environment configuration
│   └── index.js                  # Main server entrypoint
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx        # Navigation bar with live Wishlist & Cart badges
    │   │   ├── ProductCard.jsx   # Product card with price, stock, and Add to Cart action
    │   │   ├── WishlistCard.jsx  # Wishlist card with details and Move to Cart action
    │   │   ├── CartItem.jsx      # Line item with stepper [-] [qty] [+] & Remove [Lab 05]
    │   │   └── SearchBar.jsx     # Reusable search bar with clear action
    │   ├── pages/
    │   │   ├── Register.jsx      # Registration form with client-side validation
    │   │   ├── Login.jsx         # Login form with cookie credentials
    │   │   ├── Home.jsx          # Protected profile dashboard (GET /customers/me)
    │   │   ├── Products.jsx      # Catalog with search, categories, sorting, states
    │   │   ├── ProductDetails.jsx# Dynamic details route (/products/:id)
    │   │   ├── Wishlist.jsx      # Saved items page with empty/loading/error states
    │   │   └── Cart.jsx          # Shopping Cart page with Order Summary [Lab 05]
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Auth state provider and session sync
    │   │   └── CartContext.jsx   # Global cart state & derived totals [Lab 05]
    │   ├── services/
    │   │   └── api.js            # Axios client with withCredentials: true
    │   ├── App.jsx               # React Router DOM configuration & route guards
    │   ├── index.css             # Tailwind CSS & custom design utilities
    │   └── main.jsx              # React DOM entrypoint
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 📋 Phasewise Lab Breakdown

### 🔹 Lab 01 — Customer Authentication Service (Backend)
- **MVC Architecture:** Separation of Models, Views (JSON API), and Controllers.
- **Security:**
  - Password hashing with **`bcryptjs`** (salt rounds = 10) in pre-save hook.
  - Plaintext passwords never stored in MongoDB and never returned in API responses (`toJSON` transform).
  - JWT generation stored in secure **`HttpOnly` cookies** (`sameSite: 'lax'`, 7-day expiration).
- **APIs:**
  - `POST /customers/register` (400 on missing/short password, 409 on duplicate email, 201 on success).
  - `POST /customers/login` (401 with generic "Invalid credentials" without revealing which field was wrong).
  - `GET /customers/me` (Protected route reading cookie/Bearer token).
  - `POST /customers/logout` (Clears HttpOnly cookie).
  - *Bonus:* `PATCH /customers/change-password` (Verifies current password, hashes new one).

### 🔹 Lab 02 — Client-Server Auth & Login → Home Flow (Frontend)
- **Stack:** React, React Router v6, Tailwind CSS, Axios (`withCredentials: true`).
- **Pages & Flows:**
  - `/register`: Controlled inputs, real-time validation, server error banner, automatic redirect to `/login`.
  - `/login`: Controlled inputs, error display on invalid credentials, redirects to `/home`.
  - `/home`: Protected route that fetches profile via `GET /customers/me`. Unauthenticated visitors are automatically redirected to `/login`.
  - `Navbar`: Displays authenticated user's name, navigation links, and functional logout button.

### 🔹 Lab 03 — Product Catalog & Discovery (Backend + Frontend)
- **Backend Catalog API:**
  - `POST /products`: Validates price > 0, stock ≥ 0, all mandatory fields.
  - `GET /products`: Supports dynamic query parameters:
    - Search (`?search=keyboard`): Case-insensitive regex on product `name`.
    - Category (`?category=Electronics`): Filter by category.
    - Sorting Bonus (`?sort=price_asc`, `?sort=price_desc`, `?sort=name_asc`).
  - `GET /products/:id`: Validates MongoDB ObjectId format (400 if invalid), 404 if not found.
- **Frontend Catalog Experience:**
  - Dynamic product grid with search bar, category chips (`All`, `Electronics`, `Fashion`, `Books`, `Home`), and sort options.
  - **Loading State:** Smooth animated skeleton cards.
  - **Empty State:** Custom empty state illustration with reset filter button.
  - **Error State:** Error banner with retry mechanism.
  - `/products/:id`: Dynamic product details page with image, specifications, stock indicator, Add to Cart (UI state), and Wishlist action.

### 🔹 Lab 04 — Wishlist System (Backend + Frontend)
- **Database Relationship:**
  - User model stores ObjectId references: `wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }]`.
  - Products remain the single source of truth (no duplicate product data stored in the User document).
- **Backend Wishlist APIs:**
  - `POST /wishlist/:productId`: Protected, checks if product exists (404), prevents duplicates (409 Conflict), appends reference.
  - `GET /wishlist`: Protected, populates references using `.populate('wishlist')`.
  - `DELETE /wishlist/:productId`: Protected, removes reference from array.
  - *Bonus:* `PATCH /wishlist/:productId/toggle` (1-click toggle action).
- **Frontend Wishlist Experience:**
  - Interactive Wishlist button on cards and detail page (`♡ Wishlist` &rarr; `⏳ Saving...` &rarr; `♥ Saved`).
  - Dedicated `/wishlist` page with populated saved items, live count, view details, and remove action.
  - **Navbar Badge:** Live dynamic count indicator (`Wishlist (3)`).
  - Empty wishlist state with "Browse Products" action.

### 🔹 Lab 05 — Shopping Cart System (Backend + Frontend)
- **Native ES Modules:** Entire backend operates on `"type": "module"` with native `import`/`export` syntax.
- **Cart Data Model:**
  - Extended Customer schema with `cart: [{ product: ObjectId, quantity: Number, min: 1 }]`.
  - Normalized referencing prevents stale product information.
- **Backend Cart APIs:**
  - `POST /cart/:productId`: Protected, adds product (quantity 1) or increments quantity if already in cart. Validates against available stock.
  - `GET /cart`: Protected, populates product details and filters out deleted items.
  - `PATCH /cart/:productId`: Protected, updates quantity with integer and stock validations.
  - `DELETE /cart/:productId`: Protected, removes single product line from cart.
  - `DELETE /cart`: Protected, clears entire cart.
- **Frontend Global Cart State (`CartContext.jsx`):**
  - Single source of truth for cart data across Navbar, Product Card, and Cart page.
  - Granular per-item loading states (`itemLoading[id]`) for responsive interactions.
  - Derived values calculated dynamically via `useMemo` (`subtotal`, `totalCount`, `itemCount`).
  - Dedicated `/cart` page with loading, empty (`Your cart is empty 🛒`), error, and populated cart with sticky Order Summary.
  - Live Navbar cart badge syncing total units in real time.

---

## 🎤 Comprehensive TA Viva Answers

### Lab 01
1. **Why do we use bcrypt instead of encrypting passwords?**  
   *Encryption is two-way (can be decrypted if the key is compromised). Bcrypt is a one-way cryptographic hash with salting and work factor (key stretching), making it computationally infeasible to reverse or attack via rainbow tables.*
2. **What information is typically stored inside a JWT payload?**  
   *Non-sensitive claims such as the user ID (`id`), role, and token expiration (`exp`). Sensitive data like passwords or credit card numbers should never be stored in a JWT payload.*
3. **Why is the HttpOnly flag important for cookies?**  
   *It prevents client-side JavaScript (`document.cookie`) from accessing the cookie, protecting the authentication token against Cross-Site Scripting (XSS) attacks.*
4. **Why should passwords never be returned to the frontend?**  
   *Even hashed passwords can be subjected to offline brute-force attacks if intercepted or leaked.*
5. **What is the purpose of authentication middleware?**  
   *It intercepts incoming requests to protected routes, extracts and verifies the JWT, loads the authenticated user, and halts unauthorized requests with a 401 Unauthorized status.*

### Lab 02
1. **Why do we use `withCredentials: true` with Axios?**  
   *By default, browsers do not send cookies with cross-origin requests. Setting `withCredentials: true` instructs Axios to include HttpOnly cookies in CORS requests.*
2. **Why can't JavaScript read an HttpOnly cookie?**  
   *Browsers deliberately restrict access to `document.cookie` for cookies with the `HttpOnly` flag to mitigate credential theft via XSS.*
3. **Why is `/home` called a protected route?**  
   *It requires a valid session verified against the server (`GET /customers/me`). Unauthenticated requests are blocked and redirected to `/login`.*
4. **Why do we fetch `/customers/me` instead of storing the user manually in localStorage?**  
   *The server remains the source of truth. Relying on `/customers/me` ensures the session is currently valid and active on the backend.*
5. **What is the difference between authentication and authorization?**  
   *Authentication verifies who the user is (e.g., verifying login credentials). Authorization determines what resources the authenticated user is allowed to access.*

### Lab 03
1. **Why should product data come from MongoDB instead of being hardcoded in React?**  
   *Dynamic databases allow inventory updates, prices, and stock changes to be updated centrally without rebuilding or redeploying the client application.*
2. **What is the difference between a URL parameter and a query parameter?**  
   *URL parameters (`/products/:id`) identify a specific resource hierarchy. Query parameters (`/products?category=Electronics`) filter, sort, or paginate that resource collection.*
3. **When would you use `/products/:id` vs `/products?category=Electronics`?**  
   *Use `/products/:id` to retrieve one specific product by its unique identifier. Use query parameters to filter or search through a list of products.*
4. **Why should search/filtering be handled by the backend instead of React?**  
   *In production catalogs with thousands of items, transferring the entire dataset to the client wastes bandwidth and memory. The database can leverage indexes for fast queries.*

### Lab 04
1. **Why are we storing ObjectIds instead of Product objects in the wishlist?**  
   *To maintain normalization. If a product's price, title, or image changes in the Product collection, the wishlist automatically reflects the latest data without manual synchronization.*
2. **What does `ref: "Product"` do in Mongoose?**  
   *It tells Mongoose which model to look up when calling `.populate('wishlist')`, enabling relational querying in MongoDB.*
3. **What is the difference between embedding and referencing?**  
   *Embedding stores subdocuments directly inside the parent document (best for tightly coupled data with 1-to-few cardinality). Referencing stores only the ID and looks up documents across collections (best for shared data like products).*
4. **Why should wishlist endpoints be protected and not accept `userId` from the request body?**  
   *Accepting `userId` from the body creates an Insecure Direct Object Reference (IDOR) vulnerability where any user could modify another user's wishlist. Deriving the user identity strictly from the verified JWT ensures complete security.*

### Lab 05
1. **Why does cart state need to be shared globally?**  
   *Cart data must be kept consistent across the Navbar badge, Product Card button states, Cart Page, and Order Summary without duplicate fetches or prop drilling.*
2. **Why should product price and subtotal not be stored in the cart collection?**  
   *Prices can change in the catalog. Storing subtotal or unit prices in MongoDB leads to stale and inconsistent billing. Subtotal is derived dynamically: `Σ (product.price * quantity)`.*
3. **How do you prevent quantity from exceeding stock?**  
   *The backend validates `quantity <= product.stock` in `cart.controller.js` on both addition and updates, rejecting excess quantities with `400 Bad Request`. The frontend steppers also disable the `+` button when stock limit is reached.*
4. **What happens when the same product is added twice?**  
   *The backend detects the existing item in the customer's cart array and increments its `quantity` by 1 rather than creating duplicate rows.*
5. **How are individual item loading states handled in React?**  
   *By using an item loading dictionary `{ [productId]: boolean }` in `CartContext`, allowing only the modified item to disable or display a spinner while the rest of the cart remains responsive.*
