import { SdetUser } from '../../domain/types';

export interface ISdetUserService {
    getOrCreate(userId: string, payload: { email: string | null; displayName: string | null; name?: string }): Promise<SdetUser>;
    update(userId: string, updates: { name?: string }): Promise<SdetUser>;
}
