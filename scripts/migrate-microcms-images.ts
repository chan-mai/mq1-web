import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from 'microcms-js-sdk';

// microCMSエクスポート + 画像ダウンロード + R2投入 + image-map.json生成
// 使い方: tsx scripts/migrate-microcms-images.ts [--local|--remote|--skip-upload]

const DATA_DIR = resolve(process.cwd(), 'scripts/migration-data');
const IMAGE_DIR = resolve(DATA_DIR, 'images');
const IMAGE_MAP_PATH = resolve(DATA_DIR, 'image-map.json');
const BUCKET = 'mq1-web-prod';

const mode = process.argv[2] ?? '--skip-upload';
if (!['--local', '--remote', '--skip-upload'].includes(mode)) {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;
if (!serviceDomain || !apiKey) {
  console.error('MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY is not set');
  process.exit(1);
}

const client = createClient({ serviceDomain, apiKey });

const exportContents = async () => {
  const [articles, tags, global] = await Promise.all([
    client.getAllContents<Record<string, unknown>>({ endpoint: 'articles' }),
    client.getAllContents<Record<string, unknown>>({ endpoint: 'tags' }),
    client.get<Record<string, unknown>>({
      endpoint: 'global',
      queries: { depth: 2 },
    }),
  ]);

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    resolve(DATA_DIR, 'microcms-articles.json'),
    JSON.stringify(articles, null, 2),
  );
  writeFileSync(
    resolve(DATA_DIR, 'microcms-tags.json'),
    JSON.stringify(tags, null, 2),
  );
  writeFileSync(
    resolve(DATA_DIR, 'microcms-global.json'),
    JSON.stringify(global, null, 2),
  );
  console.log(
    `Exported: articles=${articles.length}, tags=${tags.length}, global=ok`,
  );
  return { articles };
};

const collectImageUrls = (articles: Record<string, unknown>[]) => {
  const urls = new Set<string>();
  for (const article of articles) {
    const html = String(article.content ?? '');
    for (const match of html.matchAll(/<img[^>]*src="([^"]+)"/g)) {
      urls.add(match[1]!);
    }
    const eyecatch = article.eyecatch as { url?: string } | undefined;
    if (eyecatch?.url) urls.add(eyecatch.url);
  }
  return [...urls].filter((url) =>
    url.startsWith('https://images.microcms-assets.io/'),
  );
};

const keyForUrl = (url: string) => {
  const hash = createHash('md5').update(url).digest('hex');
  const extension =
    new URL(url).pathname.split('.').pop()?.toLowerCase() ?? 'bin';
  return `${hash}.${extension}`;
};

const contentTypeForExtension = (extension: string) =>
  ({
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
  })[extension] ?? 'application/octet-stream';

const main = async () => {
  const { articles } = await exportContents();
  const urls = collectImageUrls(articles);
  console.log(`Found ${urls.length} image urls`);

  mkdirSync(IMAGE_DIR, { recursive: true });
  const imageMap: Record<string, string> = existsSync(IMAGE_MAP_PATH)
    ? JSON.parse(readFileSync(IMAGE_MAP_PATH, 'utf8'))
    : {};

  for (const url of urls) {
    const key = keyForUrl(url);
    imageMap[url] = key;
    const filePath = resolve(IMAGE_DIR, key);

    if (!existsSync(filePath)) {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Download failed (${response.status}): ${url}`);
        process.exitCode = 1;
        continue;
      }
      writeFileSync(filePath, Buffer.from(await response.arrayBuffer()));
      console.log(`Downloaded: ${key}`);
    }

    if (mode !== '--skip-upload') {
      const extension = key.split('.').pop()!;
      execFileSync(
        'pnpm',
        [
          'exec',
          'wrangler',
          'r2',
          'object',
          'put',
          `${BUCKET}/${key}`,
          '--file',
          filePath,
          '--content-type',
          contentTypeForExtension(extension),
          mode === '--local' ? '--local' : '--remote',
        ],
        { stdio: 'pipe' },
      );
      console.log(`Uploaded (${mode}): ${key}`);
    }
  }

  writeFileSync(IMAGE_MAP_PATH, JSON.stringify(imageMap, null, 2));
  console.log(
    `Wrote ${IMAGE_MAP_PATH} (${Object.keys(imageMap).length} entries)`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
