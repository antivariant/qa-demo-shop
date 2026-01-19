import * as admin from 'firebase-admin';
import { ICheckoutService, ICartService, IPaymentService } from '../interfaces';
import { Order, OrderStatus, PaymentMethod } from '../../domain/types';

export class HealthyCheckoutService implements ICheckoutService {
    private get db() {
        return admin.firestore();
    }
    private ordersCollection = 'orders';
    private cartsCollection = 'carts';

    constructor(
        private cartService: ICartService,
        private paymentService: IPaymentService
    ) { }

    async checkout(userId: string, paymentMethod: PaymentMethod, cardNumber?: string): Promise<{ orderId: string; newCartId: string; status: string }> {
        const cartWithId = await this.cartService.getCart(userId);
        if (cartWithId.items.length === 0) {
            throw new Error('Cart is empty');
        }

        let isPaid = false;
        let cardLast4: string | undefined = undefined;

        if (paymentMethod === 'card') {
            if (!cardNumber) throw new Error('Card number is required for card payment');

            const paymentResult = await this.paymentService.processPayment(cartWithId.total, cardNumber);

            if (!paymentResult.success) {
                const error = new Error(paymentResult.errorCode || 'Payment failed');
                (error as any).status = 402;
                (error as any).errorCode = paymentResult.errorCode;
                throw error;
            }
            isPaid = true;
            cardLast4 = cardNumber.replace(/\s/g, '').slice(-4);
        } else {
            // Cash payment - always success, not paid yet
            isPaid = false;
        }

        // Create Order
        const order: Omit<Order, 'id'> = {
            userId: userId,
            cartId: cartWithId.id,
            items: cartWithId.items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal: cartWithId.subtotal,
            discount: cartWithId.discount,
            total: cartWithId.total,
            paymentMethod: paymentMethod,
            isPaid: isPaid,
            cardLast4: cardLast4,
            status: 'success' as OrderStatus,
            createdAt: new Date().toISOString()
        };

        const orderRef = await this.db.collection(this.ordersCollection).add(order);

        // Update Cart: mark as checked_out and link to order
        await this.db.collection(this.cartsCollection).doc(cartWithId.id).update({
            status: 'checked_out',
            linkedOrderId: orderRef.id,
            updatedAt: new Date().toISOString()
        });

        // Provision a NEW empty cart
        const newCartId = await this.cartService.createCart(userId);

        return {
            orderId: orderRef.id,
            newCartId: newCartId,
            status: 'success'
        };
    }
}
