import { initializeApp, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";

const shopProjectId = process.env.NEXT_PUBLIC_SHOP_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const sdetProjectId = process.env.NEXT_PUBLIC_SDET_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const shopEmulatorHost = process.env.NEXT_PUBLIC_SHOP_FIREBASE_AUTH_EMULATOR_HOST;
const sdetEmulatorHost = process.env.NEXT_PUBLIC_SDET_FIREBASE_AUTH_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;

const shopApiKey =
    shopEmulatorHost
        ? "fake-api-key-for-emulator"
        : process.env.NEXT_PUBLIC_SHOP_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const sdetApiKey =
    sdetEmulatorHost
        ? "fake-api-key-for-emulator"
        : process.env.NEXT_PUBLIC_SDET_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

function initFirebaseApp(name: string, projectId?: string, apiKey?: string): FirebaseApp {
    const config = {
        projectId,
        apiKey,
        authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
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

const shopApp = initFirebaseApp('shop', shopProjectId, shopApiKey);
const sdetApp = initFirebaseApp('sdet', sdetProjectId, sdetApiKey);

const shopAuth = getAuth(shopApp);
const sdetAuth = getAuth(sdetApp);

connectEmulator(shopAuth, shopEmulatorHost);
connectEmulator(sdetAuth, sdetEmulatorHost);

export { shopAuth, sdetAuth };
