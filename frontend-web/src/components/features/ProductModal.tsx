"use client";

import { motion, AnimatePresence } from 'framer-motion';
import styles from './ProductModal.module.css';
import { X, Plus } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/features/cart/cartSlice';
import Image from 'next/image';
import { Product } from '@/types';

interface ProductModalProps {
    product: Product | null;
    onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
    const dispatch = useAppDispatch();

    if (!product) return null;

    const handleAdd = () => {
        dispatch(addToCart({ product, quantity: 1 }));
        onClose();
    };

    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: product.currency,
    }).format(product.price / 100);

    return (
        <AnimatePresence>
            {product && (
                <div className={styles.overlay} onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={24} />
                        </button>

                        <div className={styles.grid}>
                            <div className={styles.imageSection}>
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className={styles.image}
                                    fill
                                    sizes="(max-width: 900px) 100vw, 50vw"
                                    unoptimized
                                />
                            </div>

                            <div className={styles.infoSection}>
                                <h2 className={styles.name}>{product.name}</h2>
                                <p className={styles.description}>{product.description}</p>

                                <div className={styles.footer}>
                                    <span className={styles.price}>{formattedPrice}</span>
                                    <button className={styles.addBtn} onClick={handleAdd}>
                                        <Plus size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
