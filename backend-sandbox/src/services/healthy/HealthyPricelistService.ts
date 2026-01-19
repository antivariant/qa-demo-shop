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
}
