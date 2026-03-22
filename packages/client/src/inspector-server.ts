import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import type { WLLogger } from '@workslocal/shared';

import type { RequestStore } from './request-store.js';
import type { TunnelInfo } from './types.js';

interface InspectorServerOptions {
  port: number;
  inspectorDistPath: string;
  requestStore: RequestStore;
  logger: WLLogger;
}

interface InspectorServerState {
  tunnelInfo: TunnelInfo | null;
  mode: 'http' | 'catch';
  localPort: number | null;
  email: string | null;
}

export interface InspectorServer {
  start(): Promise<void>;
  stop(): void;
  setState(state: Partial<InspectorServerState>): void;
  pushRequest(request: unknown): void;
}

export function createInspectorServer(options: InspectorServerOptions): InspectorServer {
  const { port, inspectorDistPath, requestStore, logger } = options;
  const log = logger.child({ module: 'inspector' });

  let server: http.Server | null = null;
  const sseClients = new Set<http.ServerResponse>();
  let state: InspectorServerState = {
    tunnelInfo: null,
    mode: 'http',
    localPort: null,
    email: null,
  };

  function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    const urlPath = req.url?.split('?')[0] ?? '/';
    let filePath: string;

    if (urlPath === '/' || urlPath === '/index.html') {
      filePath = path.join(inspectorDistPath, 'index.html');
    } else {
      filePath = path.join(inspectorDistPath, urlPath);
    }

    // Security: prevent path traversal
    if (!filePath.startsWith(inspectorDistPath)) {
      return false;
    }

    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) return false;

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      };

      const contentType = mimeTypes[ext] ?? 'application/octet-stream';
      const content = fs.readFileSync(filePath);

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
      });
      res.end(content);
      return true;
    } catch {
      return false;
    }
  }

  function handleApi(req: http.IncomingMessage, res: http.ServerResponse): void {
    const urlPath = req.url?.split('?')[0] ?? '';

    // CORS for dev (vite proxy)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // GET /api/requests - return all captured requests
    if (urlPath === '/api/requests' && req.method === 'GET') {
      const requests = requestStore.getAll();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(requests));
      return;
    }

    // DELETE /api/requests - clear all
    if (urlPath === '/api/requests' && req.method === 'DELETE') {
      requestStore.clear();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // GET /api/tunnel - tunnel metadata
    if (urlPath === '/api/tunnel' && req.method === 'GET') {
      const tunnelInfo = state.tunnelInfo;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          mode: state.mode,
          publicUrl: tunnelInfo?.publicUrl ?? '',
          subdomain: tunnelInfo?.subdomain ?? '',
          domain: tunnelInfo?.domain ?? '',
          localPort: state.localPort,
          isPersistent: tunnelInfo?.isPersistent ?? false,
          email: state.email,
        }),
      );
      return;
    }

    // GET /api/events - SSE stream
    if (urlPath === '/api/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write('data: {"type":"connected"}\n\n');

      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    // 404 for unknown API routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  return {
    async start(): Promise<void> {
      return new Promise((resolve, reject) => {
        server = http.createServer((req, res) => {
          const urlPath = req.url?.split('?')[0] ?? '/';

          // API routes
          if (urlPath.startsWith('/api/')) {
            handleApi(req, res);
            return;
          }

          // Static files
          if (serveStatic(req, res)) {
            return;
          }

          // SPA fallback - serve index.html for all non-API, non-file routes
          const indexPath = path.join(inspectorDistPath, 'index.html');
          try {
            const content = fs.readFileSync(indexPath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
          } catch {
            res.writeHead(404);
            res.end('Inspector not built. Run: pnpm turbo build');
          }
        });

        server.listen(port, () => {
          log.info('Inspector server started', { url: `http://localhost:${String(port)}` });
          resolve();
        });

        server.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            log.warn('Inspector port in use', { port: String(port) });
            // Don't reject - inspector is optional, tunnel still works
            resolve();
          } else {
            reject(err);
          }
        });
      });
    },

    stop(): void {
      // Close all SSE connections
      for (const client of sseClients) {
        client.end();
      }
      sseClients.clear();

      server?.close();
      server = null;
    },

    setState(update: Partial<InspectorServerState>): void {
      state = { ...state, ...update };
    },

    /**
     * Push a new request to all SSE clients.
     * Called by TunnelClient on request:complete.
     */
    pushRequest(request: unknown): void {
      const data = `data: ${JSON.stringify(request)}\n\n`;
      for (const client of sseClients) {
        client.write(data);
      }
    },
  };
}
