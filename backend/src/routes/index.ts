import { Router } from 'express';
import { CatalogController } from '../controllers/CatalogController';
import { CartController } from '../controllers/CartController';
import { CheckoutController } from '../controllers/CheckoutController';
import { OrderController } from '../controllers/OrderController';
import { ImageController } from '../controllers/ImageController';
import { SdetUserController } from '../controllers/SdetUserController';
import { SdetAuthController } from '../controllers/SdetAuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const catalogController = new CatalogController();
const cartController = new CartController();
const checkoutController = new CheckoutController();
const orderController = new OrderController();
const imageController = new ImageController();
const sdetUserController = new SdetUserController();
const sdetAuthController = new SdetAuthController();

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Catalog
router.get('/products', (req, res) => catalogController.getProducts(req, res));
router.get('/products/:id', (req, res) => catalogController.getProductById(req, res));
router.get('/categories', (req, res) => catalogController.getCategories(req, res));

// Cart (Auth required)
router.get('/cart', authMiddleware, (req, res) => cartController.getCart(req as any, res));
router.post('/cart/items', authMiddleware, (req, res) => cartController.addItem(req as any, res));
router.patch('/cart/items/:itemId', authMiddleware, (req, res) => cartController.updateItem(req as any, res));
router.delete('/cart/items/:itemId', authMiddleware, (req, res) => cartController.removeItem(req as any, res));
router.delete('/cart', authMiddleware, (req, res) => cartController.clearCart(req as any, res));

// Checkout & Orders (Auth required)
router.post('/checkout', authMiddleware, (req, res) => checkoutController.checkout(req as any, res));
router.get('/orders', authMiddleware, (req, res) => orderController.getOrders(req as any, res));

// Images
router.get('/images/products/:filename', (req, res) => imageController.getImage(req, res));

// SDET Auth
router.post('/sdet/auth/register', (req, res) => sdetAuthController.register(req, res));

// SDET User (Auth required)
router.get('/sdet/user', authMiddleware, (req, res) => sdetUserController.getProfile(req as any, res));
router.put('/sdet/user', authMiddleware, (req, res) => sdetUserController.upsertProfile(req as any, res));

export default router;
