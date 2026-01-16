import * as admin from 'firebase-admin';
import { ISdetUserService } from '../interfaces';
import { SdetUser } from '../../domain/types';

export class HealthySdetUserService implements ISdetUserService {
    private get db() {
        return admin.firestore();
    }

    private collection = 'sdet_user';

    async getOrCreate(userId: string, payload: { email: string | null; displayName: string | null; name?: string }): Promise<SdetUser> {
        const docRef = this.db.collection(this.collection).doc(userId);
        const doc = await docRef.get();
        if (doc.exists) {
            return { ...(doc.data() as SdetUser), uid: userId };
        }

        const now = new Date().toISOString();
        const profile: SdetUser = {
            uid: userId,
            email: payload.email ?? null,
            displayName: payload.displayName ?? null,
            name: payload.name?.trim() || '',
            bugsEnabled: 5,
            bugsFound: 0,
            createdAt: now,
            updatedAt: now,
        };

        await docRef.set(profile);
        return profile;
    }

    async update(userId: string, updates: { name?: string }): Promise<SdetUser> {
        const docRef = this.db.collection(this.collection).doc(userId);
        const now = new Date().toISOString();
        const payload = {
            ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
            updatedAt: now,
        };

        await docRef.set(payload, { merge: true });
        const doc = await docRef.get();
        return { ...(doc.data() as SdetUser), uid: userId };
    }
}
