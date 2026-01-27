import cors from 'cors';
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { initFirebase } from './config/firebase';
import routes from './routes';

initFirebase();

const app = express();
const port = process.env.PORT || 3100;
const sslEnabled = (process.env.SSL_ENABLED || '').toLowerCase() === 'true';

app.use(cors());
app.use(express.json());

app.use('/api', routes);

function startServer() {
    if (!sslEnabled) {
        const server = http.createServer(app);
        server.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
        return;
    }

    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;
    if (!certPath || !keyPath) {
        throw new Error('SSL is enabled but SSL_CERT_PATH or SSL_KEY_PATH is missing.');
    }

    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    const server = https.createServer({ cert, key }, app);
    server.listen(port, () => {
        console.log(`Server is running on https://localhost:${port}`);
    });
}

startServer();
