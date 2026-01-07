import { Request, Response } from 'express';
import { ServiceResolver } from '../resolvers/ServiceResolver';

export class CatalogController {
    private catalogService = ServiceResolver.getCatalogService();

    async getProducts(req: Request, res: Response) {
        try {
            const categoryId = req.query.category as string | undefined;
            const products = await this.catalogService.getProducts(categoryId);
            res.json(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getProductById(req: Request, res: Response) {
        try {
            const product = await this.catalogService.getProductById(req.params.id!);
            if (!product) {
                return res.status(404).json({ error: 'Product not found', errorCode: 'product_not_found' });
            }
            res.json(product);
        } catch (error) {
            console.error(`Error fetching product ${req.params.id}:`, error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getCategories(req: Request, res: Response) {
        try {
            const categories = await this.catalogService.getCategories();
            res.json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
