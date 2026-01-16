"use client";

import React, { useMemo, useRef, useState } from 'react';
import styles from './Store.module.css';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { useGetProductsQuery } from '@/services/productsApi';
import { useAppSelector } from '@/store/hooks';
import { Product } from '@/types';

export default function Store() {
    const selectedCategory = useAppSelector(state => state.ui.selectedCategory);

    // RTK Query hook handles fetching, caching, and state
    // Always fetch all products when selectedCategory is 'all' or undefined
    const { data: allProducts, isLoading, error } = useGetProductsQuery(
        selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined
    );

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const storeRef = useRef<HTMLElement>(null);

    const { featuredProducts, products } = useMemo(() => {
        if (!allProducts) {
            return { featuredProducts: [], products: [] };
        }

        const featuredCandidates = allProducts.filter(product => product.featured);
        let featuredSelection: Product[] = [];

        if (!selectedCategory || selectedCategory === 'all') {
            const categoryOrder: string[] = [];
            const featuredByCategory = new Map<string, Product[]>();

            allProducts.forEach((product) => {
                if (!categoryOrder.includes(product.categoryId)) {
                    categoryOrder.push(product.categoryId);
                }
                if (product.featured) {
                    const existing = featuredByCategory.get(product.categoryId) ?? [];
                    featuredByCategory.set(product.categoryId, [...existing, product]);
                }
            });

            const limitedCategories = categoryOrder.slice(0, 6);
            const categoryCursor = new Map<string, number>();

            for (const categoryId of limitedCategories) {
                categoryCursor.set(categoryId, 0);
            }

            let addedInCycle = true;
            while (featuredSelection.length < 6 && limitedCategories.length > 0 && addedInCycle) {
                addedInCycle = false;
                for (const categoryId of limitedCategories) {
                    const picks = featuredByCategory.get(categoryId) ?? [];
                    const cursor = categoryCursor.get(categoryId) ?? 0;
                    const candidate = picks[cursor];
                    if (candidate && !featuredSelection.some((item) => item.id === candidate.id)) {
                        featuredSelection.push(candidate);
                        categoryCursor.set(categoryId, cursor + 1);
                        addedInCycle = true;
                    }
                    if (featuredSelection.length >= 6) {
                        break;
                    }
                }
            }
        } else {
            if (featuredCandidates.length > 6) {
                console.error('Featured limit exceeded: showing first 6, sending the rest to the list.');
            }
            featuredSelection = featuredCandidates.slice(0, 6);
        }

        const featuredIds = new Set(featuredSelection.map(product => product.id));
        const listProducts = allProducts.filter(product => !featuredIds.has(product.id));

        return { featuredProducts: featuredSelection, products: listProducts };
    }, [allProducts, selectedCategory]);

    // Simplified Scroll Logic:
    // We rely on native CSS behavior.
    // 1. Hover over List -> List scrolls (due to overflow-y: auto)
    // 2. Hover over Page -> Page scrolls
    // No Manual JS Interception needed.

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
