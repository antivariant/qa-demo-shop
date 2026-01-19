"use client";

import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { ShoppingCart, User as UserIcon } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedCategory } from '@/store/features/ui/uiSlice';
import { logoutUser } from '@/store/features/auth/authSlice';
import { useMemo, useState, useEffect, useRef } from 'react';
import CartDrawer from '@/components/features/CartDrawer';
import UserMenu from './UserMenu';
import CheckoutModal from '@/components/features/CheckoutModal';
import { shopAuth } from '@/services/firebase';
import CartMergeModal from '@/components/features/CartMergeModal';
import { useGetCategoriesQuery } from '@/services/productsApi';
import { Category } from '@/types';

const formatCategoryLabel = (name: string) => name.replace(/_/g, ' ').toUpperCase();
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const speedProgress = (progress: number, speed: number) => clamp(1 - Math.pow(1 - progress, speed), 0, 1);
const mapSpeed = (distance: number, maxDistance: number, minSpeed: number, maxSpeed: number) => {
    if (!maxDistance) return minSpeed;
    return minSpeed + (distance / maxDistance) * (maxSpeed - minSpeed);
};
const getOffsetLeft = (element: HTMLElement, root: HTMLElement) => {
    let current: HTMLElement | null = element;
    let offset = 0;
    while (current && current !== root) {
        offset += current.offsetLeft;
        current = current.offsetParent as HTMLElement | null;
    }
    return offset;
};

export default function Header() {
    const dispatch = useAppDispatch();
    const router = useRouter();

    // UI State
    const selectedCategory = useAppSelector(state => state.ui.selectedCategory);

    // Cart State
    const cartItems = useAppSelector(state => state.cart.items);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Auth State
    const user = useAppSelector(state => state.auth.user);
    const isLoggedIn = Boolean(user || shopAuth.currentUser);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('HOME');
    const [revealProgress, setRevealProgress] = useState(0);
    const { data: categories = [] } = useGetCategoriesQuery();
    const categoryRailRef = useRef<HTMLDivElement | null>(null);
    const [categoryOffsets, setCategoryOffsets] = useState<number[]>([]);
    const [categoryWidths, setCategoryWidths] = useState<number[]>([]);
    const [categoryStartAnchor, setCategoryStartAnchor] = useState(0);
    const [categoryReady, setCategoryReady] = useState(false);
    const actionsRef = useRef<HTMLDivElement | null>(null);
    const [actionOffsets, setActionOffsets] = useState<number[]>([]);
    const [actionsStartAnchor, setActionsStartAnchor] = useState(0);
    const [actionsReady, setActionsReady] = useState(false);
    const testShopRef = useRef<HTMLAnchorElement | null>(null);
    const navPillRef = useRef<HTMLDivElement | null>(null);
    const easedReveal = revealProgress < 0.02 ? 0 : revealProgress > 0.98 ? 1 : revealProgress;
    const showRail = categoryReady && easedReveal > 0.001;
    const showActions = actionsReady && easedReveal > 0.001;

    const handleLogout = () => {
        dispatch(logoutUser());
        setIsUserMenuOpen(false);
    };

    const handleSetSelectedCategory = (category: string) => {
        dispatch(setSelectedCategory(category));
    };

    const menuItems = useMemo(() => {
        return [
            { name: 'HOME', section: 'hero', category: 'all' },
            { name: 'ABOUT', section: 'about', category: 'all' },
            { name: 'TEST SHOP', section: 'store', category: 'all' },
        ];
    }, []);

    useEffect(() => {
        const scrollRoot = document.querySelector('[data-testid="main-container"]');
        const observerOptions = {
            root: scrollRoot ?? null,
            rootMargin: '-10% 0px -70% 0px', // Trigger when section is in top part of viewport
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    if (sectionId === 'store') {
                        setActiveSection('TEST SHOP');
                    } else {
                        const activeMenuItem = menuItems.find(item => item.section === sectionId);
                        if (activeMenuItem) setActiveSection(activeMenuItem.name);
                    }
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        ['hero', 'store', 'about'].forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [menuItems]);

    useEffect(() => {
        const rail = categoryRailRef.current;
        const navPill = navPillRef.current;
        if (!rail || !navPill) return;
        const updateWidth = () => {
            const offsets = Array.from(rail.querySelectorAll('button')).map((item) => {
                return getOffsetLeft(item as HTMLElement, navPill);
            });
            if (offsets.length) setCategoryOffsets(offsets);
            const widths = Array.from(rail.querySelectorAll('button')).map((item) => (item as HTMLElement).offsetWidth);
            if (widths.length) setCategoryWidths(widths);
            if (testShopRef.current) {
                const anchor = getOffsetLeft(testShopRef.current, navPill) + testShopRef.current.offsetWidth / 2;
                setCategoryStartAnchor(anchor);
            }
            setCategoryReady(offsets.length === categories.length && widths.length === categories.length);
        };
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(rail);
        return () => observer.disconnect();
    }, [categories.length]);

    useEffect(() => {
        const actions = actionsRef.current;
        const navPill = navPillRef.current;
        if (!actions || !navPill) return;
        const updateOffsets = () => {
            const offsets = Array.from(actions.querySelectorAll('button')).map((item) => {
                return getOffsetLeft(item as HTMLElement, navPill);
            });
            if (offsets.length) setActionOffsets(offsets);
            setActionsStartAnchor(navPill.clientWidth + 24);
            setActionsReady(offsets.length > 0);
        };
        updateOffsets();
        const observer = new ResizeObserver(updateOffsets);
        observer.observe(actions);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
        const storeStart = 1 / 3;
        const storeEnd = 1 / 2;
        const aboutStart = 0.2;
        const aboutEnd = 1 / 3;
        let frame = 0;

        const getScrollContext = () => {
            const root = document.querySelector('[data-testid="main-container"]') as HTMLElement | null;
            if (root && root.scrollHeight > root.clientHeight + 2) {
                return {
                    root,
                    scrollTop: root.scrollTop,
                    rootTop: root.getBoundingClientRect().top,
                    rootHeight: root.clientHeight,
                };
            }
            const doc = document.documentElement;
            return {
                root: null,
                scrollTop: window.scrollY,
                rootTop: 0,
                rootHeight: window.innerHeight,
            };
        };

        const updateProgress = () => {
            const context = getScrollContext();
            const store = document.getElementById('store');
            const about = document.getElementById('about');
            let next = 0;
            const visibleFraction = (element: HTMLElement) => {
                const rect = element.getBoundingClientRect();
                const top = rect.top - context.rootTop;
                return clamp((context.rootHeight - top) / rect.height, 0, 1);
            };

            if (store instanceof HTMLElement) {
                const storeVisible = visibleFraction(store);
                next = clamp((storeVisible - storeStart) / (storeEnd - storeStart), 0, 1);
            }

            if (about instanceof HTMLElement) {
                const aboutVisible = visibleFraction(about);
                const aboutProgress = clamp((aboutVisible - aboutStart) / (aboutEnd - aboutStart), 0, 1);
                if (aboutProgress > 0) {
                    next = 1 - aboutProgress;
                }
            }

            setRevealProgress(next);
        };

        const onScroll = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                updateProgress();
                frame = 0;
            });
        };

        updateProgress();
        const scrollRoot = document.querySelector('[data-testid="main-container"]') as HTMLElement | null;
        scrollRoot?.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            scrollRoot?.removeEventListener('scroll', onScroll);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, []);

    const handleNavClick = (item: typeof menuItems[0]) => {
        const element = document.getElementById(item.section);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            if (item.section === 'store') {
                handleSetSelectedCategory(item.category);
            }
            setActiveSection(item.name);
        }
    };

    return (
        <>
            <header className={styles.header}>
                <div className={styles.navPill} ref={navPillRef}>
                    <nav className={styles.nav}>
                        <div className={styles.navCore}>
                            {menuItems.map((item) => (
                                <a
                                    key={item.name}
                                    className={activeSection === item.name ? styles.active : ''}
                                    onClick={() => handleNavClick(item)}
                                    ref={item.name === 'TEST SHOP' ? testShopRef : undefined}
                                >
                                    {item.name}
                                </a>
                            ))}
                        </div>
                        <div
                            className={`${styles.categoryRail} ${showRail ? styles.railReady : ''}`}
                            ref={categoryRailRef}
                            style={{
                                pointerEvents: showRail ? 'auto' : 'none',
                            }}
                        >
                            {categories.map((category: Category, index) => {
                                const startAnchor = categoryStartAnchor - 16;
                                const offset = categoryOffsets[index] ?? 0;
                                const width = categoryWidths[index] ?? 0;
                                const centerOffset = offset + width / 2;
                                const travels = categoryOffsets.length
                                    ? categoryOffsets.map((value, idx) => {
                                        const w = categoryWidths[idx] ?? 0;
                                        return Math.abs(value + w / 2 - startAnchor);
                                    })
                                    : [0];
                                const maxTravel = Math.max(...travels, 1);
                                const travel = Math.abs(centerOffset - startAnchor);
                                const speed = mapSpeed(travel, maxTravel, 0.8, 1.6);
                                const itemProgress = speedProgress(easedReveal, speed);
                                const startX = startAnchor - centerOffset;
                                const translateX = startX * (1 - itemProgress);
                                return (
                                    <button
                                        key={category.id}
                                        className={styles.categoryItem}
                                        style={{
                                            transform: `translateX(${translateX}px)`,
                                            pointerEvents: categoryReady && easedReveal > 0.05 ? 'auto' : 'none',
                                        }}
                                        onClick={() => handleNavClick({ name: formatCategoryLabel(category.name), section: 'store', category: category.id })}
                                    >
                                        {formatCategoryLabel(category.name)}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    <div
                        className={`${styles.actions} ${showActions ? styles.actionsReady : ''}`}
                        ref={actionsRef}
                        style={{
                            pointerEvents: showActions ? 'auto' : 'none',
                        }}
                    >
                        <button
                            className={styles.iconBtn}
                            style={{
                                transform: `translateX(${(() => {
                                    const startAnchor = actionsStartAnchor || 0;
                                    const offset = actionOffsets[0] ?? 0;
                                    const travels = actionOffsets.length
                                        ? actionOffsets.map((value) => Math.abs(startAnchor - value))
                                        : [0];
                                    const maxTravel = Math.max(...travels, 1);
                                    const travel = Math.abs(startAnchor - offset);
                                    const speed = mapSpeed(travel, maxTravel, 0.9, 1.4);
                                    const itemProgress = speedProgress(easedReveal, speed);
                                    return (startAnchor - offset) * (1 - itemProgress);
                                })()}px)`,
                                transition: 'color 0.2s ease',
                                pointerEvents: actionsReady && easedReveal > 0.05 ? 'auto' : 'none',
                            }}
                            onClick={() => {
                                if (isLoggedIn) {
                                    setIsUserMenuOpen(true);
                                } else {
                                    router.push('/login');
                                }
                            }}
                            title="Account"
                        >
                            <UserIcon size={20} color={isLoggedIn ? "var(--accent)" : undefined} />
                        </button>
                        <button
                            className={styles.iconBtn}
                            style={{
                                transform: `translateX(${(() => {
                                    const startAnchor = actionsStartAnchor || 0;
                                    const offset = actionOffsets[1] ?? 0;
                                    const travels = actionOffsets.length
                                        ? actionOffsets.map((value) => Math.abs(startAnchor - value))
                                        : [0];
                                    const maxTravel = Math.max(...travels, 1);
                                    const travel = Math.abs(startAnchor - offset);
                                    const speed = mapSpeed(travel, maxTravel, 0.9, 1.4);
                                    const itemProgress = speedProgress(easedReveal, speed);
                                    return (startAnchor - offset) * (1 - itemProgress);
                                })()}px)`,
                                transition: 'color 0.2s ease',
                                pointerEvents: actionsReady && easedReveal > 0.05 ? 'auto' : 'none',
                            }}
                            onClick={() => setIsCartOpen(true)}
                        >
                            <ShoppingCart size={20} />
                            {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
                        </button>
                    </div>
                </div>
            </header>

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onOpenCheckout={() => {
                    if (!user) {
                        setIsCartOpen(false);
                        router.push('/login');
                        return;
                    }
                    setIsCheckoutOpen(true);
                }}
            />
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
            />
            <UserMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
                onLogout={handleLogout}
                username={user?.displayName || user?.email || 'User'}
            />
            <CartMergeModal />
        </>
    );
}
