import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function devApiMiddleware() {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/submit', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};

          const { handleSubmit } = await import('./lib/airtable.js');
          const result = await handleSubmit(body);

          res.statusCode = result.success ? 200 : 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({ success: false, error: 'dev_middleware_error', detail: err.message }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load every var in .env (including server-side ones without VITE_ prefix)
  // into process.env so the dev middleware can read AIRTABLE_TOKEN etc.
  // On Vercel these come from the project settings directly.
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }

  return {
    plugins: [react(), devApiMiddleware()],
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
