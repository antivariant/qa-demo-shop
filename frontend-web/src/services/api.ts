import { shopAuth, sdetAuth } from './firebase';
import { getIdToken, User } from 'firebase/auth';
import { Product, Category, Cart, CheckoutResponse, SdetUser } from '@/types';

const API_TARGET = process.env.NEXT_PUBLIC_API_TARGET || 'local';

function coerceHttps(url: string | undefined): string | undefined {
    if (!url) return url;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
        return `https://${url.slice('http://'.length)}`;
    }
    return url;
}

function pickByTarget(local?: string, docker?: string, prod?: string, fallback?: string) {
    if (API_TARGET === 'prod') {
        return prod || docker || local || fallback;
    }
    if (API_TARGET === 'docker') {
        return docker || local || prod || fallback;
    }
    return local || docker || prod || fallback;
}

const SHOP_BASE_URL =
    coerceHttps(process.env.NEXT_PUBLIC_SHOP_API_BASE_URL) ||
    coerceHttps(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    pickByTarget(
        coerceHttps(process.env.NEXT_PUBLIC_SHOP_API_BASE_URL_LOCAL),
        coerceHttps(process.env.NEXT_PUBLIC_SHOP_API_BASE_URL_DOCKER),
        coerceHttps(process.env.NEXT_PUBLIC_SHOP_API_BASE_URL_PROD),
        'https://localhost:3000/api',
    );

const SDET_BASE_URL =
    coerceHttps(process.env.NEXT_PUBLIC_SDET_API_BASE_URL) ||
    pickByTarget(
        coerceHttps(process.env.NEXT_PUBLIC_SDET_API_BASE_URL_LOCAL),
        coerceHttps(process.env.NEXT_PUBLIC_SDET_API_BASE_URL_DOCKER),
        coerceHttps(process.env.NEXT_PUBLIC_SDET_API_BASE_URL_PROD),
        'https://localhost:3100/api',
    );

/**
 * Helper to get the current user, waiting for auth to initialize if necessary.
 * This is more robust as it handles the initial Firebase load state.
 */
function waitForAuth(authInstance: typeof shopAuth): Promise<User | null> {
    return new Promise((resolve) => {
        // If already have a user, resolve immediately
        if (authInstance.currentUser) {
            return resolve(authInstance.currentUser);
        }

        const unsubscribe = authInstance.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });

        // Safety timeout - don't hang requests forever
        setTimeout(() => {
            unsubscribe();
            resolve(authInstance.currentUser);
        }, 3000);
    });
}

async function getHeaders(authInstance: typeof shopAuth, options?: { requireAuth?: boolean }) {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    try {
        const user = await waitForAuth(authInstance);
        if (!user && options?.requireAuth) {
            throw new Error('Not authenticated');
        }
        if (user) {
            const token = await getIdToken(user);
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (err) {
        console.error('Error getting headers:', err);
        if (options?.requireAuth) {
            throw err;
        }
    }

    return headers;
}

export const api = {
    // Categories
    getCategories: async (): Promise<Category[]> => {
        const res = await fetch(`${SHOP_BASE_URL}/categories`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },

    // Products
    getProducts: async (categoryId?: string): Promise<Product[]> => {
        const url = new URL(`${SHOP_BASE_URL}/products`);
        if (categoryId) url.searchParams.append('category', categoryId);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    getProduct: async (id: string): Promise<Product> => {
        const res = await fetch(`${SHOP_BASE_URL}/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        return res.json();
    },

    // Cart
    getCart: async (): Promise<Cart> => {
        const res = await fetch(`${SHOP_BASE_URL}/cart`, {
            headers: await getHeaders(shopAuth),
        });
        if (!res.ok) throw new Error('Failed to fetch cart');
        return res.json();
    },

    addToCart: async (productId: string, quantity: number): Promise<Cart> => {
        const res = await fetch(`${SHOP_BASE_URL}/cart/items`, {
            method: 'POST',
            headers: await getHeaders(shopAuth),
            body: JSON.stringify({ productId, quantity }),
        });
        if (!res.ok) throw new Error('Failed to add to cart');
        return res.json();
    },

    updateCartItem: async (itemId: string, quantity: number): Promise<Cart> => {
        const res = await fetch(`${SHOP_BASE_URL}/cart/items/${itemId}`, {
            method: 'PATCH',
            headers: await getHeaders(shopAuth),
            body: JSON.stringify({ quantity }),
        });
        if (!res.ok) throw new Error('Failed to update cart');
        return res.json();
    },

    removeCartItem: async (itemId: string): Promise<Cart> => {
        const res = await fetch(`${SHOP_BASE_URL}/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: await getHeaders(shopAuth),
        });
        if (!res.ok) throw new Error('Failed to remove from cart');
        return res.json();
    },
    clearCart: async (): Promise<void> => {
        const res = await fetch(`${SHOP_BASE_URL}/cart`, {
            method: 'DELETE',
            headers: await getHeaders(shopAuth, { requireAuth: true }),
        });
        if (!res.ok) throw new Error('Failed to clear cart');
    },

    // Checkout
    checkout: async (payload: { paymentMethod: 'card' | 'cash'; cardNumber?: string }): Promise<CheckoutResponse> => {
        const res = await fetch(`${SHOP_BASE_URL}/checkout`, {
            method: 'POST',
            headers: await getHeaders(shopAuth, { requireAuth: true }),
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to checkout');
        return res.json();
    },

    getOrders: async (): Promise<unknown[]> => {
        const res = await fetch(`${SHOP_BASE_URL}/orders`, {
            headers: await getHeaders(shopAuth),
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
    },

    // SDET User
    getSdetUser: async (): Promise<SdetUser> => {
        const res = await fetch(`${SDET_BASE_URL}/sdet/user`, {
            headers: await getHeaders(sdetAuth, { requireAuth: true }),
        });
        if (!res.ok) throw new Error('Failed to fetch SDET user profile');
        return res.json();
    },

    updateSdetUser: async (payload: { name?: string }): Promise<SdetUser> => {
        const res = await fetch(`${SDET_BASE_URL}/sdet/user`, {
            method: 'PUT',
            headers: await getHeaders(sdetAuth, { requireAuth: true }),
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update SDET user profile');
        return res.json();
    },

    registerSdetUser: async (payload: { email: string; password: string; name?: string }): Promise<SdetUser> => {
        const res = await fetch(`${SDET_BASE_URL}/sdet/auth/register`, {
            method: 'POST',
            headers: await getHeaders(sdetAuth),
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to register SDET user');
        return res.json();
    },

    registerShopUser: async (payload: { email: string; password: string; name?: string }): Promise<{ uid: string; email: string | null; displayName: string | null }> => {
        const res = await fetch(`${SHOP_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: await getHeaders(shopAuth),
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to register user');
        return res.json();
    },
};
