"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './Store.module.css';
import ProductCard, { Product } from './ProductCard';
import ProductModal from './ProductModal';
import { api } from '@/services/api';
import { useAppSelector } from '@/store/hooks';

export default function Store() {
    const selectedCategory = useAppSelector(state => state.ui.selectedCategory);
    const [products, setProducts] = useState<Product[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const listRef = useRef<HTMLDivElement>(null);
    const storeRef = useRef<HTMLElement>(null);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchData = async () => {
            setLoading(true);
            try {
                // For now, always use mock data as requested
                const mockImages = [
                    '/images/mock/anthony-espinosa-InCMGusiAvA-unsplash.jpg',
                    '/images/mock/bon-vivant-qom5MPOER-I-unsplash.jpg',
                    '/images/mock/fadya-azhary-5KS7T3Gs3CA-unsplash.jpg',
                    '/images/mock/michele-blackwell-rAyCBQTH7ws-unsplash.jpg',
                    '/images/mock/vinicius-benedit--1GEAA8q3wk-unsplash.jpg'
                ];

                const mockProducts: (Product & { category: string })[] = [
                    { id: 'm1', name: 'Philadelphia', price: 2000, currency: 'USD', description: 'Classic salmon roll', imageUrl: mockImages[0], category: 'rolls' },
                    { id: 'm2', name: 'California', price: 1800, currency: 'USD', description: 'Popular krab roll', imageUrl: mockImages[1], category: 'rolls' },
                    { id: 'm3', name: 'Dragon Roll', price: 2500, currency: 'USD', description: 'Eel and avocado', imageUrl: mockImages[2], category: 'rolls' },
                    { id: 'm4', name: 'Spicy Tuna', price: 2200, currency: 'USD', description: 'Vibrant tuna roll', imageUrl: mockImages[3], category: 'rolls' },
                    { id: 'm5', name: 'Rainbow Roll', price: 2800, currency: 'USD', description: 'Colorful variety', imageUrl: mockImages[4], category: 'rolls' },
                    { id: 'm6', name: 'Tempura Ebi', price: 2400, currency: 'USD', description: 'Crispy shrimp', imageUrl: mockImages[0], category: 'rolls' },
                    { id: 's1', name: 'Nigiri Set', price: 3500, currency: 'USD', description: 'Premium nigiri set', imageUrl: mockImages[1], category: 'sets' },
                    { id: 's2', name: 'Roll Combo', price: 4200, currency: 'USD', description: 'Mixed sushi combo', imageUrl: mockImages[2], category: 'sets' },
                    { id: 'd1', name: 'Green Tea', price: 500, currency: 'USD', description: 'Traditional tea', imageUrl: mockImages[3], category: 'drinks' },
                ];

                const filtered = mockProducts.filter(p => p.category === selectedCategory.toLowerCase());

                // Deduplication Logic:
                // First 4 go to Featured, rest go to List
                setFeaturedProducts(filtered.slice(0, 4));
                setProducts(filtered.slice(4));
            } catch (error) {
                console.error('Failed to prepare products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory]);

    // Simplified Scroll Logic:
    // We rely on native CSS behavior.
    // 1. Hover over List -> List scrolls (due to overflow-y: auto)
    // 2. Hover over Page -> Page scrolls
    // No Manual JS Interception needed.

    if (!mounted) return null;

    if (loading && products.length === 0 && featuredProducts.length === 0) return <div className={styles.loading}>LOADING DOJO DATABASE...</div>;

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
