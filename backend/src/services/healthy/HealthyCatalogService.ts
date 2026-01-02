import * as admin from 'firebase-admin';
import { ICatalogService } from '../interfaces';
import { Product } from '../../domain/types';

export class HealthyCatalogService implements ICatalogService {
    private get db() {
        return admin.firestore();
    }
    private productsCollection = 'products';

    async getProducts(): Promise<Product[]> {
        const snapshot = await this.db.collection(this.productsCollection).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    }

    async getProductById(id: string): Promise<Product | null> {
        const doc = await this.db.collection(this.productsCollection).doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as any;
    }
}
