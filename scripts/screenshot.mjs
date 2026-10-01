import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outDir = path.join(root, 'docs', 'screenshots');

const VIEWS = [
  { label: 'Resumen', slug: 'resumen' },
  { label: 'Cartera', slug: 'cartera' },
  { label: 'SaaS', slug: 'saas' },
  { label: 'Movimientos', slug: 'movimientos' },
  { label: 'Ajustes', slug: 'ajustes' },
];

const THEMES = [
  { dark: true, slug: 'oscuro' },
  { dark: false, slug: 'claro' },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function serveDist() {
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = path.join(dist, relative);

    if (!file.startsWith(dist)) {
      response.writeHead(403).end();
      return;
    }

    try {
      const stats = await stat(file);
      if (!stats.isFile()) throw new Error('not a file');
      response.writeHead(200, {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
      });
      createReadStream(file).pipe(response);
    } catch {
      response.writeHead(404).end('not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function isDark(page) {
  return page.evaluate(() => document.documentElement.classList.contains('dark'));
}

async function setTheme(page, wantDark) {
  if ((await isDark(page)) === wantDark) return;
  await page.getByRole('button', { name: /Modo (oscuro|claro)/ }).click();
  await page.waitForFunction(
    (dark) => document.documentElement.classList.contains('dark') === dark,
    wantDark,
  );
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const { server, port } = await serveDist();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Resumen', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);

  const written = [];

  for (const theme of THEMES) {
    await setTheme(page, theme.dark);

    for (const view of VIEWS) {
      await page.getByRole('button', { name: view.label, exact: true }).click();
      await page.waitForTimeout(1400);

      const file = path.join(outDir, `${view.slug}-${theme.slug}.png`);
      await page.screenshot({ path: file, fullPage: true });
      written.push(path.relative(root, file));
      console.log('ok', path.basename(file));
    }
  }

  await browser.close();
  server.close();

  const total = written.reduce((sum, file) => sum + statSync(path.join(root, file)).size, 0);
  console.log(`${written.length} capturas · ${(total / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
