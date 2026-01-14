'use client';

import { useRef, useEffect } from 'react'; // Added useEffect
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { setUser } from '@/store/features/auth/authSlice';
import { fetchCart } from '@/store/features/cart/cartSlice';

export default function StoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // Only subscribe once
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;

            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    store.dispatch(setUser({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL
                    }));
                } else {
                    store.dispatch(setUser(null));
                }
                // Fetch cart whenever auth state resolves (or changes)
                // This handles both login and guest mode (fetchCart handles logic)
                store.dispatch(fetchCart());
            });

            return () => unsubscribe();
        }
    }, []);

    return <Provider store={store}>{children}</Provider>;
}
