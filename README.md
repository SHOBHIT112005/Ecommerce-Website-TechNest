# TechNest — E-Commerce Platform

A modern, full-stack e-commerce web application with a **decoupled microservices architecture**: a Next.js frontend, a Go (Gin) backend API, PostgreSQL database, and Redis cache — all orchestrated via Docker Compose.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?style=for-the-badge&logo=go)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe)

---

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser   │─────→│   Frontend   │─────→│   Backend    │
│             │      │  (Next.js)   │ SSR  │   (Go/Gin)   │
│             │      │  :3000       │      │   :8080      │
└─────────────┘      └──────────────┘      └──────┬───────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                              ┌─────▼─────┐ ┌────▼────┐ ┌──────▼──────┐
                              │ PostgreSQL│ │  Redis  │ │   Stripe    │
                              │   :5432   │ │  :6379  │ │  (external) │
                              └───────────┘ └─────────┘ └─────────────┘
```

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, Redux Toolkit | 3000 | UI, SSR, authentication, state management |
| **Backend** | Go 1.23+, Gin framework, GORM | 8080 | REST API, business logic |
| **Database** | PostgreSQL 16 | 5432 | Persistent data storage |
| **Cache** | Redis 7 | 6379 | Cart sessions (Phase 3) |

---

## ✨ Features

### 🛍️ Shopping Experience
- **Product Browsing** — category organization, search, horizontal scroll sections
- **Product Filtering** — category pills, price range, sort by price/name
- **Product Detail Pages** — full descriptions, categories, large images
- **Shopping Cart** — add/remove with quantity tracking and toast notifications

### 💳 Checkout & Payments
- **Stripe Integration** — secure checkout session creation
- **Payment Verification** — webhook-based order status updates
- **Confirmation Flow** — modal confirmation before redirect to Stripe

### 📦 Order Management
- **Order History** — users can view and cancel pending orders
- **Status Tracking** — pending → completed → cancelled workflow
- **Admin Dashboard** — full order CRUD, analytics, monthly sales

### 👥 Authentication
- **NextAuth.js** — email/password with credentials provider
- **Role-based Access** — admin and user interfaces with middleware protection
- **User Registration** — built-in registration flow with rate limiting

### 🤖 AI Assistant
- **ChatBot** — AI-powered product recommendations via OpenRouter
- **Context-aware** — product-specific recommendations when viewing items

---

## 🗄️ Database Schema (PostgreSQL)

```
┌──────────┐       ┌────────────────────┐       ┌────────────┐
│  users   │       │ product_categories │       │ categories │
│──────────│       │────────────────────│       │────────────│
│ id (PK)  │       │ product_id (FK)    │       │ id (PK)    │
│ name     │       │ category_id (FK)   │       │ name (UQ)  │
│ email    │       └────────────────────┘       └────────────┘
│ role     │              ▲    ▲
│ ...      │              │    │
└────┬─────┘       ┌──────┘    └──────┐
     │             │                  │
     │ 1:N    ┌────┴─────┐            │
     │        │ products │            │
     │        │──────────│            │
     │        │ id (PK)  │────────────┘
     ▼        │ name     │
┌──────────┐  │ price    │
│  orders  │  │ ...      │
│──────────│  └────┬─────┘
│ id (PK)  │       │
│ user_id  │──┐    │
│ status   │  │  ┌─┴──────────┐
│ ...      │  │  │ order_items│
└──────────┘  │  │────────────│
              │  │ id (PK)    │
              │  │ order_id   │──→ orders.id
              │  │ product_id │──→ products.id
              │  │ quantity   │
              │  │ unit_price │
              │  └────────────┘
              └──→ users.id
```

### Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Registered & guest users | Has many `orders` |
| `products` | Product catalog (25 items) | Many-to-many with `categories` |
| `categories` | Product categories (4) | Many-to-many with `products` |
| `product_categories` | Join table | Links products ↔ categories |
| `orders` | Customer orders | Belongs to `users`, has many `order_items` |
| `order_items` | Line items within orders | Belongs to `orders` and `products` |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| Docker Desktop | Any recent | `docker --version` |
| Go | 1.23+ | `go version` |
| Node.js | 20+ | `node --version` |

> **No external accounts needed.** PostgreSQL and Redis run locally inside Docker containers.

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/yourusername/technest-ecommerce.git
cd technest-ecommerce

# Start all services (builds on first run)
docker compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080/health
```

### Local Development (without Docker)

```bash
# 1. Start PostgreSQL and Redis (still via Docker)
docker compose up postgres redis -d

# 2. Start the Go backend
cd backend
DATABASE_URL="host=localhost user=technest password=technest_pass dbname=technest_db port=5432 sslmode=disable" go run .

# 3. Start the Next.js frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

The root `.env` file contains all configuration:

```bash
# PostgreSQL
POSTGRES_USER=technest
POSTGRES_PASSWORD=technest_pass
POSTGRES_DB=technest_db

# Ports
BACKEND_PORT=8080
FRONTEND_PORT=3000

# API URLs (Go backend)
NEXT_PUBLIC_API_URL=http://localhost:8080
INTERNAL_API_URL=http://localhost:8080

# Stripe (test keys)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
ADMIN_EMAILS=admin@technest.local
```

---

## 📁 Project Structure

```
technest-ecommerce/
├── docker-compose.yml          # 4 services: frontend, backend, postgres, redis
├── .env                        # Shared environment variables
│
├── frontend/                   # Next.js application (TypeScript)
│   ├── Dockerfile
│   ├── components/             # React components (.tsx): Header, Product, Filters, etc.
│   ├── pages/                  # Pages Router (.tsx) + auth API routes (.js)
│   ├── store/                  # Redux Toolkit: store, cartSlice, hooks
│   ├── types/                  # Shared TypeScript interfaces (Product, Order, etc.)
│   ├── lib/                    # API client (api.ts), auth, rate-limit, productDescriptions
│   ├── models/                 # User model (kept for NextAuth)
│   ├── public/products/        # 25 product images (PNG)
│   └── styles/                 # Tailwind CSS
│
└── backend/                    # Go REST API
    ├── Dockerfile
    ├── main.go                 # Entry point: init DB/Redis/Stripe, router, CORS
    ├── database/               # PostgreSQL (GORM): connection, models, seed
    ├── handlers/               # Route handlers: products, auth, cart, checkout, admin, chat
    ├── middleware/             # Auth JWT, admin guard, rate limiting
    └── services/               # Redis cart operations, Stripe SDK init
```

---

## 🔧 API Endpoints

### Backend (Go) — `http://localhost:8080`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | — | Health check (DB + Redis status) |
| GET | `/api/products` | — | List all products with categories |
| GET | `/api/products?ids=1,2,3` | — | Get specific products by IDs |
| GET | `/api/products/:id` | — | Get single product |
| POST | `/api/auth/register` | — | User registration |
| POST | `/api/auth/login` | — | Credential verification |
| GET | `/api/cart` | Session | Get cart contents |
| POST | `/api/cart` | Session | Add item to cart |
| PUT | `/api/cart` | Session | Update item quantity |
| DELETE | `/api/cart/:productId` | Session | Remove item |
| DELETE | `/api/cart` | Session | Clear cart |
| POST | `/api/checkout` | JWT | Create Stripe checkout session |
| POST | `/api/webhook` | Stripe | Stripe payment webhook |
| POST | `/api/chat` | — | AI chatbot (OpenRouter) |
| GET | `/api/user/orders` | JWT | User's order history |
| DELETE | `/api/user/orders/:id` | JWT | Cancel pending order |
| GET | `/api/admin/products` | Admin | List products |
| POST | `/api/admin/products` | Admin | Create product |
| GET | `/api/admin/orders` | Admin | List orders (filter by status) |
| PATCH | `/api/admin/orders` | Admin | Update order status/paid |
| POST | `/api/admin/orders` | Admin | Create manual order |
| DELETE | `/api/admin/orders` | Admin | Delete order |
| GET | `/api/admin/stats` | Admin | Dashboard analytics |

### Frontend API Routes — `http://localhost:3000`

> Only NextAuth routes remain on the frontend. All other API calls go to the Go backend.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST/GET | `/api/auth/[...nextauth]` | NextAuth sign-in/sign-out |
| POST | `/api/auth/register` | User registration (creates user in MongoDB for NextAuth) |

---

## 🐳 Docker Commands

```bash
docker compose up --build       # Build & start all services
docker compose up -d            # Start in background
docker compose down             # Stop all services
docker compose logs -f          # Tail all logs
docker compose logs backend     # Tail backend logs only
docker compose exec postgres psql -U technest -d technest_db  # Open psql shell
```

---

## 🔒 Security

- Rate limiting on all API endpoints
- Server-side input validation
- Protected admin routes (middleware)
- Secure NextAuth JWT configuration
- Password hashing for credentials auth
- Stripe webhook signature verification

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
