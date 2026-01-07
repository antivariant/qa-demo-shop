import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

async function getHeaders() {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const user = auth.currentUser;
    if (user) {
        const token = await getIdToken(user);
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export const api = {
    // Categories
    getCategories: async () => {
        const res = await fetch(`${BASE_URL}/categories`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },

    // Products
    getProducts: async (categoryId?: string) => {
        const url = new URL(`${BASE_URL}/products`);
        if (categoryId) url.searchParams.append('category', categoryId);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    getProduct: async (id: string) => {
        const res = await fetch(`${BASE_URL}/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
    },

    // Cart
    getCart: async () => {
        const res = await fetch(`${BASE_URL}/cart`, {
            headers: await getHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch cart');
        return res.json();
    },

    addToCart: async (productId: string, quantity: number) => {
        const res = await fetch(`${BASE_URL}/cart/items`, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify({ productId, quantity }),
        });
        if (!res.ok) throw new Error('Failed to add to cart');
        return res.json();
    },

    updateCartItem: async (itemId: string, quantity: number) => {
        const res = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
            method: 'PATCH',
            headers: await getHeaders(),
            body: JSON.stringify({ quantity }),
        });
        if (!res.ok) throw new Error('Failed to update cart');
        return res.json();
    },

    removeCartItem: async (itemId: string) => {
        const res = await fetch(`${BASE_URL}/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: await getHeaders(),
        });
        if (!res.ok) throw new Error('Failed to remove from cart');
        return res.json();
    },

    // Checkout
    checkout: async (payload: { paymentMethod: 'card' | 'cash'; cardNumber?: string }) => {
        const res = await fetch(`${BASE_URL}/checkout`, {
            method: 'POST',
            headers: await getHeaders(),
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to checkout');
        return res.json();
    },
};
