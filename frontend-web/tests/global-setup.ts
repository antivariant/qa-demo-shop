import { execSync } from 'node:child_process';
import path from 'node:path';

export default async function globalSetup() {
    const rootDir = path.resolve(__dirname, '../..');
    const env = {
        ...process.env,
        DEV_START_MODE: process.env.DEV_START_MODE ?? 'ci',
    };
    execSync(`"${path.join(rootDir, 'dev-seed.sh')}"`, { stdio: 'inherit', shell: '/bin/bash', env });
}
