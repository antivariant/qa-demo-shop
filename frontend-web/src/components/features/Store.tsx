"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './Store.module.css';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { useGetProductsQuery } from '@/services/productsApi';
import { useAppSelector } from '@/store/hooks';
import { Product } from '@/types';

export default function Store() {
    const selectedCategory = useAppSelector(state => state.ui.selectedCategory);

    // RTK Query hook handles fetching, caching, and state
    const { data: allProducts, isLoading, error } = useGetProductsQuery(selectedCategory === 'all' ? undefined : selectedCategory);

    const [products, setProducts] = useState<Product[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const storeRef = useRef<HTMLElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (allProducts) {
            setFeaturedProducts(allProducts.slice(0, 4));
            setProducts(allProducts.slice(4));
        }
    }, [allProducts]);

    // Simplified Scroll Logic:
    // We rely on native CSS behavior.
    // 1. Hover over List -> List scrolls (due to overflow-y: auto)
    // 2. Hover over Page -> Page scrolls
    // No Manual JS Interception needed.

    if (!mounted) return null;

    if ((isLoading || !allProducts) && products.length === 0 && featuredProducts.length === 0) return <div className={styles.loading}>LOADING DOJO DATABASE...</div>;

    if (error) return <div className={styles.loading}>SYSTEM ERROR: CANNOT CONNECT TO MAINFRAME</div>;

    return (
        <section ref={storeRef} className={styles.store} data-testid="store-section" id="store">
            {/* Left: Featured - Cyan Border */}
            <div className={styles.left}>
                <span className={styles.subtitle}>Hacker&apos;s choice</span>
                <div className={styles.featuredGrid}>
                    {featuredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            variant="featured"
                            onClick={(p) => setSelectedProduct(p)}
                        />
                    ))}
                </div>
            </div>

            {/* Right: All Products - Scrolling */}
            <div className={styles.right}>
                <div className={styles.listScrollContainer} ref={listRef} data-testid="product-list-scroll">
                    <div className={styles.listGrid}>
                        {products.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                variant="list"
                                onClick={(p: Product) => setSelectedProduct(p)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <ProductModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </section>
    );
}
