# Technest - E-commerce Website

A modern full-stack e-commerce web application built with Next.js, featuring product browsing, shopping cart, Stripe payments, order management, and an AI-powered chatbot.

![Technest E-commerce](https://img.shields.io/badge/Next.js-16.2.7-black?style=for-the-badge&logo=next.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![Stripe](https://img.shields.io/badge/Stripe-Payments-blue?style=for-the-badge&logo=stripe)

## ✨ Features

### 🛍️ Shopping Experience
- **Product Browsing**: Browse products with category organization and search functionality
- **Shopping Cart**: Add/remove products with real-time quantity updates and persistent local storage
- **Product Filtering**: Filter by categories, price range, and sort by various criteria
- **Responsive Design**: Mobile-friendly UI with dedicated mobile navigation

### 💳 Checkout & Payments
- **Stripe Integration**: Secure payment processing via Stripe Checkout
- **Order Confirmation**: Visual confirmation with auto-redirect to order history
- **Payment Verification**: Webhook integration to update order status after payment
- **Confirmation Overlay**: Modal confirmation before redirecting to Stripe payment page

### 📦 Order Management
- **Order History**: Users can view their order history and status
- **Order Status Tracking**: Real-time status updates (pending, completed, cancelled)
- **Order Cancellation**: Cancel pending orders with instant refund notification
- **Admin Dashboard**: Full order management with status updates and deletion

### 👥 Authentication
- **NextAuth.js**: Secure authentication with email/password and OAuth support
- **Role-based Access**: Separate admin and user interfaces
- **User Registration**: Built-in registration flow

### 🎯 AI Assistant
- **ChatBot Integration**: AI-powered product recommendations and assistance
- **Context-aware Chat**: Product-specific recommendations when viewing items
- **Admin Protection**: ChatBot hidden for admin users

### 🎨 UI/UX Highlights
- **Sticky Header**: Fixed navigation with cart indicator
- **Toast Notifications**: User feedback for actions (cancellations, refunds)
- **Modern Design**: Tailwind CSS styling with emerald color scheme
- **Interactive Elements**: Hover effects and smooth transitions

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with SSR and API routes |
| **React 19** | UI library |
| **MongoDB/Mongoose** | Database for products, users, and orders |
| **Stripe** | Payment processing |
| **NextAuth.js** | Authentication |
| **Tailwind CSS** | Styling |
| **use-local-storage-state** | Persistent cart state |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account or local MongoDB instance
- Stripe account for payment processing

### Environment Variables
Create a `.env.local` file with the following variables:

```bash
MONGODB_URL=mongodb+srv://... # Your MongoDB connection string
MONGODB_DB_NAME=TechNest # Optional: database name

STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe webhook signing secret

NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/technest-ecommerce.git
cd technest-ecommerce

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
├── pages/
│   ├── api/
│   │   ├── admin/           # Admin endpoints (orders, products, stats)
│   │   ├── auth/            # Authentication routes
│   │   ├── user/            # User order management
│   │   ├── checkout.js      # Stripe checkout session creation
│   │   ├── webhook.js       # Stripe webhook handler
│   │   └── products.js      # Product listing
│   ├── admin/               # Admin dashboard
│   ├── auth/
│   │   └── signin.js       # Sign in page
│   ├── checkout.js          # Cart checkout page
│   ├── my-orders.js        # User order history
│   └── product/[id].js     # Individual product pages
├── components/
│   ├── Header.js           # Sticky navigation header with cart
│   ├── ChatBot.js          # AI assistant chat interface
│   ├── ProductsContext.js  # Cart context provider
│   ├── Toast.js            # Notification toast component
│   ├── Filters.js          # Product filter component
│   └── Product.js          # Product card component
├── models/
│   ├── Products.js         # Product schema
│   ├── Order.js            # Order schema
│   └── User.js             # User schema
└── lib/
    ├── mongoose.js         # Database connection
    ├── adminAuth.js        # Admin authentication helper
    └── rateLimit.js        # API rate limiting
```

## 🔧 API Endpoints

### Public Endpoints
- `GET /api/products` - List all products
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/chat` - Chat with AI assistant

### Authenticated Endpoints
- `GET /api/user/orders` - Get user's order history
- `DELETE /api/user/orders/[id]` - Cancel an order

### Admin Endpoints
- `GET /api/admin/orders` - List all orders (with optional status filter)
- `PATCH /api/admin/orders` - Update order status/paid status
- `POST /api/admin/orders` - Create manual order
- `DELETE /api/admin/orders` - Delete an order
- `GET /api/admin/products` - List all products
- `GET /api/admin/stats` - Get dashboard statistics

## 💡 Key Features Explained

### Order Cancellation Flow
1. User clicks "Cancel Order" on a pending, unpaid order
2. Confirmation overlay appears with refund details
3. On confirmation, order status changes to "cancelled"
4. Toast notification confirms cancellation with refund timeline

### Payment Flow
1. User reviews cart and clicks "Pay"
2. Confirmation overlay shows total amount
3. Redirects to Stripe for secure payment
4. After payment, user sees success message
5. Auto-redirects to "My Orders" page after 2 seconds
6. Webhook updates order to "completed" and "paid" status

### Admin Order Management
- Real-time updates without page refresh
- Status changes immediately reflect in UI
- Actions include status update, paid toggle, and order deletion

## 🎨 UI Components

### Sticky Header
- Fixed at top of viewport
- Cart button with item count badge
- User authentication status
- Responsive navigation

### Toast Notifications
- Non-intrusive feedback messages
- Auto-dismiss after 2.5 seconds
- Success/error styling

### Confirmation Overlays
- Custom styled modals
- Backdrop with blur effect
- Clear action buttons

## 📊 Admin Dashboard Features
- Monthly sales analytics
- Order statistics (total, pending, completed)
- Product management
- Manual order creation
- Real-time order status updates

## 🔒 Security
- Rate limiting on API endpoints
- Server-side validation
- Protected admin routes
- Secure NextAuth configuration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
