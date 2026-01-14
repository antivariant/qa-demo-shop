"use client";

import Link from 'next/link';
import styles from './Header.module.css';
import { LucideIcon, ShoppingCart, User as UserIcon } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedCategory, setCurrentSection } from '@/store/features/ui/uiSlice';
import { logoutUser } from '@/store/features/auth/authSlice';
import { useState, useEffect } from 'react';
import CartDrawer from '@/components/features/CartDrawer';

interface Category {
    id: string;
    name: string;
}

export default function Header() {
    const dispatch = useAppDispatch();

    // UI State
    const selectedCategory = useAppSelector(state => state.ui.selectedCategory);

    // Cart State
    const cartItems = useAppSelector(state => state.cart.items);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Auth State
    const user = useAppSelector(state => state.auth.user);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('ROLLS');
    const [mounted, setMounted] = useState(false);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const handleSetSelectedCategory = (category: string) => {
        dispatch(setSelectedCategory(category));
    };

    const menuItems = [
        { name: 'HOME', section: 'hero', category: 'all' },
        { name: 'ROLLS', section: 'store', category: 'rolls' },
        { name: 'SETS', section: 'store', category: 'sets' },
        { name: 'DRINKS', section: 'store', category: 'drinks' },
        { name: 'ABOUT', section: 'about', category: 'all' },
    ];

    useEffect(() => {
        setMounted(true);

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
                            item.category === selectedCategory.toLowerCase()
                        );
                        if (activeItem) setActiveSection(activeItem.name);
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
    }, [selectedCategory]);

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

    if (!mounted) return null; // Render nothing until mounted to prevent hydration issues

    return (
        <>
            <header className={styles.header}>
                <div className={styles.navPill}>
                    <Link href="/" className={styles.logo} onClick={() => {
                        handleSetSelectedCategory('ALL');
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
                        {user ? (
                            <button className={styles.iconBtn} onClick={handleLogout} title="Logout">
                                <UserIcon size={20} color="var(--accent)" />
                            </button>
                        ) : (
                            <Link href="/login" className={styles.iconBtn}>
                                <UserIcon size={20} />
                            </Link>
                        )}
                        <button className={styles.iconBtn} onClick={() => setIsCartOpen(true)}>
                            <ShoppingCart size={20} />
                            {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
                        </button>
                    </div>
                </div>
            </header>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
