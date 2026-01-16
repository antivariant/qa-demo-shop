"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LogOut, Send, User } from 'lucide-react';
import { auth } from '@/services/firebase';
import { api } from '@/services/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { SdetUser } from '@/types';
import { logoutUser } from '@/store/features/auth/authSlice';
import styles from './SdetPanel.module.css';

type AuthMode = 'login' | 'register';

export default function SdetPanel() {
    const dispatch = useAppDispatch();
    const authState = useAppSelector((state) => state.auth);
    const [profile, setProfile] = useState<SdetUser | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');

    const [authOpen, setAuthOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [bugReportOpen, setBugReportOpen] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>('login');

    useEffect(() => {
        let mounted = true;
        if (!authState.isAuthenticated) {
            setProfile(null);
            return;
        }

        setProfileLoading(true);
        setProfileError('');
        api.getSdetUser()
            .then((data) => {
                if (mounted) setProfile(data);
            })
            .catch((error: unknown) => {
                if (!mounted) return;
                const message = error instanceof Error ? error.message : 'Failed to load SDET profile';
                setProfileError(message);
            })
            .finally(() => {
                if (mounted) setProfileLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [authState.isAuthenticated]);

    const bugScore = useMemo(() => {
        const enabled = profile?.bugsEnabled ?? 5;
        const found = profile?.bugsFound ?? 0;
        return {
            enabled,
            found,
            enabledLabel: String(enabled).padStart(2, '0'),
            foundLabel: String(found).padStart(2, '0'),
        };
    }, [profile?.bugsEnabled, profile?.bugsFound]);

    const handleAuthClick = async () => {
        if (authState.isAuthenticated) {
            await dispatch(logoutUser());
            return;
        }
        setAuthMode('login');
        setAuthOpen(true);
    };

    const handleEnabledClick = () => {
        if (authState.isAuthenticated) {
            setSettingsOpen(true);
        } else {
            setAuthMode('login');
            setAuthOpen(true);
        }
    };

    return (
        <>
            <motion.div
                className={styles.panel}
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 1.8 }}
            >
                <div className={styles.columns}>
                    <div className={styles.column}>
                        <div className={styles.iconWrap}>
                            <motion.button
                                className={styles.iconButton}
                                onClick={handleAuthClick}
                                aria-label={authState.isAuthenticated ? 'Logout SDET user' : 'Register or login'}
                                title={authState.isAuthenticated ? 'Logout' : 'Register / Login'}
                                initial={{ opacity: 0, y: 36 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut', delay: 2.4 }}
                            >
                                {authState.isAuthenticated ? <LogOut size={18} /> : <User size={18} />}
                            </motion.button>
                        </div>
                        <button className={styles.scoreButton} onClick={handleEnabledClick} type="button">
                            <span className={styles.counter}>{bugScore.enabledLabel}</span>
                            <span className={styles.counterLabel}>bugs</span>
                        </button>
                    </div>
                    <div className={styles.column}>
                        <div className={styles.iconWrap}>
                            <motion.button
                                className={styles.iconButton}
                                onClick={() => setBugReportOpen(true)}
                                aria-label="Send bug report"
                                title="Send bug report"
                                initial={{ opacity: 0, y: 36 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut', delay: 2.4 }}
                            >
                                <Send size={18} />
                            </motion.button>
                        </div>
                        <button className={styles.scoreButton} onClick={() => setBugReportOpen(true)} type="button">
                            <span className={styles.counter}>{bugScore.foundLabel}</span>
                            <span className={styles.counterLabel}>found</span>
                        </button>
                    </div>
                </div>
                {profileError && <p className={styles.errorText}>{profileError}</p>}
                {profileLoading && authState.isAuthenticated && (
                    <p className={styles.helperText}>Loading SDET profile...</p>
                )}
            </motion.div>

            <AnimatePresence>
                {authOpen && (
                    <AuthModal
                        mode={authMode}
                        onClose={() => setAuthOpen(false)}
                        onSwitch={(mode) => setAuthMode(mode)}
                        onSuccess={(data) => {
                            setProfile(data);
                            setAuthOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {settingsOpen && (
                    <SettingsModal
                        profile={profile}
                        onClose={() => setSettingsOpen(false)}
                        onSaved={(data) => {
                            setProfile(data);
                            setSettingsOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {bugReportOpen && (
                    <BugReportModal onClose={() => setBugReportOpen(false)} />
                )}
            </AnimatePresence>
        </>
    );
}

function AuthModal({
    mode,
    onClose,
    onSwitch,
    onSuccess,
}: {
    mode: AuthMode;
    onClose: () => void;
    onSwitch: (mode: AuthMode) => void;
    onSuccess: (profile: SdetUser) => void;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                const registered = await api.registerSdetUser({
                    email,
                    password,
                    name: name.trim() || undefined,
                });
                await signInWithEmailAndPassword(auth, email, password);
                onSuccess(registered);
                return;
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }

            const profile = await api.getSdetUser();
            onSuccess(profile);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Authentication failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <h3 className={styles.modalTitle}>{mode === 'register' ? 'Create SDET account' : 'SDET login'}</h3>
            <p className={styles.modalSubtitle}>
                {mode === 'register'
                    ? 'Email + password registration. This is separate from the store test user.'
                    : 'Sign in to manage your SDET profile.'}
            </p>
            <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.label}>
                    Email
                    <input
                        className={styles.input}
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="sdet@dojo.com"
                        required
                    />
                </label>
                <label className={styles.label}>
                    Password
                    <input
                        className={styles.input}
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </label>
                {mode === 'register' && (
                    <label className={styles.label}>
                        Name (optional)
                        <input
                            className={styles.input}
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Your display name"
                        />
                    </label>
                )}
                {error && <p className={styles.errorText}>{error}</p>}
                <button className={styles.primaryButton} type="submit" disabled={loading}>
                    {loading ? 'PROCESSING...' : mode === 'register' ? 'REGISTER' : 'LOGIN'}
                </button>
            </form>
            <button
                className={styles.linkButton}
                type="button"
                onClick={() => onSwitch(mode === 'register' ? 'login' : 'register')}
            >
                {mode === 'register' ? 'Already registered? Login' : 'Need an account? Register'}
            </button>
        </Modal>
    );
}

function SettingsModal({
    profile,
    onClose,
    onSaved,
}: {
    profile: SdetUser | null;
    onClose: () => void;
    onSaved: (profile: SdetUser) => void;
}) {
    const [name, setName] = useState(profile?.name || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const updated = await api.updateSdetUser({ name });
            onSaved(updated);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save settings';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <h3 className={styles.modalTitle}>SDET settings</h3>
            <p className={styles.modalSubtitle}>Keep your profile ready for bug hunts.</p>
            <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.label}>
                    Name
                    <input
                        className={styles.input}
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your display name"
                    />
                </label>
                <label className={styles.label}>
                    Email
                    <input
                        className={styles.input}
                        type="email"
                        value={profile?.email || ''}
                        disabled
                    />
                </label>
                {error && <p className={styles.errorText}>{error}</p>}
                <button className={styles.primaryButton} type="submit" disabled={loading}>
                    {loading ? 'SAVING...' : 'SAVE SETTINGS'}
                </button>
            </form>
        </Modal>
    );
}

function BugReportModal({ onClose }: { onClose: () => void }) {
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setSent(true);
    };

    return (
        <Modal onClose={onClose}>
            <h3 className={styles.modalTitle}>Bug report</h3>
            <p className={styles.modalSubtitle}>Mock form for now. Reports are not sent yet.</p>
            <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.label}>
                    Issue details
                    <textarea
                        className={styles.textarea}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Describe the bug you found..."
                        rows={4}
                    />
                </label>
                <button className={styles.primaryButton} type="submit" disabled={sent}>
                    {sent ? 'REPORT SENT' : 'SEND REPORT'}
                </button>
            </form>
        </Modal>
    );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.2 }}
                className={styles.modal}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {children}
                <button className={styles.closeButton} type="button" onClick={onClose}>
                    Close
                </button>
            </motion.div>
        </div>
    );
}
