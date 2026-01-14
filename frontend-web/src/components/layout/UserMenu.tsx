"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, User } from 'lucide-react';
import styles from './UserMenu.module.css';

interface UserMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
    username: string | null;
}

export default function UserMenu({ isOpen, onClose, onLogout, username }: UserMenuProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.overlay}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className={styles.menu}
                    >
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={18} />
                        </button>

                        <div className={styles.header}>
                            <div className={styles.avatar}>
                                <User size={24} />
                            </div>
                            <h3 className={styles.username}>{username || 'User'}</h3>
                        </div>

                        <div className={styles.actions}>
                            {/* TODO: Add Edit Profile functionality */}
                            <button className={styles.actionBtn} onClick={onLogout}>
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
