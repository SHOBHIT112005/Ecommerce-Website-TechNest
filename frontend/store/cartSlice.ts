import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartState } from '@/types';

// ── Initial State ───────────────────────────────────────────────────────────

function loadCartFromStorage(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('technest_cart');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

const initialState: CartState = {
  items: loadCartFromStorage(),
  toastMessage: null,
};

// ── Slice ───────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<number>) {
      state.items.push(action.payload);
      persistCart(state.items);
    },
    removeItem(state, action: PayloadAction<number>) {
      const idx = state.items.indexOf(action.payload);
      if (idx !== -1) {
        state.items.splice(idx, 1);
        persistCart(state.items);
      }
    },
    clearCart(state) {
      state.items = [];
      persistCart(state.items);
    },
    setCart(state, action: PayloadAction<number[]>) {
      state.items = action.payload;
      persistCart(state.items);
    },
    showToast(state, action: PayloadAction<string>) {
      state.toastMessage = action.payload;
    },
    clearToast(state) {
      state.toastMessage = null;
    },
  },
});

// ── Persist Helper ──────────────────────────────────────────────────────────

function persistCart(items: number[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('technest_cart', JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
}

// ── Exports ─────────────────────────────────────────────────────────────────

export const { addItem, removeItem, clearCart, setCart, showToast, clearToast } = cartSlice.actions;
export default cartSlice.reducer;
