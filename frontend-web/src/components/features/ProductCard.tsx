"use client";

import { motion } from 'framer-motion';
import styles from './ProductCard.module.css';
import { Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';

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
    const { addToCart } = useCart();

    const formattedPrice = `${product.price / 100}$`;

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(product, 1);
    };

    return (
        <motion.div
            layout
            className={`${styles.card} ${variant === 'featured' ? styles.variant_featured : styles.variant_list}`}
            onClick={() => onClick?.(product)}
        >
            <div className={styles.imageWrapper}>
                <img src={product.imageUrl} alt={product.name} className={styles.image} />
            </div>
            <div className={styles.info}>
                <div className={styles.textData}>
                    <h3 className={styles.name}>{product.name}</h3>
                    <span className={styles.price}>{formattedPrice}</span>
                </div>
                <button className={styles.addBtn} onClick={handleAdd}>
                    <div className={styles.crosshair}></div>
                </button>
            </div>
        </motion.div>
    );
}
