"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/services/api';

export interface CartItem {
    id: string; // Cart item ID (from backend)
    productId: string; // The product ID
    name: string;
    price: number;
    currency: string;
    quantity: number;
    imageUrl: string;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any, quantity: number) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    clearCart: () => void;
    subtotal: number;
    totalItems: number;
    loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Fetch cart on mount or login
    useEffect(() => {
        const loadCart = async () => {
            if (user) {
                setLoading(true);
                try {
                    const data = await api.getCart();
                    setCart(data.items || []);
                } catch (err) {
                    console.error("Failed to load backend cart", err);
                } finally {
                    setLoading(false);
                }
            } else {
                const savedCart = localStorage.getItem('dojo_cart');
                if (savedCart) {
                    try {
                        setCart(JSON.parse(savedCart));
                    } catch (e) {
                        console.error("Failed to parse local cart", e);
                    }
                }
            }
        };
        loadCart();
    }, [user]);

    // Sync to localStorage for guests
    useEffect(() => {
        if (!user) {
            localStorage.setItem('dojo_cart', JSON.stringify(cart));
        }
    }, [cart, user]);

    const addToCart = async (product: any, quantity: number) => {
        if (user) {
            try {
                const updatedCart = await api.addToCart(product.id || product.productId, quantity);
                setCart(updatedCart.items);
            } catch (err) {
                console.error("Failed to add to backend cart", err);
            }
        } else {
            setCart(prev => {
                const existing = prev.find(item => item.productId === product.id || item.productId === product.productId);
                if (existing) {
                    return prev.map(item =>
                        item.productId === (product.id || product.productId)
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                }
                return [...prev, {
                    id: Math.random().toString(36).substr(2, 9),
                    productId: product.id || product.productId,
                    ...product,
                    quantity
                }];
            });
        }
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        const item = cart.find(i => i.productId === productId);
        if (!item) return;

        if (quantity <= 0) {
            await removeFromCart(productId);
            return;
        }

        if (user) {
            try {
                const updatedCart = await api.updateCartItem(item.id, quantity);
                setCart(updatedCart.items);
            } catch (err) {
                console.error("Failed to update backend cart", err);
            }
        } else {
            setCart(prev => prev.map(i =>
                i.productId === productId ? { ...i, quantity } : i
            ));
        }
    };

    const removeFromCart = async (productId: string) => {
        const item = cart.find(i => i.productId === productId);
        if (!item) return;

        if (user) {
            try {
                const updatedCart = await api.removeCartItem(item.id);
                setCart(updatedCart.items);
            } catch (err) {
                console.error("Failed to remove from backend cart", err);
            }
        } else {
            setCart(prev => prev.filter(i => i.productId !== productId));
        }
    };

    const clearCart = () => {
        setCart([]);
        if (!user) {
            localStorage.removeItem('dojo_cart');
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            subtotal,
            totalItems,
            loading
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
