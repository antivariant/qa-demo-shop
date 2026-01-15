import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

export interface AuthRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        fs.appendFileSync('auth-debug.log', `\n[${new Date().toISOString()}] Incoming ${req.method} ${req.path} | Has Header: true\n`);
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (!authHeader) process.stdout.write(`[AUTH] Missing Authorization header\n`);
        return res.status(401).json({ error: 'Unauthorized', errorCode: 'unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token!);
        req.user = decodedToken;
        next();
    } catch (error: any) {
        fs.appendFileSync('auth-debug.log', `\n[${new Date().toISOString()}] AUTH ERROR: ${error.message}\nCode: ${error.code}\n`);
        return res.status(401).json({
            error: 'Invalid token',
            errorCode: 'invalid_token',
            details: error.message
        });
    }
}
