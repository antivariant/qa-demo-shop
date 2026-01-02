import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

export function initFirebase() {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-qa-shop';
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
