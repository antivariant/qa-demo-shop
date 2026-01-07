import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServiceResolver } from '../resolvers/ServiceResolver';

export class CartController {
    private cartService = ServiceResolver.getCartService();

    async getCart(req: AuthRequest, res: Response) {
        try {
            const cart = await this.cartService.getCart(req.user!.uid);
            res.json(cart);
        } catch (error) {
            console.error('Error getting cart:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async addItem(req: AuthRequest, res: Response) {
        const { productId, quantity } = req.body;
        if (!productId || typeof quantity !== 'number') {
            return res.status(400).json({ error: 'Invalid product or quantity', errorCode: 'invalid_parameter' });
        }

        try {
            const cart = await this.cartService.addItem(req.user!.uid, productId, quantity);
            res.json(cart);
        } catch (error: any) {
            console.error('Error adding item to cart:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async updateItem(req: AuthRequest, res: Response) {
        const { itemId } = req.params;
        const { quantity } = req.body;
        if (typeof quantity !== 'number') {
            return res.status(400).json({ error: 'Invalid quantity', errorCode: 'invalid_parameter' });
        }

        try {
            const cart = await this.cartService.updateItemQuantity(req.user!.uid, itemId!, quantity);
            res.json(cart);
        } catch (error: any) {
            console.error('Error updating cart item:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async removeItem(req: AuthRequest, res: Response) {
        try {
            const cart = await this.cartService.removeItem(req.user!.uid, req.params.itemId!);
            res.json(cart);
        } catch (error: any) {
            console.error('Error removing cart item:', error);
            res.status(400).json({ error: error.message });
        }
    }

    async clearCart(req: AuthRequest, res: Response) {
        try {
            await this.cartService.clearCart(req.user!.uid);
            res.status(204).send();
        } catch (error: any) {
            console.error('Error clearing cart:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
