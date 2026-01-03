import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
const envFile = process.env.ENV_FILE || '.env';
if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config();
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

if (!projectId) {
    console.error('Error: FIREBASE_PROJECT_ID is not set.');
    process.exit(1);
}

if (emulatorHost) {
    process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
    console.log(`Targeting Firestore Emulator at ${emulatorHost}`);
}

admin.initializeApp({ projectId });
const db = admin.firestore();

const REF_COLLECTIONS = ['categories', 'products', 'pricelist'];

async function clearCollection(name: string) {
    console.log(`Clearing collection: ${name}...`);
    const snapshot = await db.collection(name).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}

async function loadCollection(name: string, filePath: string) {
    console.log(`Loading collection: ${name} (Destructive overwrite)...`);
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const batch = db.batch();

    for (const [id, data] of Object.entries(rawData)) {
        const docRef = db.collection(name).doc(id);
        batch.set(docRef, data as admin.firestore.DocumentData, { merge: false });
    }

    await batch.commit();
}

async function run() {
    try {
        console.log(`!!! STARTING DESTRUCTIVE BASE SEED on project: ${projectId} !!!\n`);

        for (const coll of REF_COLLECTIONS) {
            await clearCollection(coll);
            await loadCollection(coll, `data/${coll}.json`);
        }

        console.log('\n--- Base seeding completed successfully ---');
    } catch (error) {
        console.error('Base seeding failed:', error);
        process.exit(1);
    }
}

run();
