import { loadOgAssets, type AssetFetcher, type OgAssets } from "./og-assets";
import { renderOgImage } from "./og-renderer";

type OgEvent = {
  readonly context: object;
};

const LOCAL_ASSET_DIRECTORIES = ["public", ".output/public"];

let ogAssets: Promise<OgAssets> | undefined;

const inputPathname = (input: Request | URL | string): string => {
  if (input instanceof Request) return new URL(input.url).pathname;
  if (input instanceof URL) return input.pathname;
  return new URL(input).pathname;
};

const localAssetFetcher: AssetFetcher = {
  fetch: async (input) => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const path = inputPathname(input).replace(/^\//, "");

    for (const directory of LOCAL_ASSET_DIRECTORIES) {
      const bytes = await readFile(join(process.cwd(), directory, path)).catch(
        () => undefined,
      );
      if (bytes) return new Response(new Uint8Array(bytes));
    }

    return new Response(null, { status: 404 });
  },
};

const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

const isAssetFetcher = (value: unknown): value is AssetFetcher =>
  isObject(value) && typeof Reflect.get(value, "fetch") === "function";

const getAssetFetcher = (event: OgEvent): AssetFetcher => {
  const cloudflare = Reflect.get(event.context, "cloudflare");
  if (!isObject(cloudflare)) return localAssetFetcher;

  const env = Reflect.get(cloudflare, "env");
  if (!isObject(env)) return localAssetFetcher;

  const assets = Reflect.get(env, "ASSETS");
  return isAssetFetcher(assets) ? assets : localAssetFetcher;
};

const getOgAssets = (fetcher: AssetFetcher): Promise<OgAssets> => {
  if (!ogAssets) {
    ogAssets = loadOgAssets(fetcher).catch((error: unknown) => {
      ogAssets = undefined;
      throw error;
    });
  }
  return ogAssets;
};

export const renderOgImageResponse = async (
  event: OgEvent,
  title: string,
): Promise<Response> => {
  const assets = await getOgAssets(getAssetFetcher(event));
  return renderOgImage(title, assets);
};
