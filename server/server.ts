import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AppServerOptions {
  staticDirectory?: string;
  /** Directory containing pki-validation/ and acme-challenge/. */
  validationDirectory?: string;
}

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function insideDirectory(directory: string, target: string): boolean {
  const path = relative(directory, target);
  return path !== '' && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

async function readPublicFile(directory: string, path: string): Promise<Buffer | undefined> {
  const root = resolve(directory);
  const target = resolve(root, path);
  if (!insideDirectory(root, target)) return undefined;

  try {
    const [actualRoot, actualTarget] = await Promise.all([realpath(root), realpath(target)]);
    if (!insideDirectory(actualRoot, actualTarget)) return undefined;
    if (!(await stat(actualTarget)).isFile()) return undefined;
    return await readFile(actualTarget);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR' || code === 'EACCES') return undefined;
    throw error;
  }
}

function respond(
  request: IncomingMessage,
  response: ServerResponse,
  status: number,
  body: Buffer | string,
  contentType = 'text/plain; charset=utf-8',
): void {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

/** Serve the built site and live certificate-validation files over HTTP. */
export function createAppServer(options: AppServerOptions = {}) {
  const staticDirectory = resolve(options.staticDirectory ?? 'dist');
  const validationDirectory = resolve(options.validationDirectory ?? 'public/.well-known');

  async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      respond(request, response, 405, 'Method not allowed\n');
      return;
    }

    let pathname: string;
    try {
      pathname = decodeURIComponent((request.url ?? '/').split(/[?#]/, 1)[0] ?? '/');
    } catch {
      respond(request, response, 400, 'Invalid URL\n');
      return;
    }

    const segments = pathname.split('/');
    if (
      !pathname.startsWith('/') ||
      /[\\\u0000-\u001f\u007f:]/.test(pathname) ||
      segments.some((part) => part === '.' || part === '..')
    ) {
      respond(request, response, 400, 'Invalid path\n');
      return;
    }

    if (pathname.startsWith('/.well-known/')) {
      const match = /^\/\.well-known\/(pki-validation|acme-challenge)\/([A-Za-z0-9_-][A-Za-z0-9._-]*)$/.exec(pathname);
      if (!match) {
        respond(request, response, 404, 'Not found\n');
        return;
      }

      const challengePath = `${match[1]}/${match[2]}`;
      const content = (await readPublicFile(validationDirectory, challengePath))
        ?? (await readPublicFile(staticDirectory, `.well-known/${challengePath}`));

      if (content === undefined) {
        respond(request, response, 404, 'Validation file not found\n');
        return;
      }

      respond(request, response, 200, content);
      return;
    }

    if (segments.some((part) => part.startsWith('.'))) {
      respond(request, response, 404, 'Not found\n');
      return;
    }

    const filePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    const content = await readPublicFile(staticDirectory, filePath);
    if (content === undefined) {
      respond(request, response, 404, 'Not found\n');
      return;
    }

    response.setHeader('Cache-Control', 'no-cache');
    respond(request, response, 200, content, contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream');
  }

  return createServer((request, response) => {
    void handleRequest(request, response).catch(() => {
      if (!response.headersSent) respond(request, response, 500, 'Internal server error\n');
      else response.destroy();
    });
  });
}

const invokedFile = process.argv[1];
if (invokedFile && resolve(invokedFile) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8080);
  const host = process.env.HOST ?? '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT must be an integer between 1 and 65535.');
    process.exitCode = 1;
  } else {
    const server = createAppServer();
    server.on('error', (error) => {
      console.error(`Unable to start HTTP server: ${error.message}`);
      process.exitCode = 1;
    });
    server.listen(port, host, () => {
      console.log(`KSCC: http://${host}:${port}`);
    });
  }
}
