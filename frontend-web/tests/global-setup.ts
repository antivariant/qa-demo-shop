import { execSync } from 'node:child_process';
import path from 'node:path';

export default async function globalSetup() {
    const rootDir = path.resolve(__dirname, '../..');
    execSync(`"${path.join(rootDir, 'dev-stop.sh')}"`, { stdio: 'inherit', shell: '/bin/bash' });
    const env = {
        ...process.env,
        DEV_START_MODE: process.env.DEV_START_MODE ?? (process.env.CI ? 'ci' : 'foreground'),
    };
    execSync(`"${path.join(rootDir, 'dev-start.sh')}"`, { stdio: 'inherit', shell: '/bin/bash', env });
}
