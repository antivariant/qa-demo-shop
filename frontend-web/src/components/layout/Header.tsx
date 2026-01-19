"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { ShoppingCart, User as UserIcon } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedCategory } from '@/store/features/ui/uiSlice';
import { logoutUser } from '@/store/features/auth/authSlice';
import { useMemo, useState, useEffect } from 'react';
import CartDrawer from '@/components/features/CartDrawer';
import UserMenu from './UserMenu';
import CheckoutModal from '@/components/features/CheckoutModal';
import { shopAuth } from '@/services/firebase';
import CartMergeModal from '@/components/features/CartMergeModal';
import { useGetCategoriesQuery } from '@/services/productsApi';
import { Category } from '@/types';

const formatCategoryLabel = (name: string) => name.replace(/_/g, ' ').toUpperCase();

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
    const { data: categories = [] } = useGetCategoriesQuery();

    const handleLogout = () => {
        dispatch(logoutUser());
        setIsUserMenuOpen(false);
    };

    const handleSetSelectedCategory = (category: string) => {
        dispatch(setSelectedCategory(category));
    };

    const menuItems = useMemo(() => {
        const dynamicCategories = categories.map((category: Category) => ({
            name: formatCategoryLabel(category.name),
            section: 'store',
            category: category.id,
        }));

        return [
            { name: 'HOME', section: 'hero', category: 'all' },
            ...dynamicCategories,
            { name: 'ABOUT', section: 'about', category: 'all' },
        ];
    }, [categories]);

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-10% 0px -70% 0px', // Trigger when section is in top part of viewport
            threshold: 0
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    if (sectionId === 'store') {
                        const activeItem = menuItems.find(item =>
                            item.section === 'store' &&
                            item.category === selectedCategory
                        );
                        if (activeItem) {
                            setActiveSection(activeItem.name);
                        } else {
                            const fallbackItem = menuItems.find(item => item.section === 'store');
                            if (fallbackItem) setActiveSection(fallbackItem.name);
                        }
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
    }, [menuItems, selectedCategory]);

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
                <div className={styles.navPill}>
                    <Link href="/" className={styles.logo} onClick={() => {
                        handleSetSelectedCategory('all');
                        setActiveSection('HOME');
                    }}>
                        SDETEDU.COM
                    </Link>

                    <nav className={styles.nav}>
                        {menuItems.map((item) => (
                            <a
                                key={item.name}
                                className={activeSection === item.name ? styles.active : ''}
                                onClick={() => handleNavClick(item)}
                            >
                                {item.name}
                            </a>
                        ))}
                    </nav>

                    <div className={styles.actions}>
                        <button
                            className={styles.iconBtn}
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
                        <button className={styles.iconBtn} onClick={() => setIsCartOpen(true)}>
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
