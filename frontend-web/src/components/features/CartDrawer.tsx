"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import styles from './CartDrawer.module.css';
import Link from 'next/link';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cart, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();

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
                                    <div key={item.id} className={styles.item}>
                                        <img src={item.imageUrl} alt={item.name} className={styles.itemImage} />
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemHeader}>
                                                <h3>{item.name}</h3>
                                                <button onClick={() => removeFromCart(item.id)} className={styles.removeBtn}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className={styles.itemPrice}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.price / 100)}
                                            </p>
                                            <div className={styles.itemActions}>
                                                <div className={styles.quantityPicker}>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
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
                                <Link href="/checkout" onClick={onClose} className={styles.checkoutBtn}>
                                    CHECKOUT
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
