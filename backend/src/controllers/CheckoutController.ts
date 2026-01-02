import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServiceResolver } from '../resolvers/ServiceResolver';

export class CheckoutController {
    private checkoutService = ServiceResolver.getCheckoutService();

    async checkout(req: AuthRequest, res: Response) {
        const { paymentMethod, cardNumber } = req.body;

        if (!paymentMethod || !['card', 'cash'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Valid paymentMethod is required', errorCode: 'invalid_parameter' });
        }

        if (paymentMethod === 'card' && !cardNumber) {
            return res.status(400).json({ error: 'Card number is required for card payment', errorCode: 'invalid_parameter' });
        }

        try {
            const result = await this.checkoutService.checkout(req.user!.uid, paymentMethod, cardNumber);
            res.status(201).json({
                orderId: result.orderId,
                newCartId: result.newCartId,
                status: result.status
            });
        } catch (error: any) {
            console.error('Checkout error:', error);
            const status = error.status || 400;
            res.status(status).json({
                error: error.message,
                errorCode: error.errorCode || 'checkout_failed'
            });
        }
    }
}
