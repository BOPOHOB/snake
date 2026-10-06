import { createApp } from './app.ts';
import { openDb, resolveDbPath } from './db.ts';
import { tryLoadAuthConfig } from './auth/config.ts';

const port = Number(Deno.env.get('PORT') ?? 8787);
const hostname = Deno.env.get('HOST') ?? '127.0.0.1';
const dbPath = resolveDbPath();
const db = openDb(dbPath);

const app = createApp(db);
const auth = tryLoadAuthConfig();

console.log(`snake-backend listening on http://${hostname}:${port}`);
console.log(`SQLite: ${dbPath}`);
if (auth) {
  console.log(`OAuth redirect: ${auth.redirectUri}`);
  console.log(`Frontend origin: ${auth.frontendOrigin}`);
  console.log(
    `Vendors: yandex=${auth.yandex ? 'on' : 'off'} google=${auth.google ? 'on' : 'off'}`,
  );
} else {
  console.log('OAuth: not configured (set YANDEX_* / GOOGLE_* env)');
}

Deno.serve({ port, hostname }, app.fetch);
