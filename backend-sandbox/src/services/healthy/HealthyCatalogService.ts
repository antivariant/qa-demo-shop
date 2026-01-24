import * as admin from 'firebase-admin';
import { ICatalogService, IPricelistService } from '../interfaces';
import { Product, Category } from '../../domain/types';
import { resolveImageUrl } from '../../config/env';

export class HealthyCatalogService implements ICatalogService {
    constructor(private pricelistService: IPricelistService) { }

    private get db() {
        return admin.firestore();
    }
    private productsCollection = 'products';
    private categoriesCollection = 'categories';

    async getProducts(categoryId?: string): Promise<Product[]> {
        let query: admin.firestore.Query = this.db.collection(this.productsCollection);

        if (categoryId) {
            query = query.where('categoryId', '==', categoryId);
        }

        const snapshot = await query.get();
        const activePrices = await this.pricelistService.getActivePrices(
            snapshot.docs.map((doc) => doc.id),
        );
        const products: Product[] = [];

        for (const doc of snapshot.docs) {
            const productData = doc.data();
            const price = activePrices.get(doc.id) || null;

            if (price !== null) {
                products.push({
                    id: doc.id,
                    name: productData.name,
                    description: productData.description,
                    imageUrl: resolveImageUrl(productData.imageUrl),
                    categoryId: productData.categoryId,
                    featured: Boolean(productData.featured),
                    price: price,
                    currency: 'USD' // Default for demo
                } as Product);
            }
        }

        return products;
    }

    async getProductById(id: string): Promise<Product | null> {
        const doc = await this.db.collection(this.productsCollection).doc(id).get();
        if (!doc.exists) return null;

        const productData = doc.data()!;
        const price = await this.pricelistService.getActivePrice(id);

        if (price === null) return null; // Fail fast if no price

        return {
            id: doc.id,
            name: productData.name,
            description: productData.description,
            imageUrl: resolveImageUrl(productData.imageUrl),
            categoryId: productData.categoryId,
            featured: Boolean(productData.featured),
            price: price,
            currency: 'USD'
        } as Product;
    }

    async getCategories(): Promise<Category[]> {
        const snapshot = await this.db.collection(this.categoriesCollection).get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        } as Category));
    }
}
