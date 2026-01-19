import { ISdetUserService } from '../services/interfaces';
import { HealthySdetUserService } from '../services/healthy/HealthySdetUserService';

export class ServiceResolver {
    private static sdetUserService: ISdetUserService;

    static getSdetUserService(): ISdetUserService {
        if (!this.sdetUserService) {
            this.sdetUserService = new HealthySdetUserService();
        }
        return this.sdetUserService;
    }
}
