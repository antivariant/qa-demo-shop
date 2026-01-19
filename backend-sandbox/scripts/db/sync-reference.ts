import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
const envFile = process.env.ENV_FILE || '.env';
if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config();
}

const sourceId = process.env.SOURCE_PROJECT_ID;
const targetId = process.env.TARGET_PROJECT_ID;
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

if (!sourceId || !targetId) {
    console.error('Error: SOURCE_PROJECT_ID and TARGET_PROJECT_ID must be set.');
    process.exit(1);
}

// Initialize Source App (Production)
const sourceApp = admin.initializeApp({ projectId: sourceId }, 'source');
const sourceDb = sourceApp.firestore();

// Initialize Target App (Test or Dev/Emulator)
// If emulator is set, we assume targeting dev/emulator
if (emulatorHost) {
    process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
    console.log(`Targeting Firestore Emulator at ${emulatorHost}`);
}

const targetApp = admin.initializeApp({ projectId: targetId }, 'target');
const targetDb = targetApp.firestore();

const REF_COLLECTIONS = ['categories', 'products', 'pricelist'];

async function syncCollection(name: string) {
    console.log(`Syncing collection: ${name} (Additive only)...`);

    const snapshot = await sourceDb.collection(name).get();
    console.log(`Found ${snapshot.size} documents in source.`);

    let addedCount = 0;
    let skippedCount = 0;

    const batch = targetDb.batch();

    for (const doc of snapshot.docs) {
        const targetRef = targetDb.collection(name).doc(doc.id);
        const targetDoc = await targetRef.get();

        if (!targetDoc.exists) {
            batch.set(targetRef, doc.data());
            addedCount++;
        } else {
            skippedCount++;
        }
    }

    if (addedCount > 0) {
        await batch.commit();
    }

    console.log(`Done. Added: ${addedCount}, Skipped: ${skippedCount}.`);
}

async function run() {
    try {
        console.log(`Starting SYNC: ${sourceId} -> ${targetId}\n`);

        for (const coll of REF_COLLECTIONS) {
            await syncCollection(coll);
        }

        console.log('\n--- Synchronization completed successfully ---');
    } catch (error) {
        console.error('Synchronization failed:', error);
        process.exit(1);
    } finally {
        await sourceApp.delete();
        await targetApp.delete();
    }
}

run();
