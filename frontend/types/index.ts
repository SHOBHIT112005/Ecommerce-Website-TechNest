// ============================================================================
// TechNest — Shared TypeScript Interfaces
// These types match the Go backend GORM models and their JSON serialization.
// ============================================================================

// ── Product & Category ──────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  picture: string;
  categories: Category[];
  created_at: string;
  updated_at: string;
}

/** Flattened product for display (category names extracted) */
export interface ProductDisplay extends Omit<Product, 'categories'> {
  categories: string[];
}

// ── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  user_id: number | null;
  name: string;
  email: string;
  address: string;
  city: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  paid: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// ── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Cart (Redux) ────────────────────────────────────────────────────────────

export interface CartState {
  items: number[];
  toastMessage: string | null;
}

// ── Admin Stats (matches Go statsResponse) ──────────────────────────────────

export interface AdminStatsSummary {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface AdminStatsUsers {
  totalUsers: number;
  registeredUsers: number;
  guestUsers: number;
}

export interface MonthlySaleEntry {
  year: number;
  month: number;
  revenue: number;
  orders: number;
}

export interface AdminStats {
  summary: AdminStatsSummary;
  users: AdminStatsUsers;
  monthlySales: MonthlySaleEntry[];
  recentOrders: Order[];
}

// ── Admin Forms ─────────────────────────────────────────────────────────────

export interface ManualOrderForm {
  name: string;
  email: string;
  city: string;
  address: string;
  subtotal: string;
  deliveryFee: string;
  status: string;
}

export interface NewProductForm {
  name: string;
  price: string;
  categories: string;
  picture: string;
  description: string;
}

// ── API Response Wrappers ───────────────────────────────────────────────────

export interface OrdersResponse {
  orders: Order[];
}

export interface ProductsResponse {
  products: Product[];
}

export interface CheckoutResponse {
  url: string;
}

// ── NextAuth Session Extension ──────────────────────────────────────────────

declare module 'next-auth' {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: string;
  }
}
