import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api'; // Re-use existing API service for now, or move logic here
// We can use the existing api.ts which handles auth headers etc.

export interface CartItem {
    id: string; // Cart item ID (from backend)
    productId: string; // The product ID
    name: string;
    price: number;
    currency: string;
    quantity: number;
    imageUrl: string;
}

interface CartState {
    items: CartItem[];
    loading: boolean;
    error: string | null;
}

const initialState: CartState = {
    items: [],
    loading: false,
    error: null,
};

// Helper to check if user is logged in (crude check, better to pass from component or state)
// But thunks can access state via getState()
// We need to know if we should talk to API or LocalStorage.

export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as any; // Need RootState type, but circular dependency if imported. Use any for now.
        const user = state.auth.user;

        if (user) {
            try {
                const data = await api.getCart();
                return data.items || [];
            } catch (err: any) {
                return rejectWithValue(err.message);
            }
        } else {
            const savedCart = localStorage.getItem('dojo_cart');
            if (savedCart) {
                try {
                    return JSON.parse(savedCart);
                } catch (e) {
                    console.error("Failed to parse local cart", e);
                    return [];
                }
            }
            return [];
        }
    }
);

export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async ({ product, quantity }: { product: any; quantity: number }, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const user = state.auth.user;

        if (user) {
            try {
                // api.addToCart returns the updated cart structure
                const updatedCart = await api.addToCart(product.id || product.productId, quantity);
                return updatedCart.items;
            } catch (err: any) {
                return rejectWithValue(err.message);
            }
        } else {
            // LocalStorage logic mimics the API response or just returns the new items list
            // We need to return the NEW items array to the reducer.
            // But strict Redux reducers should be pure.
            // Thunks can be impure (reading localStorage).

            // Read current items from state to avoid race conditions with localStorage?
            // Or just read from state.cart.items
            const currentItems = state.cart.items as CartItem[];

            const existing = currentItems.find((item: CartItem) => item.productId === (product.id || product.productId));
            let newItems;

            if (existing) {
                newItems = currentItems.map((item: CartItem) =>
                    item.productId === (product.id || product.productId)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                newItems = [...currentItems, {
                    id: Math.random().toString(36).substr(2, 9),
                    productId: product.id || product.productId,
                    ...product,
                    quantity
                }];
            }

            localStorage.setItem('dojo_cart', JSON.stringify(newItems));
            return newItems;
        }
    }
);

export const updateQuantity = createAsyncThunk(
    'cart/updateQuantity',
    async ({ productId, quantity }: { productId: string; quantity: number }, { getState, rejectWithValue, dispatch }) => {
        const state = getState() as any;
        const user = state.auth.user;
        const cartItems = state.cart.items as CartItem[];
        const item = cartItems.find((i: CartItem) => i.productId === productId);

        if (!item) return rejectWithValue("Item not found");

        if (quantity <= 0) {
            // Dispatch remove action? Or handle it here?
            // Ideally we should call removeFromCart thunk but we can't easily dispatch thunk from thunk without circular deps or extra setup.
            // We can just call the logic for remove here or let the component handle the <= 0 check.
            // The existing context handled <= 0 by calling remove.
            // We will assume the caller handles standardizing calls, or we duplicate logic for now.
            // Let's defer to removeFromCart if 0.
            // Converting to 0 -> remove logic might be better in the component, or we handle it here.
            // For simplicity, let's implement update logic.
        }

        if (user) {
            try {
                const updatedCart = await api.updateCartItem(item.id, quantity);
                return updatedCart.items;
            } catch (err: any) {
                return rejectWithValue(err.message);
            }
        } else {
            const newItems = cartItems.map((i: CartItem) =>
                i.productId === productId ? { ...i, quantity } : i
            );
            localStorage.setItem('dojo_cart', JSON.stringify(newItems));
            return newItems;
        }
    }
);

export const removeFromCart = createAsyncThunk(
    'cart/removeFromCart',
    async (productId: string, { getState, rejectWithValue }) => {
        const state = getState() as any;
        const user = state.auth.user;
        const cartItems = state.cart.items as CartItem[];
        const item = cartItems.find((i: CartItem) => i.productId === productId);

        if (!item) return rejectWithValue("Item not found");

        if (user) {
            try {
                const updatedCart = await api.removeCartItem(item.id);
                return updatedCart.items;
            } catch (err: any) {
                return rejectWithValue(err.message);
            }
        } else {
            const newItems = cartItems.filter((i: CartItem) => i.productId !== productId);
            localStorage.setItem('dojo_cart', JSON.stringify(newItems));
            return newItems;
        }
    }
);

export const clearCart = createAsyncThunk(
    'cart/clearCart',
    async (_, { getState }) => {
        const state = getState() as any;
        const user = state.auth.user;

        if (!user) {
            localStorage.removeItem('dojo_cart');
        }
        // If user, maybe we need an API call to clear? The existing context didn't seem to have a clearCart API call, just local state clear.
        // Wait, context `clearCart` just did `setCart([])`.
        // If logged in, does it clear backend? The context code:
        // const clearCart = () => { setCart([]); if (!user) localStorage.removeItem... }
        // It didn't seem to clear backend. That's odd.
        // We will replicate current behavior: just clear local state.
        return [];
    }
);

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Cart
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Add to Cart
            .addCase(addToCart.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            // Update Quantity
            .addCase(updateQuantity.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            // Remove from Cart
            .addCase(removeFromCart.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            // Clear Cart
            .addCase(clearCart.fulfilled, (state, action) => {
                state.items = [];
            });
    },
});

export default cartSlice.reducer;
