"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import styles from './Checkout.module.css';
import { ChevronLeft, CreditCard, Banknote, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

export default function CheckoutPage() {
    const { cart, subtotal, clearCart } = useCart();
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
    const [cardNumber, setCardNumber] = useState('');

    const formattedTotal = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(subtotal / 100);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.checkout({
                paymentMethod,
                cardNumber: paymentMethod === 'card' ? cardNumber : undefined,
            });
            setIsSuccess(true);
            clearCart();
        } catch (err: any) {
            setError(err.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className={styles.successContainer}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={styles.successCard}
                >
                    <CheckCircle size={80} color="var(--accent)" />
                    <h1>ORDER PLACED!</h1>
                    <p>Thank you for choosing DOJO. Your sushi is being prepared.</p>
                    <Link href="/" className={styles.backHomeBtn}>BACK TO HOME</Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                <header className={styles.header}>
                    <Link href="/" className={styles.backBtn}>
                        <ChevronLeft size={20} />
                        BACK TO SHOP
                    </Link>
                    <h1 className={styles.title}>CHECKOUT</h1>
                </header>

                <div className={styles.grid}>
                    <div className={styles.formSection}>
                        <form onSubmit={handleCheckout} className={styles.form}>
                            <section className={styles.section}>
                                <h2>CONTACT INFORMATION</h2>
                                <div className={styles.inputGroup}>
                                    <label>FULL NAME</label>
                                    <input type="text" placeholder="John Doe" required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>EMAIL</label>
                                    <input type="email" placeholder="john@example.com" required />
                                </div>
                            </section>

                            <section className={styles.section}>
                                <h2>DELIVERY ADDRESS</h2>
                                <div className={styles.inputGroup}>
                                    <label>STREET</label>
                                    <input type="text" placeholder="123 Sushi Lane" required />
                                </div>
                                <div className={styles.row}>
                                    <div className={styles.inputGroup}>
                                        <label>CITY</label>
                                        <input type="text" placeholder="Tokyo" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>ZIP CODE</label>
                                        <input type="text" placeholder="100-0001" required />
                                    </div>
                                </div>
                            </section>

                            <section className={styles.section}>
                                <h2>PAYMENT METHOD</h2>
                                <div className={styles.paymentOptions}>
                                    <button
                                        type="button"
                                        className={`${styles.paymentBtn} ${paymentMethod === 'card' ? styles.active : ''}`}
                                        onClick={() => setPaymentMethod('card')}
                                    >
                                        <CreditCard size={20} />
                                        CARD
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.paymentBtn} ${paymentMethod === 'cash' ? styles.active : ''}`}
                                        onClick={() => setPaymentMethod('cash')}
                                    >
                                        <Banknote size={20} />
                                        CASH
                                    </button>
                                </div>

                                {paymentMethod === 'card' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={styles.cardDetails}
                                    >
                                        <div className={styles.inputGroup}>
                                            <label>CARD NUMBER</label>
                                            <input
                                                type="text"
                                                placeholder="0000 0000 0000 0000"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </section>

                            {error && <p className={styles.error}>{error}</p>}

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'PROCESSING...' : `PLACE ORDER - ${formattedTotal}`}
                            </button>
                        </form>
                    </div>

                    <div className={styles.summarySection}>
                        <div className={`${styles.summaryCard} glass`}>
                            <h2>ORDER SUMMARY</h2>
                            <div className={styles.itemList}>
                                {cart.map(item => (
                                    <div key={item.id} className={styles.summaryItem}>
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format((item.price * item.quantity) / 100)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.divider}></div>
                            <div className={styles.totalRow}>
                                <span>TOTAL</span>
                                <span className={styles.totalValue}>{formattedTotal}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
