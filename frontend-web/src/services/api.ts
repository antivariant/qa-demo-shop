import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';
import { Product, Category, Cart, CheckoutResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Helper to get the current user, waiting for auth to initialize if necessary.
 * This is more robust as it handles the initial Firebase load state.
 */
function waitForAuth(): Promise<any> {
    return new Promise((resolve) => {
        // If already have a user, resolve immediately
        if (auth.currentUser) {
            return resolve(auth.currentUser);
        }

        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });

        // Safety timeout - don't hang requests forever
        setTimeout(() => {
            unsubscribe();
            resolve(auth.currentUser);
        }, 3000);
    });
}

async function getHeaders() {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    try {
        const user = await waitForAuth();
        if (user) {
            const token = await getIdToken(user);
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (err) {
        console.error('Error getting headers:', err);
    }

    return headers;
}

export const api = {
    // Categories
    getCategories: async (): Promise<Category[]> => {
        const res = await fetch(`${BASE_URL}/categories`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },

    // Products
    getProducts: async (categoryId?: string): Promise<Product[]> => {
        const url = new URL(`${BASE_URL}/products`);
        if (categoryId) url.searchParams.append('category', categoryId);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    getProduct: async (id: string): Promise<Product> => {
        const res = await fetch(`${BASE_URL}/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
    },

    // Cart
    getCart: async (): Promise<Cart> => {
        const res = await fetch(`${BASE_URL}/cart`, {
            headers: await getHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch cart');
        return res.json();
    },

    addToCart: async (productId: string, quantity: number): Promise<Cart> => {
        const res = await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify({ productId, quantity }),
        });
        if (!res.ok) throw new Error('Failed to add to cart');
        return res.json();
    },

    updateCartItem: async (itemId: string, quantity: number): Promise<Cart> => {
        const res = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
            method: 'PATCH',
            headers: await getHeaders(),
            body: JSON.stringify({ quantity }),
        });
        if (!res.ok) throw new Error('Failed to update cart');
        return res.json();
    },

    removeCartItem: async (itemId: string): Promise<Cart> => {
        const res = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: await getHeaders(),
        });
        if (!res.ok) throw new Error('Failed to remove from cart');
        return res.json();
    },

    // Checkout
    checkout: async (payload: { paymentMethod: 'card' | 'cash'; cardNumber?: string }): Promise<CheckoutResponse> => {
        const res = await fetch(`${BASE_URL}/checkout`, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to checkout');
        return res.json();
    },

    getOrders: async (): Promise<any[]> => {
        const res = await fetch(`${BASE_URL}/orders`, {
            headers: await getHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
    },
};
