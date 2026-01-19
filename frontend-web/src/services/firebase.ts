import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";

const shopProjectId = process.env.NEXT_PUBLIC_SHOP_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const sdetProjectId = process.env.NEXT_PUBLIC_SDET_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

function initFirebaseApp(name: string, projectId?: string): FirebaseApp {
    const config = {
        projectId,
        apiKey: "fake-api-key-for-emulator", // Not needed for emulator but required by SDK
        authDomain: `${projectId}.firebaseapp.com`,
    };

    try {
        return getApp(name);
    } catch {
        return initializeApp(config, name);
    }
}

function connectEmulator(auth: Auth, host?: string) {
    if (!host) return;
    // Only connect if not already connected (prevents error in HMR)
    const emulatorConfig = (auth as { _emulatorConfig?: unknown })._emulatorConfig;
    if (!emulatorConfig) {
        connectAuthEmulator(auth, `http://${host}`);
    }
}

const shopApp = initFirebaseApp('shop', shopProjectId);
const sdetApp = initFirebaseApp('sdet', sdetProjectId);

const shopAuth = getAuth(shopApp);
const sdetAuth = getAuth(sdetApp);

connectEmulator(shopAuth, process.env.NEXT_PUBLIC_SHOP_FIREBASE_AUTH_EMULATOR_HOST);
connectEmulator(sdetAuth, process.env.NEXT_PUBLIC_SDET_FIREBASE_AUTH_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST);

export { shopAuth, sdetAuth };
