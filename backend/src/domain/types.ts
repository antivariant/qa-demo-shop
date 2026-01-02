export type Money = number; // in cents

export interface Product {
    name: string;
    description: string;
    imageUrl: string;
    categoryId: string;
}

export interface PriceItem {
    productId: string;
    price: Money;
    currency: 'USD';
    isActive: boolean;
}

export interface CartItem {
    productId: string;
    name: string;
    quantity: number;
    price: Money;
    itemTotal: Money;
}

export type CartStatus = 'active' | 'checked_out';

export interface Cart {
    userId: string;
    items: CartItem[];
    subtotal: Money;
    discount: Money;
    total: Money;
    status: CartStatus;
    createdAt: string;
    updatedAt: string;
    linkedOrderId?: string;
}

export interface OrderItem {
    productId: string;
    name: string;
    price: Money;
    quantity: number;
}

export type OrderStatus = 'success' | 'failed';
export type PaymentMethod = 'card' | 'cash';

export interface Order {
    id: string;
    userId: string;
    cartId: string;
    items: OrderItem[];
    subtotal: Money;
    discount: Money;
    total: Money;
    paymentMethod: PaymentMethod;
    isPaid: boolean;
    cardLast4?: string;
    status: OrderStatus;
    createdAt: string;
}

export interface UserState {
    currentCartId: string;
    updatedAt: string;
}
