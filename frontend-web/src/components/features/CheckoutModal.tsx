"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ShoppingBag, CheckCircle } from 'lucide-react';
import styles from './CheckoutModal.module.css';
import { CheckoutResponse } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCart } from '@/store/features/cart/cartSlice';
import { api } from '@/services/api';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
    const dispatch = useAppDispatch();
    const cart = useAppSelector(state => state.cart.items);

    // Calculate total
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const formattedTotal = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(subtotal / 100);

    // Form State
    const [cardNumber, setCardNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'review' | 'success'>('review');
    const [orderId, setOrderId] = useState<string | null>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep('review');
            setError('');
            setCardNumber('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Hardcoded to 'card' as requested for MVP
            const response: CheckoutResponse = await api.checkout({
                paymentMethod: 'card',
                cardNumber: cardNumber,
            });

            setOrderId(response.orderId);
            setStep('success');

            // Critical: Fetch the new empty cart from backend to sync frontend state
            dispatch(fetchCart());

        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.wrapper}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.overlay}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={styles.modal}
                    >
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={24} />
                        </button>

                        {step === 'review' ? (
                            <div className={styles.content}>
                                <div className={styles.header}>
                                    <ShoppingBag size={28} color="var(--accent)" />
                                    <h2>CHECKOUT</h2>
                                </div>

                                <div className={styles.summary}>
                                    <h3 className={styles.sectionTitle}>ORDER SUMMARY</h3>
                                    <div className={styles.itemList}>
                                        {cart.filter(i => i.quantity > 0).map(item => (
                                            <div key={item.id || item.productId} className={styles.item}>
                                                <span>{item.name} x {item.quantity}</span>
                                                <span className={styles.price}>
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency || 'USD' }).format((item.price * item.quantity) / 100)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.totalRow}>
                                        <span>TOTAL</span>
                                        <span className={styles.totalValue}>{formattedTotal}</span>
                                    </div>
                                </div>

                                <form onSubmit={handleCheckout} className={styles.form}>
                                    <div className={styles.inputGroup}>
                                        <label>CARD NUMBER</label>
                                        <div className={styles.inputWrapper}>
                                            <CreditCard className={styles.inputIcon} size={20} />
                                            <input
                                                type="text"
                                                placeholder="0000 0000 0000 0000"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && <p className={styles.error}>{error}</p>}

                                    <button type="submit" className={styles.payBtn} disabled={loading}>
                                        {loading ? 'PROCESSING...' : `PAY ${formattedTotal}`}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className={styles.success}>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={styles.successIcon}
                                >
                                    <CheckCircle size={80} color="var(--accent)" />
                                </motion.div>
                                <h2>ORDER SUCCESSFUL!</h2>
                                <p className={styles.thankYou}>Thank you for your purchase.</p>
                                <div className={styles.orderInfo}>
                                    <span>ORDER ID</span>
                                    <code>{orderId}</code>
                                </div>
                                <button className={styles.closeSuccessBtn} onClick={onClose}>
                                    CONTINUE SHOPPING
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
