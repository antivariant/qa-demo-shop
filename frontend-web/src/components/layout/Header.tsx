"use client";

import Link from 'next/link';
import styles from './Header.module.css';
import { LucideIcon, ShoppingCart, User as UserIcon } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useState, useEffect } from 'react';
import CartDrawer from '@/components/features/CartDrawer';
import { api } from '@/services/api';

interface Category {
    id: string;
    name: string;
}

export default function Header() {
    const { totalItems } = useCart();
    const { user, logout } = useAuth();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('HOME');
    const { setSelectedCategory } = useUI(); // Added setSelectedCategory from useUI
    const [mounted, setMounted] = useState(false);

    const menuItems = [
        { name: 'HOME', section: 'hero', category: 'ALL' },
        { name: 'ROLLS', section: 'store', category: 'ROLLS' },
        { name: 'SETS', section: 'store', category: 'SETS' },
        { name: 'HOT', section: 'store', category: 'HOT' },
        { name: 'BUSINESS LUNCH', section: 'store', category: 'BUSINESS' },
        { name: 'ABOUT ME', section: 'about', category: 'ALL' },
    ];

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            const scrollPos = window.scrollY + 100; // Adjusted scroll position for better active section detection
            const sections = ['hero', 'store', 'about'];

            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element && scrollPos >= element.offsetTop && scrollPos < element.offsetTop + element.offsetHeight) {
                    // Find the corresponding menu item for the active section
                    const activeMenuItem = menuItems.find(item => item.section === sectionId);
                    if (activeMenuItem) {
                        setActiveSection(activeMenuItem.name);
                    }
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (item: typeof menuItems[0]) => {
        const element = document.getElementById(item.section);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            if (item.section === 'store') {
                setSelectedCategory(item.category);
                setActiveSection(item.name);
            } else {
                setSelectedCategory('ALL'); // Reset category when navigating away from store
                setActiveSection(item.name);
            }
        }
    };

    if (!mounted) return null; // Render nothing until mounted to prevent hydration issues

    return (
        <>
            <header className={styles.header}>
                <div className={styles.navPill}>
                    <Link href="/" className={styles.logo} onClick={() => {
                        setSelectedCategory('ALL');
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
                            <button className={styles.iconBtn} onClick={logout} title="Logout">
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
