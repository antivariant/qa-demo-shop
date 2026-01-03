import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables. Supports ENV_FILE=xxx.env
const envFile = process.env.ENV_FILE || '.env';
if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else if (fs.existsSync('.env.dev')) {
    dotenv.config({ path: '.env.dev' });
} else {
    dotenv.config();
}

export function initFirebase() {
    const projectId = process.env.FIREBASE_PROJECT_ID || (process.env.FIRESTORE_EMULATOR_HOST ? 'demo-qa-shop' : undefined);
    const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;

    console.log('--- Firebase Initialization ---');
    console.log('Project ID:', projectId);
    console.log('Firestore Emulator Host:', firestoreHost || 'NOT SET');
    console.log('Auth Emulator Host:', authHost || 'NOT SET');
    console.log('-------------------------------');

    if (admin.apps.length === 0) {
        // Explicitly set GCLOUD_PROJECT for the Firestore SDK
        process.env.GCLOUD_PROJECT = projectId;

        admin.initializeApp({
            projectId: projectId
        });
    }
}
