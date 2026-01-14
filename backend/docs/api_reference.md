# API Reference

**Base URL**: `http://localhost:3000/api`  
**Currency**: All money values are **integers in cents** (USD).  
**Authentication**: Firebase ID Token passed as `Authorization: Bearer <token>`.

---

## Public Endpoints

### [GET] `/images/products/:filename`
Get resized product image.
- **Request**:
  - `width` (query, optional): Target width in pixels.
- **Response (200)**: Image binary (JPEG).
- **Headers**:
  - `Content-Type`: `image/jpeg`
  - `Cache-Control`: Controlled by server config (e.g., `public, max-age=3600` or `no-store`).

### [GET] `/health`
Check server status.
- **Request**: None
- **Response (200)**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-01-02T07:00:00.000Z"
  }
  ```

### [GET] `/products`
List all products. Includes mandatory price data.
- **Request**: 
  - `category` (optional): Filter products by category ID.
- **Response (200)**:
  ```json
  [
    {
      "id": "prod_001",
      "name": "California Roll",
      "description": "Crab, avocado, cucumber",
      "imageUrl": "https://example.com/cali.jpg",
      "categoryId": "rolls",
      "price": 1299,
      "currency": "USD"
    }
  ]
  ```

### [GET] `/categories`
List all categories.
- **Request**: None
- **Response (200)**:
  ```json
  [
    {
      "id": "rolls",
      "name": "Rolls"
    },
    {
      "id": "drinks",
      "name": "Drinks"
    }
  ]
  ```

### [GET] `/products/:id`
Get single product with price.
- **Response (200)**: Product object or **404** if not found/no price.

---

## Cart Endpoints (Auth Required)

### [GET] `/cart`
Get the current active cart.
- **Response (200)**: Updated Cart object.

### [POST] `/cart/items`
Add or update item.
- **Payload**: `{"productId": "...", "quantity": 1}`
- **Behavior**: 
  - If item exists in cart → adds quantity to existing.
  - If quantity results in 0 → removes item.
- **Response (200)**: Updated Cart object.

### [PATCH] `/cart/items/:itemId`
Set item quantity.
- **Payload**: `{"quantity": 5}`
- **Response (200)**: Updated Cart object.

### [DELETE] `/cart/items/:itemId`
Explicitly remove item from cart.
- **Response (200)**: Updated Cart object.

---

## Checkout & Orders (Auth Required)

### [POST] `/checkout`
- **Payload**:
  ```json
  {
    "paymentMethod": "card", // or "cash"
    "cardNumber": "9999 9999 9999 9999" 
  }
  ```
- **Response (201 Success)**:
  ```json
  {
    "orderId": "ord_xyz789",
    "newCartId": "cart_new_456",
    "status": "success"
  }
  ```
