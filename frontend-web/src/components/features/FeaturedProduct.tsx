"use client";

import { motion } from 'framer-motion';
import styles from './FeaturedProduct.module.css';
import Image from 'next/image';

import { useCart } from '@/context/CartContext';

const MOCK_FEATURED = {
    id: 'prod_001',
    name: 'Signature DOJO Roll',
    description: 'A masterpiece of taste featuring premium bluefin tuna, avocado, and our secret truffle-infused soy glaze. Hand-crafted daily by our master chefs.',
    price: 2499,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop'
};

export default function FeaturedProduct() {
    const { addToCart } = useCart();
    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: MOCK_FEATURED.currency,
    }).format(MOCK_FEATURED.price / 100);

    return (
        <section className={styles.section} id="featured">
            <div className={`container ${styles.grid}`}>
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className={styles.imageContainer}
                >
                    <div className={styles.imageWrapper}>
                        <img src={MOCK_FEATURED.imageUrl} alt={MOCK_FEATURED.name} className={styles.image} />
                    </div>
                    <div className={styles.blob}></div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className={styles.info}
                >
                    <span className={styles.badge}>CHEF&apos;S CHOICE</span>
                    <h2 className={styles.title}>{MOCK_FEATURED.name}</h2>
                    <p className={styles.description}>{MOCK_FEATURED.description}</p>
                    <div className={styles.priceRow}>
                        <span className={styles.price}>{formattedPrice}</span>
                        <button className={styles.addBtn} onClick={() => addToCart(MOCK_FEATURED, 1)}>
                            ADD TO CART
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
