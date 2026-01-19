import * as admin from 'firebase-admin';
import { IOrderService } from '../interfaces';
import { Order } from '../../domain/types';

export class HealthyOrderService implements IOrderService {
    private get db() {
        return admin.firestore();
    }
    private ordersCollection = 'orders';

    async getUserOrders(userId: string): Promise<Order[]> {
        const snapshot = await this.db.collection(this.ordersCollection)
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    }
}
