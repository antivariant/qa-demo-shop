import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServiceResolver } from '../resolvers/ServiceResolver';

export class SdetUserController {
    private sdetUserService = ServiceResolver.getSdetUserService();

    async getProfile(req: AuthRequest, res: Response) {
        try {
            const profile = await this.sdetUserService.getOrCreate(req.user!.uid, {
                email: req.user!.email || null,
                displayName: req.user!.name || null,
            });
            res.json(profile);
        } catch (error) {
            console.error('Error getting SDET user profile:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async upsertProfile(req: AuthRequest, res: Response) {
        const { name } = req.body;
        if (name !== undefined && typeof name !== 'string') {
            return res.status(400).json({ error: 'Invalid name', errorCode: 'invalid_parameter' });
        }

        try {
            const profile = await this.sdetUserService.getOrCreate(req.user!.uid, {
                email: req.user!.email || null,
                displayName: req.user!.name || null,
                name: typeof name === 'string' ? name : undefined,
            });

            if (name !== undefined) {
                const updated = await this.sdetUserService.update(req.user!.uid, { name });
                return res.json(updated);
            }

            return res.json(profile);
        } catch (error) {
            console.error('Error updating SDET user profile:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
