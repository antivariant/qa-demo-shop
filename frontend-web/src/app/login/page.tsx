"use client";

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loginUser } from '@/store/features/auth/authSlice';
import styles from './Login.module.css';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await dispatch(loginUser({ email, password })).unwrap(); // Ensure thunk errors are caught
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to login');
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
                    Don&apos;t have an account? <span>Sign up</span>
                </p>
            </motion.div>
        </div>
    );
}
