import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '../..');
const productsPath = path.resolve(repoRoot, 'product-api/seed-data/products.json');
const outDir = path.resolve(repoRoot, 'product-web/public/images/products');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clampText(text, max = 44) {
  const cleaned = String(text || '').trim().replace(/\s+/g, ' ');
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function hashToHsl(input) {
  const hash = crypto.createHash('sha256').update(String(input)).digest();
  const hue = hash[0] * 360 / 255;
  const sat = 55 + (hash[1] % 18); // 55-72
  const light = 52 + (hash[2] % 10); // 52-61
  return { hue, sat, light };
}

function svgForProduct({ sku, name, description, variantIndex }) {
  const a = hashToHsl(`${sku}:${variantIndex}:a`);
  const b = hashToHsl(`${sku}:${variantIndex}:b`);
  const c = hashToHsl(`${sku}:${variantIndex}:c`);

  const title = clampText(name, 34);
  const subtitle = clampText(description, 64);

  const bg1 = `hsl(${a.hue} ${a.sat}% ${Math.min(88, a.light + 30)}%)`;
  const bg2 = `hsl(${b.hue} ${b.sat}% ${Math.min(92, b.light + 28)}%)`;
  const ink = `hsl(${c.hue} ${Math.max(35, c.sat - 20)}% ${Math.max(18, c.light - 30)}%)`;
  const muted = `hsla(${c.hue} ${Math.max(25, c.sat - 25)}% ${Math.max(22, c.light - 24)}% / 0.78)`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="r" cx="25%" cy="15%" r="75%">
      <stop offset="0" stop-color="white" stop-opacity="0.7"/>
      <stop offset="1" stop-color="white" stop-opacity="0"/>
    </radialGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="rgba(0,0,0,0.18)"/>
    </filter>
  </defs>

  <rect width="1200" height="900" rx="64" fill="url(#g)"/>
  <rect width="1200" height="900" rx="64" fill="url(#r)"/>

  <g filter="url(#s)">
    <rect x="88" y="92" width="1024" height="716" rx="48" fill="rgba(255,255,255,0.65)" />
    <rect x="88" y="92" width="1024" height="716" rx="48" fill="none" stroke="rgba(255,255,255,0.7)" />
  </g>

  <g>
    <text x="140" y="230" font-family="Manrope, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="54" font-weight="800" fill="${ink}">
      ${escapeXml(title)}
    </text>
    <text x="140" y="288" font-family="IBM Plex Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="22" font-weight="600" fill="${muted}">
      ${escapeXml(subtitle)}
    </text>
    <g>
      <rect x="140" y="330" width="240" height="42" rx="21" fill="rgba(0,0,0,0.08)"/>
      <text x="162" y="359" font-family="IBM Plex Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="700" fill="${ink}">
        SKU: ${escapeXml(sku)}
      </text>
    </g>
  </g>

  <g opacity="0.85">
    <circle cx="965" cy="470" r="170" fill="rgba(255,255,255,0.55)"/>
    <circle cx="965" cy="470" r="128" fill="rgba(255,255,255,0.32)"/>
    <rect x="820" y="610" width="290" height="22" rx="11" fill="rgba(0,0,0,0.08)"/>
    <rect x="850" y="646" width="260" height="18" rx="9" fill="rgba(0,0,0,0.06)"/>
    <rect x="880" y="676" width="230" height="16" rx="8" fill="rgba(0,0,0,0.05)"/>
  </g>
</svg>
`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function main() {
  if (!fs.existsSync(productsPath)) {
    throw new Error(`Не найден файл: ${productsPath}`);
  }

  ensureDir(outDir);

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  if (!Array.isArray(products)) {
    throw new Error('products.json должен быть массивом');
  }

  for (const product of products) {
    const sku = String(product.sku || '').trim();
    if (!sku) continue;

    const v1 = `${sku}-1.svg`;
    const v2 = `${sku}-2.svg`;

    fs.writeFileSync(
      path.resolve(outDir, v1),
      svgForProduct({ sku, name: product.name, description: product.description, variantIndex: 1 }),
      'utf-8'
    );
    fs.writeFileSync(
      path.resolve(outDir, v2),
      svgForProduct({ sku, name: product.name, description: product.description, variantIndex: 2 }),
      'utf-8'
    );

    product.images = [`/images/products/${v1}`, `/images/products/${v2}`];
  }

  fs.writeFileSync(productsPath, `${JSON.stringify(products, null, 2)}\n`, 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`Готово: svg + обновлён seed: ${path.relative(repoRoot, productsPath)}`);
  // eslint-disable-next-line no-console
  console.log(`Изображения: ${path.relative(repoRoot, outDir)}`);
}

main();

