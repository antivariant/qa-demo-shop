import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface AuthRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized', errorCode: 'unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token!);
        req.user = decodedToken;
        next();
    } catch (error: any) {
        console.error('Error verifying token:', error.message || error);
        return res.status(401).json({
            error: 'Invalid token',
            errorCode: 'invalid_token',
            details: error.message
        });
    }
}
