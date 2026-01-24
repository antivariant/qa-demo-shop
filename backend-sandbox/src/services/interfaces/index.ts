import { Product, Cart, Order, Money, PaymentMethod, Category } from '../../domain/types';

export interface IPricelistService {
    getActivePrice(productId: string): Promise<Money | null>;
    getActivePrices(productIds?: string[]): Promise<Map<string, Money>>;
}

export interface ICatalogService {
    getProducts(categoryId?: string): Promise<Product[]>;
    getProductById(id: string): Promise<Product | null>;
    getCategories(): Promise<Category[]>;
}

export interface ICartService {
    getCart(userId: string): Promise<Cart & { id: string }>;
    // Updates quantity if item exists, adds if not, removes if quantity <= 0
    addItem(userId: string, productId: string, quantity: number): Promise<Cart & { id: string }>;
    updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<Cart & { id: string }>;
    removeItem(userId: string, itemId: string): Promise<Cart & { id: string }>;
    clearCart(userId: string): Promise<void>;
    createCart(userId: string): Promise<string>; // Returns new cart ID
}

export interface IDiscountService {
    calculateDiscount(subtotal: Money): Promise<Money>;
}

export interface IPaymentService {
    processPayment(amount: Money, cardNumber: string): Promise<{ success: boolean; errorCode?: string }>;
}

export interface ICheckoutService {
    checkout(userId: string, paymentMethod: PaymentMethod, cardNumber?: string): Promise<{ orderId: string; newCartId: string; status: string }>;
}

export interface IOrderService {
    getUserOrders(userId: string): Promise<Order[]>;
}

export interface IImageService {
    getImage(filename: string, width?: number): Promise<{ buffer: Buffer; mimeType: string }>;
}
