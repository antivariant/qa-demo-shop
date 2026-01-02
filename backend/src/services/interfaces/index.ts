import { Product, Cart, Order, Money, PaymentMethod } from '../../domain/types';

export interface IPricelistService {
    getActivePrice(productId: string): Promise<Money | null>;
}

export interface ICatalogService {
    getProducts(): Promise<Product[]>;
    getProductById(id: string): Promise<Product | null>;
}

export interface ICartService {
    getCart(userId: string): Promise<Cart & { id: string }>;
    addItem(userId: string, productId: string, quantity: number): Promise<Cart & { id: string }>;
    updateItemQuantity(userId: string, productId: string, quantity: number): Promise<Cart & { id: string }>;
    removeItem(userId: string, productId: string): Promise<Cart & { id: string }>;
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
