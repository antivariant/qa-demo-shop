# API Reference (SDET)

**Base URL**: `http://localhost:3100/api`  
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

### [POST] `/sdet/auth/register`
Register a new SDET user.
- **Payload**:
  ```json
  {
    "email": "sdet@example.com",
    "password": "secret123",
    "name": "Igor"
  }
  ```
- **Response (201)**: SDET profile.

---

## SDET User (Auth Required)

### [GET] `/sdet/user`
Get current SDET user profile.
- **Response (200)**: SDET profile.

### [PUT] `/sdet/user`
Update SDET user profile.
- **Payload**:
  ```json
  { "name": "Igor" }
  ```
- **Response (200)**: Updated SDET profile.
