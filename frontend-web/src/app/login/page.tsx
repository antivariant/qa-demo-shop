"use client";

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loginUser } from '@/store/features/auth/authSlice';
import styles from './Login.module.css';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { shopAuth } from '@/services/firebase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [registerOpen, setRegisterOpen] = useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await dispatch(loginUser({ email, password })).unwrap(); // Ensure thunk errors are caught
            router.push('/');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to login';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${styles.card} glass`}
            >
                <h1 className={styles.title}>SIGN IN</h1>
                <p className={styles.subtitle}>Welcome back to DOJO</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>EMAIL ADDRESS</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="chef@dojo.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? 'SIGNING IN...' : 'CONTINUE'}
                    </button>
                </form>

                <p className={styles.footerText}>
                    Don&apos;t have an account? <span onClick={() => setRegisterOpen(true)}>Sign up</span>
                </p>
            </motion.div>

            {registerOpen && (
                <RegisterModal
                    onClose={() => setRegisterOpen(false)}
                    onSuccess={() => {
                        setRegisterOpen(false);
                        router.push('/');
                    }}
                />
            )}
        </div>
    );
}

function RegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.registerShopUser({
                email,
                password,
                name: name.trim() || undefined,
            });
            await signInWithEmailAndPassword(shopAuth, email, password);
            onSuccess();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to register';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.2 }}
                className={styles.modalCard}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <button className={styles.modalClose} onClick={onClose} type="button">
                    Close
                </button>
                <h2 className={styles.modalTitle}>CREATE ACCOUNT</h2>
                <p className={styles.modalSubtitle}>Register a sandbox user for the store.</p>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>EMAIL ADDRESS</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="chef@dojo.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>NAME (OPTIONAL)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your display name"
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
