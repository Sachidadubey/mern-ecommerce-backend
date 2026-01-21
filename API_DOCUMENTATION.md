# 📚 API Documentation - E-commerce Backend

## Base URL

```
https://api.yourdomain.com/api
```

## Authentication

Most endpoints require Bearer token in Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## ✅ Authentication Endpoints

### 1. Register User

**POST** `/auth/register`

Create new user account and send OTP to email.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "OTP sent to email",
  "userId": "user_id_here"
}
```

**Errors:**

- 400: Invalid email or password too weak
- 409: Email already exists

---

### 2. Verify OTP

**POST** `/auth/verify-otp`

Verify email with OTP received.

**Request Body:**

```json
{
  "userId": "user_id_from_register",
  "otp": "123456"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Errors:**

- 400: Invalid OTP
- 404: User not found

---

### 3. Resend OTP

**POST** `/auth/resend-otp`

Resend OTP if user didn't receive it.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "OTP resent successfully"
}
```

---

### 4. Login User

**POST** `/auth/login`

Login user and get JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt_token_here"
}
```

**Note:** Refresh token sent in httpOnly cookie

**Errors:**

- 401: Invalid credentials
- 403: Email not verified

---

### 5. Logout

**POST** `/auth/logout` **(Protected)**

Logout user and clear session.

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 6. Forgot Password

**POST** `/auth/forgot-password`

Request password reset OTP.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password reset OTP sent to email"
}
```

---

### 7. Reset Password

**POST** `/auth/reset-password`

Reset password with OTP.

**Request Body:**

```json
{
  "userId": "user_id",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 📦 Product Endpoints

### 1. Get All Products

**GET** `/products?page=1&limit=10&category=electronics&sort=-createdAt`

Get paginated list of all products.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category
- `sort`: Sort by field (use `-` for descending)
- `search`: Search in product name
- `minPrice`: Minimum price
- `maxPrice`: Maximum price

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "stock": 50,
      "category": "electronics",
      "images": ["url1", "url2"],
      "rating": 4.5,
      "reviews": 10,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

---

### 2. Get Single Product

**GET** `/products/:id`

Get detailed information about a product.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "stock": 50,
    "category": "electronics",
    "images": ["url1", "url2"],
    "rating": 4.5,
    "reviews": [
      {
        "user": "user_name",
        "rating": 5,
        "comment": "Great product!",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 3. Create Product **(Admin Only)**

**POST** `/products` **(Protected)**

Create new product.

**Form Data:**

```
name: "Product Name"
description: "Product description"
price: 99.99
stock: 50
category: "electronics"
images: [file1, file2, file3]
```

**Response (201):**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    /* product data */
  }
}
```

---

### 4. Update Product **(Admin Only)**

**PUT** `/products/:id` **(Protected)**

Update product details.

**Request Body:**

```json
{
  "name": "Updated Name",
  "price": 89.99,
  "stock": 45
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    /* updated product */
  }
}
```

---

### 5. Delete Product **(Admin Only)**

**DELETE** `/products/:id` **(Protected)**

Soft delete product.

**Response (204):** No content

---

## 🛒 Cart Endpoints

### 1. Get Cart

**GET** `/cart` **(Protected)**

Get user's cart items.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "cart_id",
    "user": "user_id",
    "items": [
      {
        "product": {
          "_id": "product_id",
          "name": "Product Name",
          "price": 99.99,
          "image": "url"
        },
        "quantity": 2,
        "total": 199.98
      }
    ],
    "cartTotal": 199.98
  }
}
```

---

### 2. Add to Cart

**POST** `/cart` **(Protected)**

Add product to cart.

**Request Body:**

```json
{
  "productId": "product_id",
  "quantity": 1
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Product added to cart",
  "data": {
    /* updated cart */
  }
}
```

---

### 3. Update Cart Item

**PUT** `/cart/:itemId` **(Protected)**

Update quantity of cart item.

**Request Body:**

```json
{
  "quantity": 3
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    /* updated cart */
  }
}
```

---

### 4. Remove from Cart

**DELETE** `/cart/:itemId` **(Protected)**

Remove product from cart.

**Response (200):**

```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## 📦 Order Endpoints

### 1. Create Order

**POST** `/orders` **(Protected)**

Create new order from cart.

**Request Body:**

```json
{
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-123456",
    "user": "user_id",
    "items": [
      /* order items */
    ],
    "totalAmount": 199.98,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2. Get My Orders

**GET** `/orders` **(Protected)**

Get all orders of logged-in user.

**Response (200):**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-123456",
      "totalAmount": 199.98,
      "status": "delivered",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 3. Get Single Order

**GET** `/orders/:id` **(Protected)**

Get detailed order information.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-123456",
    "user": {
      /* user details */
    },
    "items": [
      /* order items */
    ],
    "totalAmount": 199.98,
    "status": "delivered",
    "address": {
      /* shipping address */
    },
    "payment": {
      "status": "completed",
      "method": "razorpay",
      "transactionId": "txn_123456"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. Cancel Order

**PUT** `/orders/:id/cancel` **(Protected)**

Cancel pending order.

**Response (200):**

```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

**Errors:**

- 400: Cannot cancel delivered/cancelled order

---

## 💳 Payment Endpoints

### 1. Create Payment Order

**POST** `/payment/create-order` **(Protected)**

Create Razorpay order for payment.

**Request Body:**

```json
{
  "orderId": "order_id",
  "amount": 199.98
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "orderId": "razorpay_order_id",
    "amount": 19998, // in paise
    "currency": "INR",
    "key": "razorpay_key_id"
  }
}
```

---

### 2. Verify Payment

**POST** `/payment/verify` **(Protected)**

Verify payment after user completes payment.

**Request Body:**

```json
{
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "orderId": "order_id",
    "status": "completed"
  }
}
```

---

### 3. Webhook

**POST** `/payment/webhook`

Razorpay webhook callback (automatic).

**No authorization required**

---

## ⭐ Review Endpoints

### 1. Add Review

**POST** `/reviews` **(Protected)**

Add review for purchased product.

**Request Body:**

```json
{
  "productId": "product_id",
  "rating": 5,
  "comment": "Great product!"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    /* review data */
  }
}
```

---

### 2. Get Product Reviews

**GET** `/reviews/:productId`

Get all reviews for a product.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "review_id",
      "user": { "name": "John Doe" },
      "rating": 5,
      "comment": "Great product!",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 3. Delete Review

**DELETE** `/reviews/:id` **(Protected)**

Delete own review.

**Response (200):**

```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

## 💖 Wishlist Endpoints

### 1. Get Wishlist

**GET** `/wishlist` **(Protected)**

Get user's wishlist items.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "price": 99.99,
      "image": "url"
    }
  ]
}
```

---

### 2. Add to Wishlist

**POST** `/wishlist` **(Protected)**

Add product to wishlist.

**Request Body:**

```json
{
  "productId": "product_id"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Added to wishlist"
}
```

---

### 3. Remove from Wishlist

**DELETE** `/wishlist/:productId` **(Protected)**

Remove product from wishlist.

**Response (200):**

```json
{
  "success": true,
  "message": "Removed from wishlist"
}
```

---

## 🔧 Utility Endpoints

### Health Check

**GET** `/health`

Check if server is running.

**Response (200):**

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Server Status

**GET** `/`

Get server information.

**Response (200):**

```json
{
  "success": true,
  "message": "E-commerce API Server",
  "version": "1.0.0",
  "powered": "Razorpay Payments"
}
```

---

## 🚨 Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error description",
  "stack": "Stack trace (only in development)"
}
```

### Common Error Codes

| Code | Message                              |
| ---- | ------------------------------------ |
| 400  | Bad Request - Invalid input          |
| 401  | Unauthorized - Missing/invalid token |
| 403  | Forbidden - Not allowed              |
| 404  | Not Found - Resource doesn't exist   |
| 409  | Conflict - Resource already exists   |
| 429  | Too Many Requests - Rate limited     |
| 500  | Internal Server Error                |

---

## 🔐 Authentication

### Get JWT Token

After login, use the `accessToken` in header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiration

- Access Token: 7 days
- Refresh Token: 30 days (in httpOnly cookie)

---

## 📝 Request Examples

### Using cURL

```bash
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Using JavaScript Fetch

```javascript
const response = await fetch("https://api.yourdomain.com/api/products", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
const data = await response.json();
```

### Using Axios

```javascript
const axiosInstance = axios.create({
  baseURL: "https://api.yourdomain.com/api",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const products = await axiosInstance.get("/products");
```

---

**Last Updated:** January 21, 2026  
**API Version:** 1.0.0
