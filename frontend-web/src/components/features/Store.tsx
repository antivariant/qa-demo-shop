"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    const [scrollReady, setScrollReady] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const listGridRef = useRef<HTMLDivElement>(null);
    const featuredRef = useRef<HTMLDivElement>(null);
    const storeRef = useRef<HTMLElement>(null);
    const anchorRef = useRef(0);
    const lockRef = useRef(false);
    const rafRef = useRef<number | null>(null);
    const overflowRef = useRef<string | null>(null);

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

    useEffect(() => {
        if (scrollReady) return;
        if (isLoading) return;
        if (storeRef.current && listRef.current) {
            setScrollReady(true);
        }
    }, [isLoading, scrollReady, allProducts]);

    useEffect(() => {
        if (!scrollReady) return;
        if (!window.matchMedia('(pointer: fine)').matches) return;
        const storeEl = storeRef.current;
        const listEl = listRef.current;
        const scrollRoot = document.querySelector('[data-testid="main-container"]') as HTMLElement | null;
        if (!storeEl || !listEl || !scrollRoot) return;

        const getAnchorOffset = () => {
            const value = window.getComputedStyle(storeEl).scrollMarginTop || '0';
            const parsed = parseFloat(value);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        const updateAnchor = () => {
            const rootTop = scrollRoot.getBoundingClientRect().top;
            const storeTop = storeEl.getBoundingClientRect().top - rootTop;
            anchorRef.current = scrollRoot.scrollTop + storeTop - getAnchorOffset();
        };

        const maxListScroll = () => Math.max(0, listEl.scrollHeight - listEl.clientHeight);
        const canListScroll = () => maxListScroll() > 1;

        const lockToAnchor = () => {
            const target = anchorRef.current;
            if (scrollRoot.scrollTop !== target) {
                scrollRoot.scrollTop = target;
            }
        };

        const setLocked = (next: boolean) => {
            lockRef.current = next;
            if (next) {
                if (overflowRef.current === null) {
                    overflowRef.current = scrollRoot.style.overflowY || '';
                }
                scrollRoot.style.overflowY = 'hidden';
                lockToAnchor();
            } else {
                if (overflowRef.current !== null) {
                    scrollRoot.style.overflowY = overflowRef.current;
                    overflowRef.current = null;
                }
            }
        };

        const listBottomAligned = () => {
            const listGridEl = listGridRef.current;
            const featuredEl = featuredRef.current;
            if (!listGridEl || !featuredEl) return false;
            const listBottom = listGridEl.getBoundingClientRect().bottom;
            const featuredBottom = featuredEl.getBoundingClientRect().bottom;
            return Math.abs(listBottom - featuredBottom) <= 1;
        };

        const onWheel = (event: WheelEvent) => {
            if (!canListScroll()) return;
            const delta = event.deltaY;
            if (delta === 0) return;
            const max = maxListScroll();
            const nextScrollTop = Math.min(max, Math.max(0, listEl.scrollTop + delta));
            const rootTop = scrollRoot.getBoundingClientRect().top;
            const storeTop = storeEl.getBoundingClientRect().top - rootTop;
            const anchorOffset = getAnchorOffset();
            const distanceToAnchor = storeTop - anchorOffset;

            if (!lockRef.current) {
                if (delta > 0 && distanceToAnchor > 0) {
                    if (delta < distanceToAnchor) return;
                    if (listEl.scrollTop >= max) return;
                    event.preventDefault();
                    scrollRoot.scrollTop += distanceToAnchor;
                    setLocked(true);
                    const remaining = delta - distanceToAnchor;
                    listEl.scrollTop = Math.min(max, Math.max(0, listEl.scrollTop + remaining));
                    return;
                }
                if (delta < 0 && distanceToAnchor < 0) {
                    const distanceUp = Math.abs(distanceToAnchor);
                    if (Math.abs(delta) < distanceUp) return;
                    if (listEl.scrollTop <= 0) return;
                    event.preventDefault();
                    listEl.scrollTop = max;
                    scrollRoot.scrollTop -= distanceUp;
                    setLocked(true);
                    const remaining = delta + distanceUp;
                    listEl.scrollTop = Math.min(max, Math.max(0, listEl.scrollTop + remaining));
                    return;
                }
                return;
            }

            const atLimit = nextScrollTop === listEl.scrollTop;
            if (delta > 0 && listBottomAligned()) {
                setLocked(false);
                return;
            }
            if ((delta > 0 && atLimit && listEl.scrollTop >= max) || (delta < 0 && atLimit && listEl.scrollTop <= 0)) {
                setLocked(false);
                return;
            }

            event.preventDefault();
            lockToAnchor();
            listEl.scrollTop = nextScrollTop;
        };

        const onScroll = () => {
            if (!lockRef.current) return;
            if (rafRef.current) return;
            rafRef.current = window.requestAnimationFrame(() => {
                lockToAnchor();
                rafRef.current = null;
            });
        };

        updateAnchor();
        window.addEventListener('resize', updateAnchor);
        document.addEventListener('wheel', onWheel, { passive: false, capture: true });
        scrollRoot.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('resize', updateAnchor);
            document.removeEventListener('wheel', onWheel, true);
            scrollRoot.removeEventListener('scroll', onScroll);
            if (rafRef.current) {
                window.cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            setLocked(false);
        };
    }, [scrollReady]);

    if ((isLoading || !allProducts) && products.length === 0 && featuredProducts.length === 0) return <div className={styles.loading}>LOADING DOJO DATABASE...</div>;

    if (error) return <div className={styles.loading}>SYSTEM ERROR: CANNOT CONNECT TO MAINFRAME</div>;

    return (
        <section ref={storeRef} className={styles.store} data-testid="store-section" id="store">
            {/* Left: Featured - Cyan Border */}
            <div className={styles.left}>
                <span className={styles.subtitle}>Hacker&apos;s choice</span>
                <div className={styles.featuredGrid} ref={featuredRef}>
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
                    <div className={styles.listGrid} ref={listGridRef}>
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
