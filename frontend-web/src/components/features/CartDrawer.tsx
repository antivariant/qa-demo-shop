"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateQuantity, removeFromCart } from '@/store/features/cart/cartSlice';
import styles from './CartDrawer.module.css';
import CheckoutModal from './CheckoutModal';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onOpenCheckout }: CartDrawerProps) {
    const dispatch = useAppDispatch();
    const cart = useAppSelector(state => state.cart.items);

    // Derived state
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleUpdateQuantity = (id: string, qty: number) => {
        dispatch(updateQuantity({ productId: cart.find(i => i.id === id)?.productId || id, quantity: qty }));
        // Note: updateQuantity thunk expects productId (since it finds item by productId for local storage logic). 
        // But context passed id? Context `updateQuantity` took `productId`.
        // Cart item has `id` (cart item id) and `productId`.
        // Let's check CartContext logic vs Slice logic again.
    };

    const handleRemoveFromCart = (id: string) => {
        // Slice expects productId. Cart item in drawer has both.
        // Check item type.
        const item = cart.find(i => i.id === id);
        if (item) {
            dispatch(removeFromCart(item.productId));
        }
    };

    const formattedSubtotal = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(subtotal / 100);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.overlay}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={styles.drawer}
                    >
                        <div className={styles.header}>
                            <div className={styles.titleGroup}>
                                <ShoppingBag size={24} />
                                <h2>YOUR CART ({totalItems})</h2>
                            </div>
                            <button onClick={onClose} className={styles.closeBtn}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.items}>
                            {cart.length === 0 ? (
                                <div className={styles.empty}>
                                    <p>Your cart is empty</p>
                                    <button onClick={onClose} className={styles.continueBtn}>CONTINUE SHOPPING</button>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.productId} className={styles.item}>
                                        <img src={item.imageUrl} alt={item.name} className={styles.itemImage} data-testid="cart-item-image" />
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemHeader}>
                                                <h3>{item.name}</h3>
                                                <button onClick={() => {
                                                    dispatch(removeFromCart(item.productId));
                                                }} className={styles.removeBtn}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className={styles.itemPrice}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency || 'USD' }).format(item.price / 100)}
                                            </p>
                                            <div className={styles.itemActions}>
                                                <div className={styles.quantityPicker}>
                                                    <button onClick={() => {
                                                        dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }));
                                                    }}><Minus size={14} /></button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => {
                                                        dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }));
                                                    }}><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className={styles.footer}>
                                <div className={styles.subtotalRow}>
                                    <span>SUBTOTAL</span>
                                    <span className={styles.subtotalValue}>{formattedSubtotal}</span>
                                </div>
                                <p className={styles.note}>Shipping and taxes calculated at checkout.</p>
                                <button
                                    onClick={() => {
                                        onClose(); // Close the drawer first
                                        onOpenCheckout(); // Open modal
                                    }}
                                    className={styles.checkoutBtn}
                                >
                                    CHECKOUT
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
