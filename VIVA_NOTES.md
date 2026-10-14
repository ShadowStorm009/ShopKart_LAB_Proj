# ShopKart — Complete Revision & Viva Notes

> One document to answer **any** question: from "what is Mongoose?" to "how does HMAC signature verification secure Razorpay payments?"
> Read in order for a full mental model, or jump to a section. Everything references real files/lines in this repo.

---

## 0. The 30-second pitch (memorize this)

> **ShopKart is a full-stack MERN e-commerce app** built across 6 labs. The backend is an **Express REST API** talking to **MongoDB via Mongoose**, with **JWT authentication stored in HttpOnly cookies** and passwords hashed with **bcrypt**. The frontend is a **React + Vite SPA** using **React Router** for navigation and **React Context** for global auth/cart state. It supports product browsing with search/filter/sort, a wishlist, a persistent cart, and a full **Razorpay test-mode checkout** where payment signatures are verified **server-side** before an order is confirmed.

If you only remember 5 things:
1. **Auth** = bcrypt hash + JWT in HttpOnly cookie.
2. **Cart/Wishlist** = arrays of ObjectId refs on the Customer document, populated on read.
3. **Totals & stock are always recomputed on the server** (never trust the client).
4. **Orders snapshot the price** at purchase time.
5. **Payment is only "successful" after the server verifies the HMAC SHA256 signature.**

---

## 1. Tech stack & *why each piece exists*

| Layer | Tech | Why it's used |
|---|---|---|
| Runtime | **Node.js** | Runs JavaScript outside the browser so one language covers front + back. Non-blocking I/O suits APIs. |
| Web framework | **Express 4** | Minimal routing + middleware layer over Node's `http`. |
| Database | **MongoDB** | Document store; flexible JSON-like documents fit nested data (cart, order items). |
| ODM | **Mongoose** | Schema validation, casting, methods, hooks, `populate`. Gives structure Mongo lacks natively. |
| Auth | **jsonwebtoken (JWT)** | Stateless signed token → server doesn't store sessions. |
| Hashing | **bcryptjs** | Slow, salted, one-way password hashing (adaptive cost factor). |
| Cookies | **cookie-parser** | Parses the `Cookie` header into `req.cookies`. |
| Config | **dotenv** | Loads secrets from `.env` into `process.env`. |
| CORS | **cors** | Allows the browser (5173) to call the API (5000) with credentials. |
| Payments | **razorpay** SDK | Server-side creation of Razorpay orders + signature verification. |
| Frontend | **React 18** | Component-based UI with declarative state. |
| Build tool | **Vite 6** | Instant dev server + HMR + optimized production bundle. |
| Routing | **react-router-dom 6** | Client-side routing / SPA navigation. |
| HTTP client | **axios** | Promise-based HTTP with interceptors + `withCredentials`. |
| Styling | **Tailwind CSS 3** | Utility-first CSS; fast, consistent styling. |
| Icons | **lucide-react** | SVG icon components. |
| Tests/fallback | **mongodb-memory-server** | Zero-config in-memory Mongo if local DB is missing. |

---

## 2. Architecture & folder map

```
shopkart/
├── backend/
│   ├── index.js                 # App entry: middleware, route mounting, auto-seed, listen
│   ├── config/
│   │   ├── db.js                # Mongo connect + in-memory fallback
│   │   └── razorpay.js          # Razorpay client singleton
│   ├── models/                  # Mongoose schemas (customer, product, order)
│   ├── controllers/             # Business logic per resource
│   ├── routes/                  # URL → controller wiring
│   ├── middlewares/             # auth.middleware.js (protect)
│   ├── utils/                   # generateToken.js (JWT + cookie)
│   ├── seeds/seedProducts.js    # Initial catalog data
│   └── verifyLab6.js            # Automated end-to-end payment tests
├── frontend/
│   └── src/
│       ├── App.jsx              # Routes + ProtectedRoute guard
│       ├── services/api.js      # Single axios instance + all API calls
│       ├── context/             # AuthContext, CartContext (global state)
│       ├── components/          # Navbar, ProductCard, CartItem, WishlistCard, SearchBar
│       └── pages/               # One file per route/screen
└── Lab-0X *.md                  # Per-lab specs / acceptance criteria
```

**Request lifecycle (backend):**
`request` → **CORS** → **express.json** → **cookieParser** → **router** → **protect middleware** (if protected) → **controller** → **Mongoose model** → **MongoDB** → `res.json()` → (on error) **central error handler**.

**This is an MVC-ish layering:** Models (data) / Controllers (logic) / Routes (URL mapping) — Middleware sits in front as guards/parsers.

---

## 3. Absolute-basics Q&A (the "obvious" questions)

**Q: What does MERN stand for?**
MongoDB, Express, React, Node.js — a JS-only stack for the whole app.

**Q: What is an API? REST?**
An API is a contract for two programs to talk. REST is a style where you use URLs (resources) + HTTP verbs: `GET` (read), `POST` (create), `PUT/PATCH` (update), `DELETE` (remove). Our routes map directly, e.g. `GET /products`, `POST /cart/:productId`.

**Q: What is middleware?**
A function `(req, res, next)` that runs between request and response. It can modify `req/res`, end the response, or call `next()` to continue. `express.json`, `cors`, `cookieParser`, and `protect` are all middleware.

**Q: Why do we need `express.json()`?**
To parse the JSON request body into `req.body`. Without it, `req.body` is undefined for JSON POST/PATCH requests.

**Q: What is `cookieParser()`?**
It reads the browser's `Cookie` header and exposes objects via `req.cookies` (we read `req.cookies.token`).

**Q: What is MongoDB, and why a document DB?**
A NoSQL database storing BSON documents (JSON-like) in collections. Flexible/embedded documents fit our nested `cart`, `items`, and `shippingAddress` naturally — no joins required.

**Q: What is Mongoose and why not use the raw `mongodb` driver?**
Mongoose is an **ODM** (Object-Document Mapper). It gives us:
- **Schema + validation** (`required`, `min`, `enum`, custom `match` regex) — data integrity at the app layer.
- **Type casting** (strings → ObjectId/Number).
- **Middleware hooks** (`pre('save')` to hash passwords, `pre('validate')` to sync aliases).
- **Instance/static methods** (`comparePassword`, `toJSON`).
- **`populate`** to resolve references.
- **Plugins/indexes** for performance.
Raw driver is lower-level; Mongoose saves boilerplate and prevents bad data.

**Q: What is a "model"? Why not just query the DB directly?**
A model = a compiled Mongoose schema; it's the **blueprint + API for one collection**. `Customer`, `Product`, `Order` are models. Benefits: one source of truth for shape, validation, and reusable methods; controllers stay clean. Analogy: a **class** (model) vs **instances** (documents).

**Q: What is a schema?**
The structure/definition of documents: fields, types, defaults, validators, indexes, hooks. `customer.model.js:4`.

**Q: What is `timestamps: true`?**
Mongoose auto-manages `createdAt` and `updatedAt` on every document.

**Q: What is an ObjectId?**
MongoDB's 12-byte unique primary key (`_id`). We store ObjectIds in `wishlist`/`cart` to reference products.

**Q: What does `populate()` do?**
Replaces stored ObjectIds with the actual referenced documents. Without it, `cart.product` is just an id; with it, it's the full product object. `cart.controller.js:82`, `wishlist.controller.js:78`.

**Q: Why is `mongoose.Types.ObjectId.isValid(id)` checked everywhere?**
To avoid a CastError crash when a malformed id is passed. We return `400 Invalid ... ID` early (`cart.controller.js:15`).

**Q: What is an index, and why one here?**
An index is a sorted lookup structure that speeds queries. `product.model.js:43` declares `{ name: "text", category: 1 }` to support text search on name + fast category filtering. (Note: our actual search uses `$regex`; the index is declared for future/text use — a fair answer if asked.)

**Q: What is CORS? Why configure it?**
Cross-Origin Resource Sharing. The SPA (origin `localhost:5173`) calling the API (`localhost:5000`) is cross-origin; the browser blocks it unless the server sends `Access-Control-Allow-Origin`. We also need `credentials: true` so the HttpOnly cookie is sent/accepted (`index.js:43-54`).

**Q: What is `dotenv` and why?**
Loads variables from `.env` into `process.env` so secrets/ports aren't hard-coded (`index.js:1-2`).

**Q: What is JSON / JSX / SPA / npm?**
- **JSON**: text format for structured data over HTTP.
- **JSX**: HTML-like syntax inside JS that React compiles to function calls.
- **SPA**: Single Page App — one HTML page; JS swaps views without full reloads (React Router).
- **npm**: Node package manager; scripts run via `npm run dev`.

**Q: What is React and why components/hooks?**
A library for building UIs from reusable components. **Hooks** are functions that add state/lifecycle to function components: `useState` (local state), `useEffect` (side effects), `useContext` (read context), `useMemo`/`useCallback` (memoization), `useParams`/`useNavigate` (router), `useRef` (DOM ref).

**Q: What is Context and why?**
A way to share state across the tree without prop-drilling. We use it for **auth** and **cart** (`AuthContext.jsx`, `CartContext.jsx`). Labs 05/06 require a global state solution.

**Q: What is axios and why an interceptor?**
A promise-based HTTP client. The **response interceptor** (`api.js:15-29`) normalizes every error into `{ status, message, data }` so UI code handles errors uniformly.

**Q: Common HTTP status codes used here?**
`200` OK, `201` Created, `400` Bad Request (validation), `401` Unauthorized (no/invalid token), `403` Forbidden (wrong owner), `404` Not Found, `409` Conflict (duplicate email/wishlist), `500` Server Error.

**Q: `import` vs `require`?**
This project uses **ES Modules** (`"type": "module"`), so we use `import`/`export` and must include `.js` in local import paths. `require` is CommonJS and is not used.

---

## 4. Data models deep-dive

### 4.1 Customer (`models/customer.model.js`)
| Field | Type | Notes |
|---|---|---|
| `fullName` | String | required, trimmed |
| `email` | String | required, **unique**, lowercase, regex-validated |
| `password` | String | required, min 6, **hashed in pre-save** |
| `phone` | String | required |
| `wishlist` | `[ObjectId→Product]` | array of refs |
| `cart` | `[{ product: ObjectId→Product, quantity: Number (min 1) }]` | array of subdocs |
| timestamps | | `createdAt`, `updatedAt` |

**Relationships:** one Customer → many wishlist Products (reference array), one Customer → many cart items (embedded subdocuments with a ref to Product). No separate Cart collection — the cart **belongs** to the user.

**Key methods/hooks:**
- `pre("save")` (`:59`): if `password` modified, `bcrypt.genSalt(10)` + `bcrypt.hash`. Guard `isModified` prevents double-hashing on profile/cart saves.
- `comparePassword(candidate)` (`:68`): `bcrypt.compare`.
- `toJSON()` (`:73`): deletes `password` from any serialized output (extra safety net beyond `select("-password")`).

### 4.2 Product (`models/product.model.js`)
`name, description, price (>0), category, image (URL), stock (≥0)`. Index on `{name:"text", category:1}`.

### 4.3 Order (`models/order.model.js`)
- `user` & `customer` — both ref "Customer" (aliases for TA flexibility), synced in `pre("validate")` (`:147`).
- `items[]` — embedded `orderItemSchema` with `product` ref **plus a price/name snapshot** (`:10-25`).
- `shippingAddress` — embedded subdoc with `addressLine1`/`street` and `pincode`/`postalCode` aliases synced in the hook.
- `totalAmount`/`subtotal` (synced), `shippingFee`, `paymentMethod`.
- `paymentStatus: PENDING | PAID | FAILED`.
- `status: PENDING_PAYMENT | PLACED | CONFIRMED | SHIPPED | DELIVERED | CANCELLED`.
- `razorpayOrderId`, `razorpayPaymentId`.

**Q: Why snapshot the price in the order item instead of only referencing the product?**
An order is a **historical receipt**. If the product price changes or the product is deleted, the order must still show what the customer actually paid. The `product` ref is kept for linkage, but `price`, `name`, `image` are frozen copies.

**Q: Why embed order items and shipping address rather than separate collections?**
They are owned by and read together with the order, have no independent lifecycle → embedding gives atomic, single-read retrieval. (General rule: embed data that's accessed together and has a 1-to-few relationship.)

---

## 5. Authentication flow (deep-dive, Lab 01/02)

### 5.1 Register — `POST /customers/register`
1. Destructure body; reject if any of `fullName/email/password/phone` missing → `400` (`customer.controller.js:14`).
2. Password `< 6` → `400` (`:22`).
3. `Customer.findOne({email})` → if exists return `409 Email already exists` (`:30`).
4. `Customer.create({...})` — **pre-save hook hashes the password** (`:42`).
5. Respond `201` with a safe customer object (no password) (`:50`).

### 5.2 Login — `POST /customers/login`
1. Require email + password → `400`.
2. Look up by normalized email.
3. If no user **or** wrong password → same generic `401 Invalid credentials` (prevents user enumeration) (`:93,101`).
4. `sendTokenCookie(res, customer._id)` sets the JWT cookie (`:109`).
5. Respond `200` with customer + token (token also returned for optional Bearer use).

### 5.3 JWT creation — `utils/generateToken.js`
- `generateToken(id)` → `jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" })` (`:8`). The payload contains only the user id.
- `sendTokenCookie(res, id)` sets cookie `token` with `httpOnly:true`, `secure` & `sameSite:"none"` only in production else `lax`, `maxAge` 7 days, `path:"/"` (`:20-32`).

### 5.4 Protecting routes — `middlewares/auth.middleware.js`
1. Read token from `req.cookies.token` (`:11`), else from `Authorization: Bearer <token>` (`:15`).
2. No token → `401`.
3. `jwt.verify(token, SECRET)` → decoded `{ id }`; `Customer.findById(decoded.id).select("-password")` (`:30-35`).
4. Attach `req.user = customer`, call `next()` (`:44`).
5. Any failure → `401` (`:46`). Used via `protect` on `me`, `change-password`, all wishlist/cart/order routes.

### 5.5 Logout / Me / Change-password
- **Logout** (`:169`): overwrites `token` with an expired empty cookie (`expires: new Date(0)`), `200`.
- **Me** (`:137`): returns `req.user` (set by middleware).
- **Change-password** (`:198`): verifies `oldPassword` with `comparePassword`, sets new password, `save()` re-hashes via hook.

**Concept Q&A — auth**
- **Why hash passwords, not encrypt?** Hashing is one-way + salted; even with DB access an attacker can't recover the original. Encryption is reversible, so a leaked key = all passwords.
- **Why bcrypt specifically?** Adaptive/slow + per-password salt → resistant to rainbow tables and brute force; you can raise the cost factor over time.
- **What is a JWT?** Three base64url parts: `header.payload.signature`. Signature = HMAC over header+payload with a secret → tamper-evident. Not encrypted, so never put secrets in the payload.
- **JWT vs session?** JWT is stateless (no server session store) — good for scaling, but hard to revoke before expiry. Sessions store state server-side and are easy to revoke.
- **Why only store `id` in the JWT?** Minimal payload; fresh user data is fetched from DB on each request, so role/profile changes take effect immediately.
- **Why HttpOnly cookie instead of localStorage?** HttpOnly cookies are inaccessible to JavaScript → an XSS payload can't steal the token. localStorage is readable by any JS on the page.
- **What is `withCredentials: true`?** axios setting that tells the browser to send/receive cookies cross-origin (`api.js:8`); pairs with server `credentials:true`.
- **Why `secure` and `sameSite:"none"` only in production?** Production is HTTPS (secure requires it). Dev uses HTTP `localhost`, so `lax` + non-secure works and avoids cross-site cookie issues.
- **CSRF?** Cookie auth can be CSRF-prone; `sameSite` mitigates it. (Our app is API-driven with same-site dev flow.)

---

## 6. Product catalog flow (Lab 03)

**`GET /products`** (`product.controller.js:69`): builds a dynamic `query`:
- `search` → `{ name: { $regex, $options:"i" } }` case-insensitive partial match (`:78`).
- `category` → case-insensitive **exact** match via anchored regex, ignoring `"all"` (`:82`).
- `sort` → `price_asc` / `price_desc` / `name_asc`, default `{createdAt:-1}` newest first (`:87-94`).
Returns `200 { count, products }`.

**`GET /products/:id`** (`:118`): validates ObjectId → `400`; not found → `404`; else product.

**`POST /products`** (`:9`): validates required fields, `price>0`, `stock≥0`, creates → `201`. (Public for now; admin auth is future.)

**Q: `$regex` vs text index?** `$regex` supports partial/substring search and is simple; text index does token/whole-word search and ranks results. For this catalog, regex is sufficient.

---

## 7. Wishlist flow (Lab 04)

Stored as `Customer.wishlist: [ObjectId]` — **no separate collection**.
- **Add** (`wishlist.controller.js:10`): validate id → product exists → check duplicate with `.some()` → `409` if dup → `push` + save.
- **Get** (`:75`): `findById(req.user._id).populate("wishlist")`, filter nulls, return `{count, wishlist}`.
- **Remove** (`:113`): validate → `findIndex` → `404` if absent → `splice` + save.
- **Toggle** (`:168`, bonus): if present remove, else add; returns `{saved, message}`.

**Lab 04 constraint — "no global state for wishlist core requirement":** the wishlist page fetches its own data and manages local `useState`; we do **not** put it in Context. (Only a lightweight `wishlistCount` badge lives in AuthContext for the navbar — the core requirement is satisfied because wishlist data/state isn't globally stored.)
**Q: Why ObjectId refs instead of embedding product copies?** Products are shared, mutable, single-source-of-truth entities. Refs avoid duplication/inconsistency; `populate` gives full data on read.

---

## 8. Cart flow (Lab 05) + Context

Stored as `Customer.cart: [{ product, quantity }]`.

**Backend (`cart.controller.js`)**
- **Add/increment** (`:10`): validate id → product exists → `stock>0` → find existing item → if present increment (but reject if increment > stock) else push qty 1 → save → **populate** → return `{cart}`.
- **Get** (`:109`): populate, filter deleted products.
- **Update qty** (`:145`): validate id, `Number.isInteger(qty) && qty≥1`, re-check product stock, find item, `404` if absent, set qty, save, populate.
- **Remove** (`:236`): find index, `404` if absent, splice.
- **Clear** (`:300`): `cart = []`.

Stock is validated on **every** mutation — the server never trusts the client's quantity.

**Frontend `CartContext.jsx`**
- Holds `cart`, `loading`, `error`, `itemLoading` (per-product spinners).
- `fetchCart` on user change (`:46`); clears when logged out.
- `addToCart/updateQuantity/removeFromCart/clearCart` call the API and replace state with the server's returned cart (server is source of truth); optimistic fallback on remove.
- **Derived values via `useMemo`** (`:144-158`): `totalCount` (sum of quantities), `itemCount` (distinct lines), `subtotal` (`Σ price×qty`). **Not stored** — computed from `cart`, avoiding duplicated/stale state.
- `isInCart`, `getItemQuantity` helpers (`useCallback`).

**Concept Q&A — cart/state**
- **Why derive totals instead of storing them?** Single source of truth (`cart`). Storing totals risks them drifting out of sync; `useMemo` recomputes only when `cart` changes.
- **Why store quantity but not price in the cart?** Price belongs to the product; we need it live, so we populate it. Quantity is cart-specific. (Price is frozen only at order time.)
- **Why Context for cart but not wishlist?** Cart must be visible app-wide simultaneously (navbar badge + multiple pages) and mutate from anywhere → global. Wishlist's Lab 04 core requirement forbids global state.
- **Why `useCallback` on `fetchCart`/helpers?** Stable references so `useEffect` deps don't cause infinite refetch loops.

---

## 9. Checkout / Razorpay flow (Lab 06) — the flagship deep-dive

### 9.1 Frontend initiation — `Checkout.jsx`
1. User fills shipping form; `validateForm()` checks required fields, ≥10-digit phone, 6-digit pincode (`:58`).
2. `loadRazorpayScript()` injects `checkout.razorpay.com/v1/checkout.js` dynamically (`:11`).
3. `createPaymentOrder(formData)` → backend (`:131`).
4. Build `options` with `key`, `amount`, `currency`, `order_id`, `handler`, `prefill`, `theme`, `modal.ondismiss`, then `new window.Razorpay(options).open()` (`:140-206`).

### 9.2 Backend step 1 — `createPaymentOrder` (`order.controller.js:47`)
1. `validateShippingAddress` (`:11`): shape + phone regex + line1/city/state + 6-digit pincode.
2. Load `Customer` with cart; empty cart → `400` (`:70`).
3. For each cart item: reload the **current** Product; verify it exists; verify `item.quantity <= product.stock`; accumulate `totalAmount = Σ product.price × quantity`; build `orderItems` with **frozen price snapshot** (`:81-115`).
4. Reject `totalAmount <= 0`.
5. Save a ShopKart `Order` with `paymentStatus:"PENDING"`, `status:"PENDING_PAYMENT"` (`:128`).
6. Create the **Razorpay order** with `amount = Math.round(totalAmount * 100)` (**paise**, 1 INR = 100 paise), `currency:"INR"`, `receipt = order id`, notes (`:154-164`).
7. Save `razorpayOrderId` back on the order (`:167`).
8. Return `{ shopKartOrderId, razorpayOrderId, amount, currency, key }` — **never the key secret** (`:171`).

### 9.3 Razorpay checkout → handler
On success Razorpay calls `handler(response)` with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.

### 9.4 Backend step 2 — `verifyPayment` (`order.controller.js:196`)
1. Require `shopKartOrderId`, `razorpay_payment_id`, `razorpay_signature`; validate ObjectId (`:205-217`).
2. Load Order; `404` if missing (`:220`).
3. **Ownership check**: `order.user === req.user._id` else `403` (`:229`).
4. **Idempotency**: if already `PAID`, return `200` early (`:236`) — prevents double stock deduction on retries.
5. **Signature verification**: build `body = "${order.razorpayOrderId}|${razorpay_payment_id}"` (using the **DB-stored** order id, `:245`), compute `crypto.createHmac("sha256", KEY_SECRET).update(body).digest("hex")` (`:248`).
6. If mismatch → mark `paymentStatus:"FAILED"`, `400` (**cart untouched**) (`:253`).
7. On match: deduct stock for each item (`$inc: {stock: -qty}`, `:263`), set `paymentStatus:"PAID"`, `status:"PLACED"`, store `razorpayPaymentId` (`:270`), then clear the user's cart (`:276`).
8. Return `200` with the order.

### 9.5 Frontend completion
`handler` calls `verifyPayment`; on success `clearCartState()` then `navigate('/order-success/:id')` (`Checkout.jsx:154-165`). `payment.failed` and `ondismiss` show errors and **retain the cart** (`:188,197`).

### 9.6 Other order endpoints
- `POST /orders` (`:302`): COD/direct. If `paymentMethod` is "Razorpay"/"Online" it delegates to `createPaymentOrder`; otherwise validates, recomputes, deducts stock immediately, marks `PLACED`, clears cart, `201`.
- `GET /orders` (`:428`): user-scoped, newest first, `.lean()` (plain JS objects, faster).
- `GET /orders/:id` (`:454`): ObjectId check, `404`, **ownership `403`**, else order.
- `PATCH /orders/:id/status` (`:500`): whitelist statuses, ownership check, update (bonus).

**Concept Q&A — payments**
- **Why create the Razorpay order server-side?** To keep `key_secret` off the client and to control the amount. The client only gets the public `key_id` and order id.
- **Why paise?** Razorpay's smallest unit is paise; INR amounts must be integers. `₹499.00` → `49900`.
- **What is a signature and why HMAC?** Razorpay signs `order_id|payment_id` with your secret. Only someone with the secret can produce a matching signature. HMAC-SHA256 is a keyed hash → guarantees authenticity + integrity.
- **Why trust the DB's `razorpayOrderId`, not the request?** The client sends `razorpay_order_id` too; an attacker could substitute another order. Using the stored id binds verification to the order we actually created.
- **Why clear the cart only after verification?** A client reporting `{paymentSuccess:true}` is forgeable. Clearing only after the server validates the signature prevents free orders and lost carts on failure.
- **What is idempotency here?** Repeated verification calls (network retries) return the same success without re-deducting stock or error-ing.
- **What is `receipt` / `notes`?** Metadata linking the Razorpay order back to our order id / customer.
- **Why deduct stock on the server after payment (not at add-to-cart)?** Reserving stock at cart time would lock inventory; we re-validate at checkout and decrement only on a confirmed order.
- **Race condition risk?** Two concurrent checkouts could oversell since stock check and decrement aren't atomic. A production fix would use a conditional `findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })` or transactions. (Good "I know the limitation" answer.)

---

## 10. Frontend architecture deep-dive

- **`main.jsx`** boots React into `#root`.
- **`App.jsx`**: wraps the app in `AuthProvider` → `CartProvider` → `Router`. Defines routes and two guards:
  - `ProtectedRoute` (`:21`): while `loading` shows a spinner; if no `user`, `<Navigate to="/login" replace />`; else renders children.
  - `RootRedirect` (`:45`): `/` → `/home` if logged in else `/login`.
- **Route table:** `/register`, `/login`, `/home` (protected), `/products`, `/products/:id`, `/wishlist` (protected), `/cart` (protected), `/checkout` (protected), `/orders` + `/orders/:id` (protected), `/order-success/:id` (protected), `*` → 404.
- **`AuthContext`**: `user`, `loading`, `wishlistCount`; `checkAuth()` on mount calls `GET /customers/me` (session restore from cookie) + wishlist count; `logout()`.
- **`CartContext`**: described in §8; auto-syncs when `user` changes.
- **Components:** `Navbar` (auth links + live wishlist/cart badges), `ProductCard` (add to cart / add another / wishlist), `WishlistCard` (move to cart), `CartItem` (qty stepper capped by stock), `SearchBar` (debounced search).
- **`services/api.js`**: one axios instance (`baseURL`, `withCredentials`, error interceptor) + named exports per lab. Centralizing calls keeps components clean and consistent.

**Q: How does the app "remember" login after refresh?** The HttpOnly cookie persists; on mount `AuthContext.checkAuth()` calls `/customers/me`, which the `protect` middleware authorizes via the cookie → `user` is restored.

**Q: Why `ProtectedRoute` render a spinner while `loading`?** To avoid a redirect-to-login flash before the session check finishes.

---

## 11. Lab-by-lab compliance map (quick recall)

| Lab | Deliverable | Where |
|---|---|---|
| 01 | Customer model, bcrypt, JWT, register/login, auth middleware | `customer.model.js`, `generateToken.js`, `auth.middleware.js`, `customer.controller.js` |
| 02 | Protected routes + React auth UI/session | `customer.routes.js`, `AuthContext.jsx`, `Login/Register/Home` |
| 03 | Product model + search/filter/sort catalog | `product.model.js`, `product.controller.js`, `Products.jsx`, `ProductDetails.jsx` |
| 04 | Wishlist add/get/remove/toggle, **no global state** | `wishlist.controller.js`, `Wishlist.jsx`, `WishlistCard.jsx` |
| 05 | Cart add/get/update/remove/clear + **Context global state** + derived totals | `cart.controller.js`, `CartContext.jsx`, `Cart.jsx`, `CartItem.jsx` |
| 06 | Checkout, Razorpay order, HMAC verify, orders, stock, cart clearing | `order.controller.js`, `order.model.js`, `Checkout.jsx`, `Orders.jsx`, `OrderDetails.jsx`, `OrderSuccess.jsx` |

Bonus features implemented: refresh/change password (`change-password`), sorting, wishlist toggle, order-status progression, in-memory DB fallback, auto-seed, `verifyLab6.js` automated tests.

---

## 12. Cross-cutting / "explain why" questions

- **IDOR prevention**: every protected resource is scoped to `req.user` (`Order.find({user: req.user._id})`, ownership `403` checks). We never accept a `userId` from the body.
- **Server-side validation everywhere**: both Mongoose schema validators and explicit controller checks (defense in depth).
- **Defense against client tampering**: totals, stock, and prices are recomputed server-side; client values are ignored except the shipping address/product ids.
- **`toJSON` + `select("-password")`**: two independent layers ensuring passwords never leave the DB layer.
- **`enum` on `paymentStatus`/`status`**: restricts values to valid states.
- **`.lean()`** on order reads: returns plain objects, faster/leaner than full Mongoose docs.
- **In-memory fallback** (`db.js`): the app still runs/seed/tests without a local Mongo install.
- **Auto-seed** (`index.js:21`): if `Product.countDocuments() === 0`, insert sample catalog so the app is usable immediately.

---

## 13. Rapid-fire Q&A (likely questions + one-line answers)

1. **What's the difference between `PUT` and `PATCH`?** PUT replaces the whole resource; PATCH updates part. We use PATCH for partial updates (qty, status, password).
2. **Why `res.status(201)` on create?** 201 means "Created" — semantically correct for new resources.
3. **Why `.trim()` and `.toLowerCase()` on email?** Normalize input so `A@x.com` and `a@x.com` collide as intended and whitespace doesn't break lookups.
4. **What does `sameSite: 'lax'` mean?** The cookie is sent on same-site and top-level navigations, not cross-site subrequests → basic CSRF protection.
5. **Why return `{success, message}` consistently?** Predictable client handling; interceptor relies on `message`.
6. **What is middleware ordering and why does it matter?** `express.json`/`cookieParser` must run before routes that read body/cookies; error handler must be last.
7. **Why `router.use(protect)` in order routes?** Applies auth to *all* order endpoints once, DRY.
8. **What is `next()`?** Hands control to the next middleware; omitting it stalls the request.
9. **Why is the 404 handler before the error handler?** It catches unmatched routes; the 4-arg error handler only runs on `next(err)`/thrown errors.
10. **What is the difference between a 401 and 403?** 401 = not authenticated (no/invalid token); 403 = authenticated but not allowed (wrong owner).
11. **Why use `useParams` in ProductDetails/OrderDetails?** To read the dynamic `:id` from the URL.
12. **What does `replace` on `<Navigate>` do?** Replaces history entry instead of pushing, so Back doesn't loop to the guarded page.
13. **Why debounce search?** Avoids firing an API call on every keystroke — fewer requests, smoother UX.
14. **What is HMR?** Hot Module Replacement — Vite updates modules in the browser without a full reload.
15. **What's the difference between controlled and uncontrolled components?** Controlled inputs bind value to React state (`Checkout` form) — the source of truth is React.
16. **Why `key` prop in `.map()`?** Helps React identify which list items changed for efficient reconciliation.
17. **What is `Math.round(total*100)` guarding against?** Floating-point errors when converting rupees to paise.
18. **Why `crypto` (Node built-in) not a library for HMAC?** It's standard, battle-tested, and built into Node.
19. **What is `.lean()`?** Returns plain JS objects, skipping Mongoose document wrapping — faster for read-only responses.
20. **Why does cart have both `product` ref and `quantity`?** Ref identifies what; quantity says how many.

---

## 14. Known weaknesses / honest answers (impress the examiner)

1. **Stock race condition** — check-then-decrement is not atomic; concurrent checkouts could oversell. Fix: conditional `$inc` with `stock: {$gte: qty}` or transactions.
2. **Secrets committed** — `backend/.env` and a Razorpay test-keys CSV are in the repo. These are **test-mode** keys, but real secrets must never be committed (use env managers/`.gitignore`).
3. **No central async error wrapper** — each controller has its own `try/catch` (repetitive). Could use an `asyncHandler` + `next(err)`.
4. **Product `POST` is public** — admin authorization is out of scope for these labs.
5. **Text index declared but search uses `$regex`** — slightly inconsistent; a future optimization is `$text` search.
6. **Vite proxy config only lists `/customers`, `/products`, `/wishlist`** — but `api.js` uses an absolute `baseURL`, so the proxy is effectively unused; CORS handles everything. (Know this if asked about the proxy.)
7. **`Checkout` empty-cart flash** — `cart.length === 0` can briefly show the empty state before `CartContext` finishes loading. A `loading` check would fix it.
8. **Idempotency only on `verifyPayment`** — other endpoints are not idempotent.
9. **No refresh-token rotation** — a single 7-day JWT; short-lived access + refresh tokens would be more secure.
10. **Address fields duplicated** (`addressLine1`/`street`, `pincode`/`postalCode`) for compatibility — a `pre('validate')` hook keeps them synced, but it's redundant.

---

## 15. One-line glossary

- **ODM** – Object-Document Mapper (Mongoose).
- **Schema** – document blueprint with validation.
- **Model** – compiled schema; query interface for a collection.
- **Document** – a single record instance.
- **populate** – resolve referenced ObjectIds into full documents.
- **Middleware** – function in the request/response pipeline.
- **JWT** – signed, stateless auth token.
- **bcrypt** – salted, adaptive password hashing.
- **HMAC** – keyed hash for message authentication (payment signatures).
- **Idempotency** – repeating an operation yields the same result (no double side effects).
- **IDOR** – Insecure Direct Object Reference; prevented by ownership checks.
- **SPA** – Single Page Application.
- **Context** – React API for global state.
- **Hook** – function adding state/lifecycle to function components.
- **Paise** – 1/100 of an INR; Razorpay's amount unit.
- **Snapshot** – frozen copy of data (order item price) at a point in time.

---

## 16. Controller-by-controller: what each function does + alternatives

> Format: **function → what it does → where → alternative approaches (and trade-offs)**.
> Handy if asked "why did you write it this way, and what else could you have done?"

### 16.1 `customer.controller.js` — auth & profile

| Function | What it does | Alternative(s) |
|---|---|---|
| `registerCustomer` (`:9`) | Validate fields → `findOne` dup email → `create` (pre-save hashes) → `201` safe object | (a) Let Mongoose's `unique` index throw and catch the `E11000` duplicate-key error instead of a manual `findOne`; (b) email verification link; (c) `express-validator`/`zod`/`joi` for declarative validation instead of hand-rolled `if`s |
| `loginCustomer` (`:75`) | Find by email → `comparePassword` → set HttpOnly cookie → `200` | (a) Passport.js local strategy; (b) OAuth (Google/GitHub); (c) magic-link/OTP; (d) issue access+refresh token pair |
| `getProfile` (`:137`) | Return `req.user` (set by `protect`) | A dedicated `/session` endpoint hitting a session store instead of JWT |
| `logoutCustomer` (`:169`) | Overwrite cookie with expired one | (a) Token blacklist/denylist; (b) server-side session destroy; (c) short token + refresh rotation (stateless JWTs can't truly be revoked) |
| `changePassword` (`:198`) | Verify old → set new → `save()` re-hashes | (a) Require email OTP; (b) invalidate existing tokens after change (not done here) |

### 16.2 `product.controller.js` — catalog

| Function | What it does | Alternative(s) |
|---|---|---|
| `createProduct` (`:9`) | Validate + `Product.create` → `201` | Seed script / admin panel; bulk import CSV; image upload via `multer` + cloud storage instead of URL strings |
| `getProducts` (`:69`) | Build dynamic query: `$regex` search, exact-ish category, sort → list | (a) `$text` index search (relevance-ranked, whole-word); (b) MongoDB Atlas Search; (c) Elasticsearch/Meilisearch for fuzzy/typo-tolerant; (d) pagination via `limit/skip` or cursor |
| `getProductById` (`:118`) | ObjectId check → find → `404`/product | `Aggregate` with `$lookup` if you needed related data in one call |

### 16.3 `wishlist.controller.js` — Lab 04

| Function | What it does | Alternative(s) |
|---|---|---|
| `addToWishlist` (`:10`) | Validate → product exists → dup check (`some`) → `push` + save | MongoDB `$addToSet` (built-in uniqueness, atomic, one round-trip) instead of manual dup check |
| `getWishlist` (`:75`) | `findById(...).populate("wishlist")` → `{count, wishlist}` | Separate `Wishlist` collection `{user, product}` with a compound unique index; aggregation `$lookup` |
| `removeFromWishlist` (`:113`) | `findIndex` → `404` → `splice` + save | `$pull` update operator (`Customer.updateOne({_id}, {$pull:{wishlist:pid}})`) — atomic, no full doc save |
| `toggleWishlist` (`:168`) | If present remove else add → `{saved}` | `$pull` + `$addToSet` conditional; frontend decides add vs remove |

**Trade-off note:** array-on-user is simple and fast for small lists but grows the user doc and lacks per-item metadata (added date); a join collection scales better and supports timestamps.

### 16.4 `cart.controller.js` — Lab 05

| Function | What it does | Alternative(s) |
|---|---|---|
| `addToCart` (`:10`) | Validate id → stock>0 → find existing → increment or push qty 1 → save → populate | (a) `$inc`/`$addToSet`-style atomic updates; (b) a `Cart` collection keyed by user; (c) reserve stock (not done — we re-check at checkout) |
| `getCart` (`:109`) | Populated cart, filters deleted products | Aggregation `$lookup`; store a denormalized snapshot in the cart (rejected — wasteful/stale) |
| `updateCartQuantity` (`:145`) | Validate integer ≥1, re-check stock, set qty, save | Atomic `$set` on the matched array element with array filters |
| `removeFromCart` (`:236`) | Find index → `404` → `splice` | `$pull` operator |
| `clearCart` (`:300`) | `cart = []` | `$set: {cart: []}` update; also auto-cleared after verified payment |

**Alternative architecture:** separate `Cart` document per user (supports guest carts, multiple carts, TTL cleanup via `expireAfterSeconds`) vs the chosen embedded array (simpler, one document read).

### 16.5 `order.controller.js` — Lab 06

| Function | What it does | Alternative(s) |
|---|---|---|
| `validateShippingAddress` (`:11`, helper) | Pure function returning an error string or `null` | `zod`/`joi`/`express-validator` schema; Mongoose nested-schema validation alone |
| `createPaymentOrder` (`:47`) | Auth address → load cart → reload products → **recompute total** → stock check → save pending Order → create Razorpay order (paise) → save `razorpayOrderId` → return public `key` | (a) Stripe/PayU/PayPal; (b) reserve stock here with a TTL; (c) DB transaction wrapping order+stock; (d) store amount only after Razorpay confirms |
| `verifyPayment` (`:196`) | Ownership → idempotency (`PAID`) → **HMAC SHA256** over DB order id → mismatch `FAILED` / match → decrement stock → mark PAID+PLACED → clear cart | (a) Rely on **Razorpay webhooks** (`payment.captured`) as the source of truth instead of the client callback; (b) capture-then-verify flow; (c) retry/queue for stock deduction; (d) atomic conditional `$inc` to avoid oversell |
| `createOrder` (`:302`) | COD/direct; delegates to `createPaymentOrder` for online methods; else recompute, deduct stock, `PLACED`, clear cart | Separate `/orders/cod` route; Payment Intents pattern; invoice generation |
| `getOrders` (`:428`) | User-scoped, newest first, `.lean()` | Pagination (`limit/skip`/cursor); aggregations for summaries; caching |
| `getOrderById` (`:454`) | ObjectId check → `404` → ownership `403` | `findOne({_id, user: req.user._id})` in one query (returns 404 for both missing & unowned — avoids leaking existence) |
| `updateOrderStatus` (`:500`) | Whitelist status → ownership → set status | Dedicated admin route with role checks; state-machine validation (e.g., can't go `DELIVERED → PLACED`); event-driven status updates |

**Webhook vs client callback (important):** our verify relies on the browser calling back after Razorpay's modal. A production-grade system also listens to Razorpay **webhooks** so orders are confirmed even if the user closes the tab. Worth mentioning as the "more robust" alternative.

### 16.6 Supporting modules (not controllers, but asked about)

| Module | Responsibility | Alternative(s) |
|---|---|---|
| `middlewares/auth.middleware.js` `protect` (`:7`) | Extract JWT (cookie → Bearer) → verify → load user → `req.user` | Passport-JWT strategy; session middleware (express-session); API keys for service-to-service |
| `utils/generateToken.js` (`:8`) | Sign 7-day JWT + set HttpOnly cookie | Access+refresh tokens; `jose` library; cookie-less (Authorization header only) — less XSS-safe |
| `config/db.js` (`:3`) | Connect Mongo, fallback to in-memory server | Docker Mongo; Atlas; connection pooling/retry options; `mongoose.connect` with SRV URI |
| `config/razorpay.js` (`:6`) | Razorpay client singleton from env keys | Instantiate per-request (unnecessary here); use a secrets manager for keys |
| `index.js` (`:21`, auto-seed) | Seed products if collection empty | Separate `npm run seed` script (already exists conceptually); migrations tool (e.g., migrate-mongo) |

**Cross-cutting alternative:** replace every controller's manual `try/catch` with an `asyncHandler(fn)` wrapper + centralized error middleware (`next(err)`), and a custom `ApiError` class for typed status codes.

---

### How to use this in the next 90 minutes
1. **30 min:** §0, §3, §4, §5 — build the core vocabulary + auth story.
2. **30 min:** §6–§9 — walk each flow out loud using the numbered steps.
3. **20 min:** §12–§13 — practice saying the "why" answers.
4. **10 min:** §14 — rehearse the honest-weakness answers (these impress most).
5. **Last:** skim §11 + §15 as a memory jog, and §16 for "what does this controller do / what else could you do?" questions.
