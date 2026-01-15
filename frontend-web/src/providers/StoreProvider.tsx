'use client';

import { useRef, useEffect } from 'react'; // Added useEffect
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { setUser } from '@/store/features/auth/authSlice';
import { fetchCart, setCartItems, setMergePrompt } from '@/store/features/cart/cartSlice';
import { api } from '@/services/api';
import { CartItem } from '@/types';

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
                const anonymousItems = (store.getState().cart.items as CartItem[]).filter(
                    (item) => item.quantity > 0
                );

                if (user) {
                    store.dispatch(setUser({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL
                    }));
                    const resolveCart = async () => {
                        try {
                            const serverCart = await api.getCart();
                            const serverItems = (serverCart.items || []).filter(
                                (item: CartItem) => item.quantity > 0
                            );
                            const hasAnonymousItems = anonymousItems.length > 0;
                            const hasServerItems = serverItems.length > 0;

                            if (hasAnonymousItems && hasServerItems) {
                                store.dispatch(setMergePrompt({
                                    anonymousItems,
                                    serverItems,
                                }));
                                return;
                            }

                            if (hasAnonymousItems && !hasServerItems) {
                                await api.clearCart();
                                for (const item of anonymousItems) {
                                    await api.addToCart(item.productId, item.quantity);
                                }
                                const updatedCart = await api.getCart();
                                store.dispatch(setCartItems((updatedCart.items || []).filter(
                                    (item: CartItem) => item.quantity > 0
                                )));
                                return;
                            }

                            store.dispatch(setCartItems(serverItems));
                        } catch (error) {
                            console.error('Error resolving cart on login:', error);
                            store.dispatch(fetchCart());
                        }
                    };

                    resolveCart();
                } else {
                    store.dispatch(setUser(null));
                    store.dispatch(setCartItems([]));
                }
            });

            return () => unsubscribe();
        }
    }, []);

    return <Provider store={store}>{children}</Provider>;
}
