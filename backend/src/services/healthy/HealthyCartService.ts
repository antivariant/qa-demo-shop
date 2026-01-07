import * as admin from 'firebase-admin';
import { ICartService, IDiscountService, ICatalogService, IPricelistService } from '../interfaces';
import { Cart, CartItem, CartStatus, Money, UserState } from '../../domain/types';

export class HealthyCartService implements ICartService {
    private get db() {
        return admin.firestore();
    }
    private cartsCollection = 'carts';
    private userStateCollection = 'user_state';

    constructor(
        private catalogService: ICatalogService,
        private discountService: IDiscountService,
        private pricelistService: IPricelistService
    ) { }

    private async resolveCurrentCartId(userId: string): Promise<string> {
        const userStateDoc = await this.db.collection(this.userStateCollection).doc(userId).get();

        if (userStateDoc.exists) {
            const state = userStateDoc.data() as UserState;
            if (state.currentCartId) {
                return state.currentCartId;
            }
        }

        // Lazy provisioning
        return this.createCart(userId);
    }

    async createCart(userId: string): Promise<string> {
        const newCart: Cart = {
            userId,
            items: [],
            subtotal: 0,
            discount: 0,
            total: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const cartRef = await this.db.collection(this.cartsCollection).add(newCart);

        const userState: UserState = {
            currentCartId: cartRef.id,
            updatedAt: new Date().toISOString()
        };

        await this.db.collection(this.userStateCollection).doc(userId).set(userState, { merge: true });

        return cartRef.id;
    }

    async getCart(userId: string): Promise<Cart & { id: string }> {
        const cartId = await this.resolveCurrentCartId(userId);
        const doc = await this.db.collection(this.cartsCollection).doc(cartId).get();

        // Safety check: if cart document disappeared but pointer exists
        if (!doc.exists) {
            const newId = await this.createCart(userId);
            return this.getCartById(newId);
        }

        return { id: doc.id, ...doc.data() } as Cart & { id: string };
    }

    private async getCartById(cartId: string): Promise<Cart & { id: string }> {
        const doc = await this.db.collection(this.cartsCollection).doc(cartId).get();
        return { id: doc.id, ...doc.data() } as Cart & { id: string };
    }

    async addItem(userId: string, productId: string, quantity: number): Promise<Cart & { id: string }> {
        const cartWithId = await this.getCart(userId);
        const cart = { ...cartWithId };
        delete (cart as any).id;

        const existingItem = cart.items.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.itemTotal = existingItem.quantity * existingItem.price;
        } else if (quantity > 0) {
            const product = await this.catalogService.getProductById(productId);
            if (!product) throw new Error('Product not found');

            const price = await this.pricelistService.getActivePrice(productId);
            if (price === null) throw new Error('Price not found for product');

            const newItem: CartItem = {
                productId: productId,
                name: product.name,
                price: price,
                quantity: quantity,
                itemTotal: price * quantity
            };
            cart.items.push(newItem);
        }

        // Behavior: If quantity = 0 -> remove item
        cart.items = cart.items.filter(item => item.quantity > 0);

        return this.recalculateAndSave(cartWithId.id, cart);
    }

    async updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<Cart & { id: string }> {
        const cartWithId = await this.getCart(userId);
        const cart = { ...cartWithId };
        delete (cart as any).id;

        // Note: itemId maps to productId in this implementation
        const item = cart.items.find(item => item.productId === itemId);

        if (item) {
            if (quantity <= 0) {
                cart.items = cart.items.filter(i => i.productId !== itemId);
            } else {
                item.quantity = quantity;
                item.itemTotal = item.quantity * item.price;
            }
        }

        return this.recalculateAndSave(cartWithId.id, cart);
    }

    async removeItem(userId: string, itemId: string): Promise<Cart & { id: string }> {
        const cartWithId = await this.getCart(userId);
        const cart = { ...cartWithId };
        delete (cart as any).id;

        // Note: itemId maps to productId in this implementation
        cart.items = cart.items.filter(item => item.productId !== itemId);
        return this.recalculateAndSave(cartWithId.id, cart);
    }

    async clearCart(userId: string): Promise<void> {
        const cartWithId = await this.getCart(userId);
        const cart = { ...cartWithId };
        delete (cart as any).id;

        cart.items = [];
        await this.recalculateAndSave(cartWithId.id, cart);
    }

    private async recalculateAndSave(cartId: string, cart: Cart): Promise<Cart & { id: string }> {
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.itemTotal, 0);
        cart.discount = await this.discountService.calculateDiscount(cart.subtotal);
        cart.total = cart.subtotal - cart.discount;
        cart.updatedAt = new Date().toISOString();

        await this.db.collection(this.cartsCollection).doc(cartId).set(cart);
        return { id: cartId, ...cart };
    }
}
