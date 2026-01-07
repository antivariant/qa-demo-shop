"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ProductList.module.css';
import ProductModal from './ProductModal';
import ProductCard from './ProductCard';
import { api } from '@/services/api';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    imageUrl: string;
    categoryId: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ProductList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await api.getCategories();
                setCategories([{ id: 'all', name: 'ALL' }, ...data]);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await api.getProducts(activeCategory === 'all' ? undefined : activeCategory);
                setProducts(data);
            } catch (err) {
                console.error("Failed to fetch products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [activeCategory]);

    return (
        <section className={styles.section} id="menu">
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>CHOOSE YOUR EXPERIENCE</h2>
                    <div className={styles.categories}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.active : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.name}
                                {activeCategory === cat.id && (
                                    <motion.div layoutId="underline" className={styles.underline} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loading}>LOADING...</div>
                ) : (
                    <motion.div layout className={styles.grid}>
                        <AnimatePresence mode='popLayout'>
                            {products.map(product => (
                                <div key={product.id} onClick={() => setSelectedProduct(product)}>
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </AnimatePresence>
                        {products.length === 0 && (
                            <div className={styles.empty}>No products found in this category.</div>
                        )}
                    </motion.div>
                )}

                <ProductModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            </div>
        </section>
    );
}
