import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '../..');
const productsPath = path.resolve(repoRoot, 'product-api/seed-data/products.json');
const outDir = path.resolve(repoRoot, 'product-web/public/product-images/products');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Не задана переменная окружения ${name}`);
  return value;
}

function parseArgs(argv) {
  const args = {
    provider: 'gigachat',
    count: 2,
    limit: Infinity,
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
    size: process.env.OPENAI_IMAGE_SIZE || '1024x1024',
    dryRun: false
  };

  for (const raw of argv) {
    if (raw === '--dry-run') args.dryRun = true;
    if (raw.startsWith('--provider=')) args.provider = raw.split('=')[1];
    if (raw.startsWith('--count=')) args.count = Number(raw.split('=')[1]);
    if (raw.startsWith('--limit=')) args.limit = Number(raw.split('=')[1]);
    if (raw.startsWith('--model=')) args.model = raw.split('=')[1];
    if (raw.startsWith('--size=')) args.size = raw.split('=')[1];
  }
  if (![1, 2].includes(args.count)) throw new Error('--count должен быть 1 или 2');
  return args;
}

async function generateImageOpenAi({ apiKey, model, prompt, size }) {
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
    'Каталожное фото товара для интернет-магазина.',
    'Стиль: студийная предметная съемка, белый/светло-серый фон, мягкий свет, реалистично, без текста и водяных знаков.',
    'Товар по центру, аккуратные тени, без лишних предметов.',
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

function uuid4() {
  return crypto.randomUUID();
}

async function gigachatGetToken({ authKey, scope }) {
  const res = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: uuid4(),
      Authorization: `Basic ${authKey}`
    },
    body: new URLSearchParams({ scope }).toString()
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GigaChat: ошибка получения токена (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (!json?.access_token) throw new Error('GigaChat: неожиданный ответ токена (нет access_token)');
  return json.access_token;
}

async function gigachatGetModels({ token }) {
  const res = await fetch('https://gigachat.devices.sberbank.ru/api/v1/models', {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GigaChat: ошибка получения моделей (${res.status}): ${text}`);
  }
  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  return data.map((m) => m?.id).filter(Boolean);
}

function pickGigachatModelId({ available, preferred }) {
  const set = new Set(available);
  const candidates = [
    preferred,
    'GigaChat-2-Lite',
    'GigaChat-2-Lite-preview',
    'GigaChat-2',
    'GigaChat'
  ].filter(Boolean);

  for (const c of candidates) {
    if (set.has(c)) return c;
  }
  return preferred || available[0] || 'GigaChat';
}

function extractFileIdFromHtml(html) {
  const s = String(html || '');
  const m1 = s.match(/<img[^>]*\ssrc="([^"]+)"[^>]*>/i);
  if (m1?.[1]) return m1[1];
  const m2 = s.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i);
  if (m2?.[0]) return m2[0];
  return null;
}

async function generateImageGigachat({ token, model, prompt }) {
  const res = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Ты создаёшь простые каталожные фотографии товаров для интернет-магазина.'
        },
        { role: 'user', content: prompt }
      ],
      function_call: 'auto'
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GigaChat: ошибка генерации изображения (${res.status}): ${text}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || '';
  const fileId = extractFileIdFromHtml(content);
  if (!fileId) throw new Error('GigaChat: не удалось извлечь file_id из ответа модели');
  return fileId;
}

async function gigachatDownloadImage({ token, fileId }) {
  const url = `https://gigachat.devices.sberbank.ru/api/v1/files/${encodeURIComponent(fileId)}/content`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/jpg',
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GigaChat: ошибка скачивания изображения (${res.status}): ${text}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function main() {
  const { provider, count, limit, model, size, dryRun } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(productsPath)) throw new Error(`Не найден файл: ${productsPath}`);
  fs.mkdirSync(outDir, { recursive: true });

  const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  if (!Array.isArray(products)) throw new Error('products.json должен быть массивом');

  if (process.env.GIGACHAT_INSECURE_TLS === '1') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  let gigachat = null;
  if (provider === 'gigachat') {
    const authKey = requireEnv('GIGACHAT_AUTH_KEY');
    const scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS';
    const token = await gigachatGetToken({ authKey, scope });
    const availableModels = await gigachatGetModels({ token }).catch(() => []);
    const preferred = process.env.GIGACHAT_MODEL || 'GigaChat-2-Lite';
    const modelId = pickGigachatModelId({ available: availableModels, preferred });
    gigachat = { token, modelId };
  }

  let processed = 0;
  for (const product of products) {
    if (processed >= limit) break;
    const sku = String(product.sku || '').trim();
    if (!sku) continue;

    const images = [];
    for (let i = 1; i <= count; i++) {
      const filename = provider === 'gigachat' ? `${sku}-${i}.jpg` : `${sku}-${i}.png`;
      const targetPath = path.resolve(outDir, filename);
      const prompt = buildPrompt(product, i);

      if (!dryRun) {
        if (provider === 'gigachat') {
          const fileId = await generateImageGigachat({ token: gigachat.token, model: gigachat.modelId, prompt });
          const buffer = await gigachatDownloadImage({ token: gigachat.token, fileId });
          fs.writeFileSync(targetPath, buffer);
        } else if (provider === 'openai') {
          const apiKey = requireEnv('OPENAI_API_KEY');
          const out = await generateImageOpenAi({ apiKey, model, prompt, size });
          const buffer = out.kind === 'b64' ? Buffer.from(out.value, 'base64') : await downloadToBuffer(out.value);
          fs.writeFileSync(targetPath, buffer);
        } else {
          throw new Error(`Неизвестный provider: ${provider}. Используйте --provider=gigachat или --provider=openai`);
        }
      }

      images.push(`/product-images/products/${filename}`);
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
