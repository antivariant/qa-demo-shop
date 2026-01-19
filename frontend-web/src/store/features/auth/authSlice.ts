import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

// Serializable user object
interface UserInfo {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

interface AuthState {
    user: UserInfo | null;
    loading: boolean;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    loading: true,
    isAuthenticated: false,
};

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { dispatch }) => {
        const { signOut } = await import('firebase/auth');
        const { shopAuth } = await import('@/services/firebase');
        await signOut(shopAuth);
        dispatch(authSlice.actions.logout()); // Call reducer to clear state
    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }) => {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const { shopAuth } = await import('@/services/firebase');
        await signInWithEmailAndPassword(shopAuth, email, password);
        // State update handled by listener in StoreProvider
    }
);

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserInfo | null>) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.loading = false;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
        },
    },
});

export const { setUser, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
