import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vercelQuizDataHandler from './api/quiz-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  app.use(express.json());

  // Health & Deployment Verification API Endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      application: 'Khmer Kids Quiz — រៀនអក្សរខ្មែរថ្នាក់ទី១',
      platform: 'Google Cloud Run & Vercel Ready',
      environment: isProd ? 'production' : 'development',
      spaRoutingFallback: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Vercel Postgres / Neon Database Status & Sync Endpoints
  app.all('/api/quiz-data', async (req, res) => {
    await vercelQuizDataHandler(req, res);
  });

  app.get('/api/db-status', async (req, res) => {
    await vercelQuizDataHandler(req, res);
  });

  const distPath = path.resolve(__dirname, 'dist');
  const distIndexHtml = path.join(distPath, 'index.html');

  if (!isProd) {
    // Development mode: mount Vite middleware with HMR disabled (prevents @vite/client WebSocket errors in proxy/iframe)
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distIndexHtml)) {
    // Production mode: serve built static assets from dist/ with SPA fallback
    app.use(
      express.static(distPath, {
        maxAge: '1d',
        index: false,
      })
    );

    // SPA Catch-All Route so refreshing /student, /leaderboard, /admin never 404s
    app.get('*', (_req, res) => {
      res.sendFile(distIndexHtml);
    });
  } else {
    // Fallback if started via `node server.ts` without NODE_ENV=production
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
