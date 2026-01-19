import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load env file if specified, otherwise default
const envFile = process.env.ENV_FILE || '.env';
if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config();
}

export const imageConfig = {
    root: process.env.IMAGE_ROOT || './img',
    resizeEnabled: process.env.IMAGE_RESIZE_ENABLED === 'true',
    pathSanitize: process.env.IMAGE_PATH_SANITIZE !== 'false', // Default true if not explicitly false
    cacheTtl: parseInt(process.env.IMAGE_CACHE_TTL || '0', 10),
};
