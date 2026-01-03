# API Reference

**Base URL**: `http://localhost:3000/api`  
**Currency**: All money values are **integers in cents** (USD).  
**Authentication**: Firebase ID Token passed as `Authorization: Bearer <token>`.

---

## Public Endpoints

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
List all products.
- **Request**: None
- **Response (200)**:
  ```json
  [
    {
      "id": "prod_001",
      "name": "QA Testing Handbook",
      "description": "Comprehensive guide...",
      "imageUrl": "https://example.com/handbook.jpg",
      "categoryId": "books"
    }
  ]
  ```

---

## Cart Endpoints (Auth Required)

### [GET] `/cart`
Get the current active cart.
- **Response (200)**: Updated Cart object.

### [POST] `/cart/items`
Add item. Payload: `{"productId": "...", "quantity": 1}`.

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
