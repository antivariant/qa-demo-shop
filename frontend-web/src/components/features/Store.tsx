"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './Store.module.css';
import ProductCard, { Product } from './ProductCard';
import ProductModal from './ProductModal';
import { api } from '@/services/api';
import { useUI } from '@/context/UIContext';

export default function Store() {
    const { selectedCategory } = useUI();
    const [products, setProducts] = useState<Product[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const listRef = useRef<HTMLDivElement>(null);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchData = async () => {
            setLoading(true);
            try {
                // For now, always use mock data as requested
                const mockImages = [
                    '/docs/mockimg/anthony-espinosa-InCMGusiAvA-unsplash.jpg',
                    '/docs/mockimg/bon-vivant-qom5MPOER-I-unsplash.jpg',
                    '/docs/mockimg/fadya-azhary-5KS7T3Gs3CA-unsplash.jpg',
                    '/docs/mockimg/michele-blackwell-rAyCBQTH7ws-unsplash.jpg',
                    '/docs/mockimg/vinicius-benedit--1GEAA8q3wk-unsplash.jpg'
                ];

                const mockProducts: Product[] = [
                    { id: 'm1', name: 'Philadelphia', price: 2000, currency: 'USD', description: 'Classic salmon roll', imageUrl: mockImages[0] },
                    { id: 'm2', name: 'California', price: 1800, currency: 'USD', description: 'Popular krab roll', imageUrl: mockImages[1] },
                    { id: 'm3', name: 'Dragon Roll', price: 2500, currency: 'USD', description: 'Eel and avocado', imageUrl: mockImages[2] },
                    { id: 'm4', name: 'Spicy Tuna', price: 2200, currency: 'USD', description: 'Vibrant tuna roll', imageUrl: mockImages[3] },
                    { id: 'm5', name: 'Rainbow Roll', price: 2800, currency: 'USD', description: 'Colorful variety', imageUrl: mockImages[4] },
                    { id: 'm6', name: 'Tempura Ebi', price: 2400, currency: 'USD', description: 'Crispy shrimp', imageUrl: mockImages[0] },
                ];

                setProducts(mockProducts);
                setFeaturedProducts(mockProducts.slice(0, 4));
            } catch (error) {
                console.error('Failed to prepare products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory]);

    // Handle internal scroll interception
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const list = listRef.current;
            if (!list) return;

            const isAtTop = list.scrollTop === 0;
            const isAtBottom = list.scrollHeight - list.scrollTop <= list.clientHeight + 1;

            // If we are at the top and scrolling up, allow landing on Home
            if (isAtTop && e.deltaY < 0) return;

            // If we are at the bottom and scrolling down, allow landing on About
            if (isAtBottom && e.deltaY > 0) return;

            // Otherwise, manually scroll the list and block page scroll
            list.scrollTop += e.deltaY;
            e.preventDefault();
        };

        const container = listRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => container?.removeEventListener('wheel', handleWheel);
    }, []);

    if (loading && products.length === 0) return <div className={styles.loading}>LOADING DOJO DATABASE...</div>;

    return (
        <section className={styles.store} id="store">
            {/* Left: Featured - Cyan Border */}
            <div className={styles.left}>
                <h2 className={styles.title}>Rolls</h2>
                <span className={styles.subtitle}>Hacker&apos;s choice:</span>
                <div className={styles.grid}>
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
                <div className={styles.listScrollContainer} ref={listRef}>
                    <div className={styles.grid}>
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
