import { ICatalogService, ICartService, IDiscountService, IPaymentService, ICheckoutService, IOrderService, IPricelistService, IImageService, ISdetUserService } from '../services/interfaces';
import { HealthyCatalogService } from '../services/healthy/HealthyCatalogService';
import { HealthyDiscountService } from '../services/healthy/HealthyDiscountService';
import { HealthyCartService } from '../services/healthy/HealthyCartService';
import { HealthyPaymentService } from '../services/healthy/HealthyPaymentService';
import { HealthyCheckoutService } from '../services/healthy/HealthyCheckoutService';
import { HealthyOrderService } from '../services/healthy/HealthyOrderService';
import { HealthyPricelistService } from '../services/healthy/HealthyPricelistService';
import { HealthyImageService } from '../services/healthy/HealthyImageService';
import { HealthySdetUserService } from '../services/healthy/HealthySdetUserService';

export class ServiceResolver {
    private static catalogService: ICatalogService;
    private static cartService: ICartService;
    private static discountService: IDiscountService;
    private static paymentService: IPaymentService;
    private static checkoutService: ICheckoutService;
    private static orderService: IOrderService;
    private static pricelistService: IPricelistService;
    private static imageService: IImageService;
    private static sdetUserService: ISdetUserService;

    static getCatalogService(): ICatalogService {
        if (!this.catalogService) {
            this.catalogService = new HealthyCatalogService(this.getPricelistService());
        }
        return this.catalogService;
    }

    static getPricelistService(): IPricelistService {
        if (!this.pricelistService) {
            this.pricelistService = new HealthyPricelistService();
        }
        return this.pricelistService;
    }

    static getDiscountService(): IDiscountService {
        if (!this.discountService) {
            this.discountService = new HealthyDiscountService();
        }
        return this.discountService;
    }

    static getCartService(): ICartService {
        if (!this.cartService) {
            this.cartService = new HealthyCartService(
                this.getCatalogService(),
                this.getDiscountService(),
                this.getPricelistService()
            );
        }
        return this.cartService;
    }

    static getPaymentService(): IPaymentService {
        if (!this.paymentService) {
            this.paymentService = new HealthyPaymentService();
        }
        return this.paymentService;
    }

    static getCheckoutService(): ICheckoutService {
        if (!this.checkoutService) {
            this.checkoutService = new HealthyCheckoutService(
                this.getCartService(),
                this.getPaymentService()
            );
        }
        return this.checkoutService;
    }

    static getOrderService(): IOrderService {
        if (!this.orderService) {
            this.orderService = new HealthyOrderService();
        }
        return this.orderService;
    }

    static getImageService(): IImageService {
        if (!this.imageService) {
            this.imageService = new HealthyImageService();
        }
        return this.imageService;
    }

    static getSdetUserService(): ISdetUserService {
        if (!this.sdetUserService) {
            this.sdetUserService = new HealthySdetUserService();
        }
        return this.sdetUserService;
    }
}
