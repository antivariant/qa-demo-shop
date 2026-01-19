import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { ServiceResolver } from '../resolvers/ServiceResolver';

export class SdetAuthController {
    private sdetUserService = ServiceResolver.getSdetUserService();

    async register(req: Request, res: Response) {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required', errorCode: 'invalid_parameter' });
        }

        try {
            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: typeof name === 'string' && name.trim() ? name.trim() : undefined,
            });

            const profile = await this.sdetUserService.getOrCreate(userRecord.uid, {
                email: userRecord.email || null,
                displayName: userRecord.displayName || null,
                name: typeof name === 'string' ? name : undefined,
            });

            res.status(201).json(profile);
        } catch (error: any) {
            const code = error?.code as string | undefined;
            if (code === 'auth/email-already-exists') {
                return res.status(409).json({ error: 'Email already registered', errorCode: 'email_exists' });
            }
            console.error('Error registering SDET user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
