import { Router } from 'express';
import { SdetUserController } from '../controllers/SdetUserController';
import { SdetAuthController } from '../controllers/SdetAuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const sdetUserController = new SdetUserController();
const sdetAuthController = new SdetAuthController();

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// SDET Auth
router.post('/sdet/auth/register', (req, res) => sdetAuthController.register(req, res));

// SDET User (Auth required)
router.get('/sdet/user', authMiddleware, (req, res) => sdetUserController.getProfile(req as any, res));
router.put('/sdet/user', authMiddleware, (req, res) => sdetUserController.upsertProfile(req as any, res));

export default router;
