"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { LogOut, Send, Settings } from 'lucide-react';
import { sdetAuth } from '@/services/firebase';
import { api } from '@/services/api';
import { SdetUser } from '@/types';
import styles from './SdetPanel.module.css';

type AuthMode = 'login' | 'register';

export default function SdetPanel() {
    const [sdetUser, setSdetUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<SdetUser | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');

    const [authOpen, setAuthOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [bugReportOpen, setBugReportOpen] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>('login');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(sdetAuth, (user) => {
            setSdetUser(user);
            if (!user) {
                setProfile(null);
                setProfileLoading(false);
                setProfileError('');
            } else {
                setProfileLoading(true);
                setProfileError('');
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let mounted = true;
        if (!sdetUser) {
            return;
        }

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
    }, [sdetUser]);

    const bugScore = useMemo(() => {
        const enabled = 5;
        const found = profile?.bugsFound ?? 0;
        const totalIssues = 30;
        const totalFound = profile?.totalFound ?? 0;
        return {
            enabledLabel: String(enabled).padStart(2, '0'),
            foundLabel: String(found).padStart(2, '0'),
            totalIssuesLabel: String(totalIssues).padStart(2, '0'),
            totalFoundLabel: String(totalFound).padStart(2, '0'),
        };
    }, [profile?.bugsFound, profile?.totalFound]);

    const isAuthed = Boolean(sdetUser);
    const userLabel = sdetUser
        ? (profile?.name?.trim() || profile?.displayName || 'User')
        : 'Anonymous';

    const handleAuthClick = async () => {
        if (sdetUser) {
            await signOut(sdetAuth);
            return;
        }
        setAuthMode('login');
        setAuthOpen(true);
    };

    const handleEnabledClick = () => {
        if (sdetUser) {
            setSettingsOpen(true);
        } else {
            setAuthMode('register');
            setAuthOpen(true);
        }
    };

    const handleUserAreaClick = () => {
        if (!sdetUser) {
            setAuthMode('register');
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
                <div className={styles.playerRow}>
                    <span className={styles.playerName}>Sensei</span>
                    <span className={styles.vsText}>vs</span>
                    <span className={styles.playerNameGroup}>
                        <span className={styles.playerName}>{userLabel}</span>
                        {isAuthed && (
                            <button
                                className={styles.logoutButton}
                                onClick={handleAuthClick}
                                type="button"
                                aria-label="Logout SDET user"
                                title="Logout"
                            >
                                <LogOut size={14} />
                            </button>
                        )}
                    </span>
                </div>

                <div className={styles.scoreboardFrame}>
                    <div className={styles.scoreboardGrid}>
                        <div className={styles.scoreColumn}>
                            <button
                                className={styles.actionButton}
                                onClick={handleEnabledClick}
                                type="button"
                                aria-label="Open settings"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                            <div className={styles.scoreValue}>{bugScore.enabledLabel}</div>
                            <div className={styles.scoreLabel}>ISSUES</div>
                        </div>
                        <div className={styles.scoreColumn} onClick={handleUserAreaClick}>
                            <button
                                className={styles.actionButton}
                                onClick={isAuthed ? () => setBugReportOpen(true) : handleUserAreaClick}
                                type="button"
                                aria-label="Send bug report"
                                title="Send bug report"
                            >
                                <Send size={18} />
                            </button>
                            <div className={styles.scoreValue}>{isAuthed ? bugScore.foundLabel : '-'}</div>
                            <div className={styles.scoreLabel}>FOUND</div>
                            {!isAuthed && (
                                <button className={styles.authOverlay} type="button" onClick={handleUserAreaClick}>
                                    REGISTER TO TRACK SCORE
                                </button>
                            )}
                        </div>
                    </div>
                    <div className={styles.totalRow}>
                        <span className={styles.totalValue}>{bugScore.totalIssuesLabel}</span>
                        <span className={styles.totalLabel}>TOTAL</span>
                        <span className={styles.totalValue}>{isAuthed ? bugScore.totalFoundLabel : '-'}</span>
                    </div>
                </div>
                {profileError && <p className={styles.errorText}>{profileError}</p>}
                {profileLoading && sdetUser && (
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
                await signInWithEmailAndPassword(sdetAuth, email, password);
                onSuccess(registered);
                return;
            } else {
                await signInWithEmailAndPassword(sdetAuth, email, password);
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
