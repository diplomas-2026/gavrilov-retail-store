import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '../..');
const productsPath = path.resolve(repoRoot, 'product-api/seed-data/products.json');
const outDir = path.resolve(repoRoot, 'product-web/public/images/products');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Не задана переменная окружения ${name}`);
  return value;
}

function parseArgs(argv) {
  const args = {
    count: 2,
    limit: Infinity,
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
    size: process.env.OPENAI_IMAGE_SIZE || '1024x1024',
    dryRun: false
  };

  for (const raw of argv) {
    if (raw === '--dry-run') args.dryRun = true;
    if (raw.startsWith('--count=')) args.count = Number(raw.split('=')[1]);
    if (raw.startsWith('--limit=')) args.limit = Number(raw.split('=')[1]);
    if (raw.startsWith('--model=')) args.model = raw.split('=')[1];
    if (raw.startsWith('--size=')) args.size = raw.split('=')[1];
  }
  if (![1, 2].includes(args.count)) throw new Error('--count должен быть 1 или 2');
  return args;
}

async function generateImage({ apiKey, model, prompt, size }) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      // Many accounts return base64 in `b64_json`; if your org is configured for URLs,
      // set OPENAI_IMAGE_RESPONSE_FORMAT=url and pass it below.
      response_format: process.env.OPENAI_IMAGE_RESPONSE_FORMAT || 'b64_json'
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ошибка генерации изображения (${res.status}): ${text}`);
  }

  const json = await res.json();
  const first = json?.data?.[0];
  if (first?.b64_json) {
    return { kind: 'b64', value: first.b64_json };
  }
  if (first?.url) {
    return { kind: 'url', value: first.url };
  }
  throw new Error('Неожиданный ответ Images API: нет b64_json/url');
}

function buildPrompt(product, variantIndex) {
  const base = [
    'Сгенерируй реалистичное каталожное фото товара для интернет-магазина.',
    'Стиль: современная предметная съемка, мягкий студийный свет, белый/светло-серый фон, высокое качество, без текста и водяных знаков.',
    'Кадр: товар по центру, аккуратные тени, без лишних предметов.',
    `Товар: ${product.name}.`,
    product.description ? `Описание: ${product.description}.` : null,
    variantIndex === 2 ? 'Вариант: другой ракурс/угол съемки, сохраняя стиль.' : 'Вариант: основной ракурс.'
  ].filter(Boolean);
  return base.join(' ');
}

async function downloadToBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось скачать изображение: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function main() {
  const { count, limit, model, size, dryRun } = parseArgs(process.argv.slice(2));
  const apiKey = requireEnv('OPENAI_API_KEY');

  if (!fs.existsSync(productsPath)) throw new Error(`Не найден файл: ${productsPath}`);
  fs.mkdirSync(outDir, { recursive: true });

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  if (!Array.isArray(products)) throw new Error('products.json должен быть массивом');

  let processed = 0;
  for (const product of products) {
    if (processed >= limit) break;
    const sku = String(product.sku || '').trim();
    if (!sku) continue;

    const images = [];
    for (let i = 1; i <= count; i++) {
      const filename = `${sku}-${i}.png`;
      const targetPath = path.resolve(outDir, filename);
      const prompt = buildPrompt(product, i);

      if (!dryRun) {
        const out = await generateImage({ apiKey, model, prompt, size });
        let buffer;
        if (out.kind === 'b64') {
          buffer = Buffer.from(out.value, 'base64');
        } else {
          buffer = await downloadToBuffer(out.value);
        }
        fs.writeFileSync(targetPath, buffer);
      }

      images.push(`/images/products/${filename}`);
    }

    product.images = images;
    processed += 1;
    // eslint-disable-next-line no-console
    console.log(`OK: ${sku} -> ${images.join(', ')}`);
  }

  if (!dryRun) {
    fs.writeFileSync(productsPath, `${JSON.stringify(products, null, 2)}\n`, 'utf-8');
  }

  // eslint-disable-next-line no-console
  console.log(`Готово. Обработано товаров: ${processed}.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

