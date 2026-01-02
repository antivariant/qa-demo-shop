import { IPaymentService } from '../interfaces';
import { Money } from '../../domain/types';

export class HealthyPaymentService implements IPaymentService {
    async processPayment(amount: Money, cardNumber: string): Promise<{ success: boolean; errorCode?: string }> {
        const cleanNumber = cardNumber.replace(/\s/g, '');

        if (cleanNumber === '9999999999999999') {
            return { success: true };
        } else if (cleanNumber === '1111111111111111') {
            return { success: false, errorCode: 'insufficient_funds' };
        } else if (cleanNumber === '2222222222222222') {
            return { success: false, errorCode: 'invalid_card' };
        }

        return { success: false, errorCode: 'invalid_card' };
    }
}
