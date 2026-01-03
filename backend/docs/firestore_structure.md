# Firestore Data Structure

This document describes the collections and document schemas used in the demo e-commerce system.

---

### 1. Collection: `products`
Stores product metadata.
- **Doc ID**: Randomly generated (e.g., `prod_001`).
- **Schema**:
  ```json
  {
    "name": "QA Testing Handbook",
    "description": "Comprehensive guide for modern SDETs.",
    "imageUrl": "https://example.com/handbook.jpg",
    "categoryId": "books"
  }
  ```

### 2. Collection: `categories`
(Optional for now, but referenced)
- **Doc ID**: Descriptive ID (e.g., `books`, `electronics`).
- **Schema**: `{"name": "Books"}`

### 3. Collection: `pricelist`
Stores active prices for products. separate from catalogue for auditability.
- **Doc ID**: Randomly generated.
- **Schema**:
  ```json
  {
    "productId": "prod_001",
    "price": 4500,
    "currency": "USD",
    "isActive": true
  }
  ```

---

### 4. Collection: `carts`
Stores mutable user shopping carts. **Carts are never deleted.**
- **Doc ID**: Randomly generated (Cart ID).
- **Schema**:
  ```json
  {
    "userId": "firebase_uid_123",
    "status": "active", // "active" | "checked_out"
    "items": [
      {
        "productId": "prod_001",
        "name": "QA Testing Handbook",
        "quantity": 2,
        "price": 4500, // Captured at time of addition
        "itemTotal": 9000
      }
    ],
    "subtotal": 9000,
    "discount": 0,
    "total": 9000,
    "createdAt": "2026-01-02T07:00:00.000Z",
    "updatedAt": "2026-01-02T07:10:00.000Z",
    "linkedOrderId": "ord_789" // Present if status is "checked_out"
  }
  ```

### 5. Collection: `user_state`
Server-side mapping of users to their current active cart.
- **Doc ID**: Firebase User UID.
- **Schema**:
  ```json
  {
    "currentCartId": "cart_abc123",
    "updatedAt": "2026-01-02T07:10:00.000Z"
  }
  ```

---

### 6. Collection: `orders`
Immutable snapshots of successful transactions.
- **Doc ID**: Randomly generated (Order ID).
- **Schema**:
  ```json
  {
    "userId": "firebase_uid_123",
    "cartId": "cart_abc123",
    "items": [...], // Snapshot from CartItem[]
    "subtotal": 9000,
    "discount": 0,
    "total": 9000,
    "paymentMethod": "card", // "card" | "cash"
    "isPaid": true,
    "cardLast4": "4444", // If paymentMethod is card
    "status": "success",
    "createdAt": "2026-01-02T07:10:00.000Z"
  }
  ```
