"use client";

import { motion } from 'framer-motion';
import styles from './ProductCard.module.css';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, updateQuantity } from '@/store/features/cart/cartSlice';
import { useState, useEffect } from 'react';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    imageUrl: string;
}

interface ProductCardProps {
    product: Product;
    variant?: 'featured' | 'list';
    onClick?: (product: Product) => void;
}

export default function ProductCard({ product, variant = 'list', onClick }: ProductCardProps) {
    const dispatch = useAppDispatch();
    const cart = useAppSelector(state => state.cart.items);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const cartItem = cart.find(item => item.productId === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const formattedPrice = `${(product.price / 100).toFixed(0)}$`;

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(addToCart({ product, quantity: 1 }));
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(updateQuantity({ productId: product.id, quantity: quantity + 1 }));
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(updateQuantity({ productId: product.id, quantity: Math.max(0, quantity - 1) }));
    };

    if (!mounted) return null;

    return (
        <motion.div
            className={`${styles.card} ${variant === 'featured' ? styles.variant_featured : styles.variant_list}`}
            onClick={() => onClick?.(product)}
            initial={false}
        >
            <div className={styles.imageWrapper}>
                <img src={product.imageUrl} alt={product.name} className={styles.image} />
            </div>
            <div className={styles.info}>
                <div className={styles.textData}>
                    <h3 className={styles.name}>{product.name}</h3>
                    <span className={styles.price}>{formattedPrice}</span>
                </div>

                <div className={styles.actions} onClick={e => e.stopPropagation()}>
                    {quantity === 0 ? (
                        <button className={styles.addBtn} onClick={handleAdd}>
                            <Plus size={24} />
                        </button>
                    ) : (
                        <motion.div
                            className={styles.quantityContainer}
                            initial="initial"
                            whileHover="hover"
                            animate="initial"
                        >
                            <motion.button
                                className={`${styles.controlBtn} ${styles.minusBtn}`}
                                onClick={handleDecrement}
                                variants={{
                                    initial: { x: 20, opacity: 0 },
                                    hover: { x: 0, opacity: 1 }
                                }}
                            >
                                -
                            </motion.button>

                            <div className={styles.quantityBadge}>
                                {quantity}
                            </div>

                            <motion.button
                                className={`${styles.controlBtn} ${styles.plusBtn}`}
                                onClick={handleIncrement}
                                variants={{
                                    initial: { x: -20, opacity: 0 },
                                    hover: { x: 0, opacity: 1 }
                                }}
                            >
                                +
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
