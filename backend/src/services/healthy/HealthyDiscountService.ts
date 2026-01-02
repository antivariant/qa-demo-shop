import { IDiscountService } from '../interfaces';
import { Money } from '../../domain/types';

export class HealthyDiscountService implements IDiscountService {
    async calculateDiscount(subtotal: Money): Promise<Money> {
        // 10% discount if subtotal >= 100 USD (10000 cents)
        if (subtotal >= 10000) {
            return Math.floor(subtotal * 0.1);
        }
        return 0;
    }
}
