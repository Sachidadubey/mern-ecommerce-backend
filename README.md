# mern-ecommerce-backend

A production-ready REST API for a full-featured e-commerce platform — built with Node.js, Express, and MongoDB. Handles everything from OTP-based user auth to Razorpay payments, order lifecycle management, and Cloudinary image uploads.

> This is a backend-only project. Plug it into any React/Next.js frontend via the REST API.

---

## What's inside

The project follows a clean service-controller pattern. Controllers stay thin — they receive the request and fire back a response. All the actual business logic lives in the service layer. This keeps things testable and easy to debug.

```
src/
├── controllers/     # Request handlers (thin layer)
├── services/        # Business logic lives here
├── models/          # Mongoose schemas
├── routes/          # Route definitions
├── middlewares/     # Auth, validation, error handling, uploads
├── config/          # DB, Cloudinary, Razorpay setup
├── utils/           # AppError, asyncHandler, JWT, OTP helpers
├── validations/     # Zod schemas for request validation
├── cron/            # Scheduled jobs (stuck payment recovery)
└── gateway/         # Payment gateway abstraction
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Payments | Razorpay |
| File Uploads | Multer + Cloudinary |
| Validation | Zod |
| Email | Nodemailer |
| Scheduled Jobs | node-cron |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |

---

## Features

**Auth**
- Register with OTP email verification
- Login with JWT access token + httpOnly refresh token cookie
- Token refresh endpoint
- Forgot password / reset password via OTP
- Rate limiting on auth routes (5 requests per 15 minutes)

**Products & Categories**
- CRUD with role-based access (admin only for create/update/delete)
- Cloudinary image upload (multi-image support)
- Low stock threshold + reorder quantity tracking
- Denormalized category name for fast reads
- Average rating + review count cached on product document

**Cart & Wishlist**
- Per-user cart with item-level quantity management
- Wishlist with add/remove

**Orders**
- Full order lifecycle: `PLACED → CONFIRMED → SHIPPED → DELIVERED → CANCELLED → REFUNDED`
- Separate tracking for payment status and shipping status
- Coupon/discount support on orders
- Admin notes + customer notes
- Compound index on `(user, createdAt)` for efficient user order history queries

**Payments (Razorpay)**
- Create payment order against an existing order
- Manual payment verification endpoint
- Refund processing (admin)
- Cron job runs every 10 minutes to auto-recover stuck/pending payments

**Coupons**
- Create and apply discount coupons at checkout

**Reviews**
- Users can review purchased products
- Rating aggregation reflected on product document

**Support**
- Support ticket system with chat thread model

**Admin**
- Separate admin routes for dashboard, user management, order management, refunds
- Audit log model for tracking admin actions
- Inventory log for stock changes

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Razorpay account (for payment features)
- Cloudinary account (for image uploads)
- SMTP credentials (for email/OTP)

### Installation

```bash
git clone https://github.com/Sachidadubey/mern-ecommerce-backend.git
cd mern-ecommerce-backend
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/ecommerce

# JWT
ACCESS_TOKEN_SECRET=your_access_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000`. Hit `/health` to verify it's up.

---

## API Overview

All routes are prefixed with `/api`.

| Prefix | Description |
|---|---|
| `/api/auth` | Register, login, OTP, token refresh, password reset |
| `/api/products` | Product CRUD + image upload |
| `/api/categories` | Category management |
| `/api/cart` | Cart operations |
| `/api/orders` | Place and manage orders |
| `/api/payment` | Razorpay payment flow |
| `/api/reviews` | Product reviews |
| `/api/wishlist` | Wishlist |
| `/api/coupons` | Coupon management |
| `/api/users` | User profile and address management |
| `/api/admin` | Admin-only routes |
| `/api/support` | Support tickets |

### Auth Flow

```
POST /api/auth/register       → sends OTP to email
POST /api/auth/verify-otp     → verifies OTP, account activated
POST /api/auth/login          → returns accessToken + sets refreshToken cookie
POST /api/auth/refresh-token  → get new accessToken
POST /api/auth/logout         → clears cookie
POST /api/auth/forgot-password → OTP to email
POST /api/auth/reset-password  → reset with OTP
```

Protected routes expect:
```
Authorization: Bearer <accessToken>
```

### Payment Flow

```
1. POST /api/orders           → place order (status: PLACED, payment: PENDING)
2. POST /api/payment/create   → create Razorpay payment order
3. [Frontend completes payment on Razorpay checkout]
4. POST /api/payment/verify   → verify payment signature → order marked PAID
```

---

## Security

- **Helmet** — sets secure HTTP headers
- **CORS** — restricted to whitelisted origins
- **Rate limiting** — 100 req/hour globally, 5 req/15min on auth routes
- **JWT** — short-lived access tokens (15m) + long-lived refresh tokens (7d) stored in httpOnly cookies
- **bcrypt** — passwords hashed with salt rounds of 12
- **Zod** — all incoming request bodies validated before hitting controllers
- **OTP attempts** — tracked and limited to prevent brute force

---

## Database Models

| Model | Purpose |
|---|---|
| User | Auth, profile, addresses, loyalty points, referral |
| Product | Catalog with inventory and rating |
| Category | Product categorization |
| Order | Full order + payment + shipping lifecycle |
| Payment | Razorpay payment records |
| Cart | User cart |
| Wishlist | User wishlist |
| Coupon | Discount codes |
| Review | Product reviews |
| OTP | OTP verification records |
| SupportTicket | Customer support |
| Chat | Support chat threads |
| AuditLog | Admin action tracking |
| InventoryLog | Stock change history |
| Notification | User notifications |

---

## Cron Jobs

There's one scheduled job that runs every 10 minutes:

**Stuck Payment Recovery** — finds orders that are stuck in `PENDING` payment status for too long and handles them automatically (cancel or flag for review).

To enable it, uncomment `startCrons()` in `src/server.js`.

---

## Project Structure Decisions

**Why service layer?** Controllers only handle HTTP. If you ever want to add GraphQL or a CLI tool, the service layer works without changes.

**Why Zod for validation?** Zod gives runtime type safety and clean error messages without a lot of boilerplate. Every route that accepts a body has a corresponding Zod schema in `/validations`.

**Why httpOnly cookie for refresh token?** Storing refresh tokens in localStorage exposes them to XSS. httpOnly cookies are inaccessible to JavaScript and safer for long-lived tokens.

**Why denormalized `categoryName` on Product?** Avoids a join on every product list query. Trade-off: you need to update it when a category name changes — handled in the admin service.

---

## Known Limitations / TODOs

- Razorpay webhook endpoint is currently commented out — using manual verification instead. Uncomment and configure webhook secret for production.
- `mongoSanitize` middleware is disabled due to a conflict with the request object. NoSQL injection protection is partially handled by Mongoose's query casting.
- Cron jobs are commented out by default — enable before deploying to production.

---

## Author

**Sachida Dubey**  
[GitHub]
(https://github.com/Sachidadubey)
