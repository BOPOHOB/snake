import { join, resolve, normalize } from 'jsr:@std/path';

// MIME-таблица для раздачи статики из clientDir.
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json; charset=utf-8',
};

function mimeFor(path: string): string {
  const i = path.lastIndexOf('.');
  return i >= 0 ? MIME[path.slice(i).toLowerCase()] ?? 'application/octet-stream' : 'application/octet-stream';
}

/**
 * Раздаёт файлы из root как статику с корректным Content-Length и поддержкой HEAD.
 * Возвращает null, если путь — не существующий обычный файл (тогда вызывающий зовёт next).
 * Защита от path traversal: нормализованный путь должен оставаться внутри root.
 */
export async function serveStaticFile(
  root: string,
  urlPath: string,
  method: string,
): Promise<Response | null> {
  if (urlPath.includes('\0')) return null;
  // Декодируем %xx, отрезаем query.
  let rel = decodeURIComponent(urlPath);
  if (rel.startsWith('/')) rel = rel.slice(1);
  const abs = normalize(join(root, rel));
  // path traversal guard
  const rootNorm = normalize(root);
  if (abs !== rootNorm && !abs.startsWith(rootNorm + '/')) return null;

  let info: Deno.FileInfo;
  try {
    info = await Deno.stat(abs);
  } catch {
    return null;
  }
  if (!info.isFile) return null;

  const isHashedAsset = rel.startsWith('assets/');
  const cacheControl = isHashedAsset
    ? 'public, max-age=31536000, immutable'
    : rel === '' || rel === 'index.html'
      ? 'no-cache'
      : 'public, max-age=3600';

  const headers = new Headers({
    'Content-Type': mimeFor(abs),
    'Content-Length': String(info.size),
    'Cache-Control': cacheControl,
    'Accept-Ranges': 'bytes',
    Vary: 'Accept-Encoding',
  });

  if (method === 'HEAD') {
    return new Response(null, { headers });
  }
  const file = await Deno.open(abs, { read: true });
  return new Response(file.readable, { headers });
}
