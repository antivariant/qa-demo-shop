import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { IImageService } from '../interfaces';
import { imageConfig } from '../../config/env';

export class HealthyImageService implements IImageService {
    async getImage(filename: string, width?: number): Promise<{ buffer: Buffer; mimeType: string }> {
        // 1. Sanitize path
        const safePath = this.resolveSafePath(filename);

        if (!fs.existsSync(safePath)) {
            throw new Error('Image not found');
        }

        // 2. Read original file
        const originalBuffer = await fs.promises.readFile(safePath);

        // 3. Determine if resize is needed
        if (imageConfig.resizeEnabled && width && width > 0) {
            try {
                const resizedBuffer = await sharp(originalBuffer)
                    .resize({ width: width, withoutEnlargement: true })
                    .jpeg()
                    .toBuffer();

                return { buffer: resizedBuffer, mimeType: 'image/jpeg' };
            } catch (error) {
                console.error('Resize error:', error);
                throw new Error('Image processing failed');
            }
        }

        // 4. Return original if no resize
        return { buffer: originalBuffer, mimeType: 'image/jpeg' };
    }

    private resolveSafePath(filename: string): string {
        // If sanitization is disabled, we blindly trust (NOT RECOMMENDED for prod, but per spec)
        // However, spec says: "If IMAGE_PATH_SANITIZE=true: normalize, forbid traversal"
        // If false, we still generally should join with root, but maybe allow traversing?
        // The spec implies if sanitize=false, we might just join.
        // But for safety, let's implement the sanitize logic strictly when enabled.

        const root = path.resolve(imageConfig.root);

        if (imageConfig.pathSanitize) {
            // Normalize and prevent directory traversal
            const resolved = path.resolve(root, filename);
            if (!resolved.startsWith(root)) {
                throw new Error('Access denied');
            }
            return resolved;
        } else {
            // Less strict, but still join with root. 
            // In a real scenario 'false' might mean absolute paths allowed, 
            // but here we are serving from IMAGE_ROOT.
            return path.join(imageConfig.root, filename);
        }
    }
}
