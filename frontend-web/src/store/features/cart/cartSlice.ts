import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api'; // Re-use existing API service for now, or move logic here
// We can use the existing api.ts which handles auth headers etc.

import { CartItem, Product } from '@/types';
import type { RootState } from '@/store/store';

// CartItem imported from types

interface CartState {
    items: CartItem[];
    loading: boolean;
    error: string | null;
    mergePrompt: { anonymousItems: CartItem[]; serverItems: CartItem[] } | null;
    mergeResolving: boolean;
}

const initialState: CartState = {
    items: [],
    loading: false,
    error: null,
    mergePrompt: null,
    mergeResolving: false,
};

// Helper to check if user is logged in (crude check, better to pass from component or state)
// But thunks can access state via getState()
// We need to know if we should talk to API or LocalStorage.

export const fetchCart = createAsyncThunk<CartItem[], void, { state: RootState; rejectValue: string }>(
    'cart/fetchCart',
    async (_, { getState, rejectWithValue }) => {
        const state = getState();
        const user = state.auth.user;

        if (user) {
            try {
                const data = await api.getCart();
                return (data.items || []).filter((item: CartItem) => item.quantity > 0);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to fetch cart';
                return rejectWithValue(message);
            }
        } else {
            return state.cart.items.filter((item: CartItem) => item.quantity > 0);
        }
    }
);

type AddToCartPayload = { product: Product | CartItem; quantity: number };

export const addToCart = createAsyncThunk<CartItem[], AddToCartPayload, { state: RootState; rejectValue: string }>(
    'cart/addToCart',
    async ({ product, quantity }, { getState, rejectWithValue }) => {
        const state = getState();
        const user = state.auth.user;
        const productId = 'productId' in product ? product.productId : product.id;

        if (user) {
            try {
                // api.addToCart returns the updated cart structure
                const updatedCart = await api.addToCart(productId, quantity);
                return updatedCart.items;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to add to cart';
                return rejectWithValue(message);
            }
        } else {
            // Anonymous cart stays in Redux state only.
            const currentItems = state.cart.items;

            const existing = currentItems.find((item: CartItem) => item.productId === productId);
            let newItems;

            if (existing) {
                newItems = currentItems.map((item: CartItem) =>
                    item.productId === productId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                const cartItem: CartItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    productId,
                    name: product.name,
                    description: product.description,
                    imageUrl: product.imageUrl,
                    price: product.price,
                    currency: 'currency' in product ? product.currency : 'USD',
                    quantity
                };
                newItems = [...currentItems, {
                    ...cartItem
                }];
            }

            return newItems;
        }
    }
);

export const updateQuantity = createAsyncThunk<CartItem[], { productId: string; quantity: number }, { state: RootState; rejectValue: string }>(
    'cart/updateQuantity',
    async ({ productId, quantity }, { getState, rejectWithValue, dispatch }) => {
        const state = getState();
        const user = state.auth.user;
        const cartItems = state.cart.items;
        const item = cartItems.find((i: CartItem) => i.productId === productId);

        if (!item) return rejectWithValue("Item not found");

        if (quantity <= 0) {
            return dispatch(removeFromCart(productId)).unwrap();
        }

        if (user) {
            try {
                const updatedCart = await api.updateCartItem(item.productId, quantity);
                return updatedCart.items;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to update cart';
                return rejectWithValue(message);
            }
        } else {
            const newItems = cartItems
                .map((i: CartItem) =>
                    i.productId === productId ? { ...i, quantity } : i
                )
                .filter((i: CartItem) => i.quantity > 0);
            return newItems;
        }
    }
);

export const removeFromCart = createAsyncThunk<CartItem[], string, { state: RootState; rejectValue: string }>(
    'cart/removeFromCart',
    async (productId: string, { getState, rejectWithValue }) => {
        const state = getState();
        const user = state.auth.user;
        const cartItems = state.cart.items;
        const item = cartItems.find((i: CartItem) => i.productId === productId);

        if (!item) return rejectWithValue("Item not found");

        if (user) {
            try {
                const updatedCart = await api.removeCartItem(item.productId);
                return updatedCart.items;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Failed to remove from cart';
                return rejectWithValue(message);
            }
        } else {
            const newItems = cartItems.filter((i: CartItem) => i.productId !== productId);
            return newItems;
        }
    }
);

export const clearCart = createAsyncThunk<CartItem[]>(
    'cart/clearCart',
    async () => {
        // If user, maybe we need an API call to clear? The existing context didn't seem to have a clearCart API call, just local state clear.
        // Wait, context `clearCart` just did `setCart([])`.
        // If logged in, does it clear backend? The context code:
        // const clearCart = () => { setCart([]); if (!user) localStorage.removeItem... }
        // It didn't seem to clear backend. That's odd.
        // We will replicate current behavior: just clear local state.
        return [];
    }
);

export const resolveCartMerge = createAsyncThunk<CartItem[], { keepCurrent: boolean }, { state: RootState; rejectValue: string }>(
    'cart/resolveCartMerge',
    async ({ keepCurrent }, { getState, rejectWithValue }) => {
        const state = getState();
        const prompt = state.cart.mergePrompt as { anonymousItems: CartItem[]; serverItems: CartItem[] } | null;

        if (!prompt) return [];

        try {
            if (keepCurrent) {
                await api.clearCart();
                for (const item of prompt.anonymousItems) {
                    await api.addToCart(item.productId, item.quantity);
                }
                const updatedCart = await api.getCart();
                return (updatedCart.items || []).filter((item: CartItem) => item.quantity > 0);
            }

            return prompt.serverItems;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to resolve cart merge';
            return rejectWithValue(message);
        }
    }
);

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setCartItems: (state, action: PayloadAction<CartItem[]>) => {
            state.items = action.payload;
        },
        setMergePrompt: (state, action: PayloadAction<{ anonymousItems: CartItem[]; serverItems: CartItem[] }>) => {
            state.mergePrompt = action.payload;
        },
        clearMergePrompt: (state) => {
            state.mergePrompt = null;
        },
    },
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
            .addCase(clearCart.fulfilled, (state) => {
                state.items = [];
            })
            // Resolve cart merge
            .addCase(resolveCartMerge.pending, (state) => {
                state.mergeResolving = true;
                state.error = null;
            })
            .addCase(resolveCartMerge.fulfilled, (state, action) => {
                state.mergeResolving = false;
                state.items = action.payload as CartItem[];
                state.mergePrompt = null;
            })
            .addCase(resolveCartMerge.rejected, (state, action) => {
                state.mergeResolving = false;
                state.error = action.payload as string;
            });
    },
});

export const { setCartItems, setMergePrompt, clearMergePrompt } = cartSlice.actions;
export default cartSlice.reducer;
