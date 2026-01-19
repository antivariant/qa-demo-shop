# Firestore Data Structure (SDET)

This document describes the collections and document schemas used in the SDET user service.

---

### 1. Collection: `sdet_user`
Profiles for SDET users (personal settings and bug counters).
- **Doc ID**: Firebase User UID.
- **Schema**:
  ```json
  {
    "uid": "firebase_uid_123",
    "email": "sdet@example.com",
    "displayName": "SDET User",
    "name": "Igor",
    "bugsEnabled": 5,
    "bugsFound": 0,
    "createdAt": "2026-01-02T07:00:00.000Z",
    "updatedAt": "2026-01-02T07:10:00.000Z"
  }
  ```
