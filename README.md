## Backend Overview

This repository contains two backend services for a **demo e-commerce platform**, designed primarily for **QA / SDET training, testing demonstrations, and architectural experiments**.

- **backend-sandbox**: Store backend with catalog, cart, checkout, and orders.
- **backend-sdet**: SDET user backend with personalized settings and bug counters.

The backend is intentionally built as a **clean, extensible skeleton**, serving as a *healthy baseline* that can later be extended with **intentional functional and security defects** without changing API contracts.

---

## Key Characteristics

* **API-first backends**
  Two REST APIs used by:

  * Web application
  * Mobile application

* **Not production-oriented by design**
  Business logic is intentionally simplified, but the **architecture closely resembles real-world systems**.

* **Testing-focused architecture**
  The system is designed to:

  * support automated testing (API, integration, e2e)
  * demonstrate negative and security scenarios
  * evolve into a testing sandbox over time

---

## Architecture

* **Runtime**: Node.js
* **Framework**: Express.js
* **Language**: TypeScript
* **Database**: Firebase Firestore (document-oriented)
* **Authentication**: Firebase Authentication (email/password)

### Layered Structure

* **Controllers**
  Thin HTTP handlers with no business logic.

* **Services (Business Logic)**
  Isolated business mechanisms implemented via interfaces.
  Each mechanism has:

  * a defined contract (interface)
  * a single *healthy* implementation

* **Service Resolver**
  Centralized factory responsible for selecting service implementations.
  Currently hardcoded to healthy implementations, but designed for future switching.

---

## Core Domain Concepts

* **Products & Categories**
  Read-only catalog data.

* **Pricing**
  Prices are stored separately in a dedicated `pricelist` collection.
  This allows realistic testing of pricing, discounts, and security scenarios.

* **Cart Lifecycle**

  * Carts are **never deleted**
  * Each user has one active cart resolved server-side
  * Successful checkout closes the current cart and creates a new one

* **Orders**

  * Immutable records
  * Represent confirmed checkouts
  * Linked to the originating cart

* **User State**

  * Server-side tracking of the current active cart
  * Enables cart persistence across devices (web ↔ mobile)

---

## Environments

Each backend supports two isolated environments:

* **Dev**

  * Uses Firestore Emulator
  * Supports local snapshots (save / restore)

* **Test**

  * Cloud environment for manual testing, regression, and acceptance testing

* **Prod**

  * Production-like environment used for demos, CI/CD, and smoke tests

---

## Data Management

Dedicated scripts are provided for the **backend-sandbox** service:

* **Base seeding** (destructive reset of reference data)
* **Reference data synchronization**
  * Prod → Dev
* **Emulator snapshots**

  * Save and restore full database state for local development

Only **reference data** (categories, products, prices) is synchronized.
Runtime data (carts, orders, user sessions) is intentionally excluded.

## Env Files (overview)

We use two sets of env files:

* **`.env.dev`** (tracked) for local development and CI tests.
* **`.env.prod` / `.env.production`** (not tracked) for Docker runs (local + server).

Each machine keeps its own `.env.prod` / `.env.production` values.

---

## SSL (local, docker, prod)

### Local dev (npm run dev)

1) Generate a self-signed cert:

```bash
./nginx/scripts/generate-local-cert.sh
```

2) Enable SSL in the backend `.env.dev` files:

```
SSL_ENABLED=true
SSL_CERT_PATH=../nginx/certs/fullchain.pem
SSL_KEY_PATH=../nginx/certs/privkey.pem
```

### Local docker (qacedu.localhost)

- Ensure `nginx/certs/fullchain.pem` + `nginx/certs/privkey.pem` exist (use the script above).
- Provide a local nginx env file (example keys):

```
QACEDU_API_HOST=api.qacedu.localhost
QACEDU_INTERNAL_API_HOST=api-internal.qacedu.localhost
QACEDU_WEB_HOST=qacedu.localhost
QACEDU_TLS_CERT=/etc/nginx/certs/fullchain.pem
QACEDU_TLS_KEY=/etc/nginx/certs/privkey.pem
```

### Prod (qacedu.com)

- Mount Let’s Encrypt certs into the nginx container and point:

```
QACEDU_TLS_CERT=/etc/nginx/certs/fullchain.pem
QACEDU_TLS_KEY=/etc/nginx/certs/privkey.pem
```

- Example compose override:

```
NGINX_CERTS_DIR=/etc/letsencrypt/live/qacedu.com
```

---

## Project Philosophy

This backend is not built to showcase frameworks or libraries.

Its purpose is to demonstrate:

* clean architectural thinking
* realistic data lifecycles
* testability by design
* safe evolution from a healthy system to intentionally broken ones

Test: *****
