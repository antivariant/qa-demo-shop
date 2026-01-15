"use client";

import { AnimatePresence, motion } from 'framer-motion';
import styles from './CartMergeModal.module.css';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resolveCartMerge } from '@/store/features/cart/cartSlice';

export default function CartMergeModal() {
    const dispatch = useAppDispatch();
    const prompt = useAppSelector(state => state.cart.mergePrompt);
    const resolving = useAppSelector(state => state.cart.mergeResolving);
    const isOpen = Boolean(prompt);

    const handleChoice = (keepCurrent: boolean) => {
        if (resolving) return;
        dispatch(resolveCartMerge({ keepCurrent }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.overlay}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cart-merge-title"
                    >
                        <h3 id="cart-merge-title" className={styles.title}>Choose which cart to keep</h3>
                        <p className={styles.message}>
                            You have items in both your current cart and your saved cart. Please choose one.
                        </p>
                        <div className={styles.actions}>
                            <button
                                className={`${styles.button} ${styles.secondary}`}
                                onClick={() => handleChoice(false)}
                                disabled={resolving}
                            >
                                Use saved cart
                            </button>
                            <button
                                className={`${styles.button} ${styles.primary}`}
                                onClick={() => handleChoice(true)}
                                disabled={resolving}
                            >
                                Keep current cart
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
