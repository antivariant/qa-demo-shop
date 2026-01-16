import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: "fake-api-key-for-emulator", // Not needed for emulator but required by SDK
    authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to Auth Emulator if host is provided
if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST) {
    // Only connect if not already connected (prevents error in HMR)
    const emulatorConfig = (auth as { _emulatorConfig?: unknown })._emulatorConfig;
    if (!emulatorConfig) {
        connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`);
    }
}

export { auth };
