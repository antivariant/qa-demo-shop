import * as admin from 'firebase-admin';
import { IPricelistService } from '../interfaces';
import { Money } from '../../domain/types';

export class HealthyPricelistService implements IPricelistService {
    private get db() {
        return admin.firestore();
    }
    private pricelistCollection = 'pricelist';

    async getActivePrice(productId: string): Promise<Money | null> {
        const snapshot = await this.db.collection(this.pricelistCollection)
            .where('productId', '==', productId)
            .where('isActive', '==', true)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return snapshot.docs[0].data().price as Money;
    }

    async getActivePrices(productIds?: string[]): Promise<Map<string, Money>> {
        const snapshot = await this.db.collection(this.pricelistCollection)
            .where('isActive', '==', true)
            .get();

        const allowedIds = productIds ? new Set(productIds) : null;
        const prices = new Map<string, Money>();
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (!data?.productId || !data?.price) continue;
            if (allowedIds && !allowedIds.has(data.productId)) continue;
            prices.set(data.productId, data.price as Money);
        }
        return prices;
    }
}
