import { Request, Response } from 'express';
import { ServiceResolver } from '../resolvers/ServiceResolver';
import { imageConfig } from '../config/env';

export class ImageController {
    private imageService = ServiceResolver.getImageService();

    async getImage(req: Request, res: Response) {
        const { filename } = req.params;
        const width = req.query.width ? parseInt(req.query.width as string, 10) : undefined;

        if (width !== undefined && (isNaN(width) || width <= 0)) {
            return res.status(400).json({ error: 'Invalid width parameter' });
        }

        try {
            const result = await this.imageService.getImage(filename!, width);

            // Cache Control
            if (imageConfig.cacheTtl > 0) {
                res.setHeader('Cache-Control', `public, max-age=${imageConfig.cacheTtl}`);
            } else {
                res.setHeader('Cache-Control', 'no-store');
            }

            res.setHeader('Content-Type', result.mimeType);
            res.send(result.buffer);
        } catch (error: any) {
            if (error.message === 'Image not found') {
                res.status(404).json({ error: 'Image not found' });
            } else if (error.message === 'Access denied') {
                res.status(403).json({ error: 'Access denied' });
            } else {
                console.error('Image processing error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
}
