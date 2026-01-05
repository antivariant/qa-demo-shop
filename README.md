Отлично, давай сделаем **короткое, взрослое и читабельное описание**, без маркетинга и без лишних деталей — именно то, что ожидают увидеть в хорошем техническом репозитории.

Ниже — **готовый текст для `README.md` (Backend section)**. Его можно вставлять почти без правок.

---

## Backend Overview

This repository contains the backend implementation for a **demo e-commerce platform**, designed primarily for **QA / SDET training, testing demonstrations, and architectural experiments**.

The backend is intentionally built as a **clean, extensible skeleton**, serving as a *healthy baseline* that can later be extended with **intentional functional and security defects** without changing API contracts.

---

## Key Characteristics

* **API-first backend**
  A single REST API used by:

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

The backend supports three isolated environments:

* **Dev**

  * Uses Firestore Emulator
  * Supports local snapshots (save / restore)

* **Test**

  * Cloud environment for manual testing, regression, and acceptance testing

* **Prod**

  * Production-like environment used for demos, CI/CD, and smoke tests

---

## Data Management

Dedicated scripts are provided for:

* **Base seeding** (destructive reset of reference data)
* **Reference data synchronization**

  * Prod → Test
  * Prod → Dev
* **Emulator snapshots**

  * Save and restore full database state for local development

Only **reference data** (categories, products, prices) is synchronized.
Runtime data (carts, orders, user sessions) is intentionally excluded.

---

## Project Philosophy

This backend is not built to showcase frameworks or libraries.

Its purpose is to demonstrate:

* clean architectural thinking
* realistic data lifecycles
* testability by design
* safe evolution from a healthy system to intentionally broken ones
