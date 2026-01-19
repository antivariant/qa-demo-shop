import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServiceResolver } from '../resolvers/ServiceResolver';

export class OrderController {
    private orderService = ServiceResolver.getOrderService();

    async getOrders(req: AuthRequest, res: Response) {
        try {
            const orders = await this.orderService.getUserOrders(req.user!.uid);
            res.json(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
