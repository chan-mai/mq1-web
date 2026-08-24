export type AssetFetcher = {
  readonly fetch: (input: Request | URL | string) => Promise<Response>;
};

export type OgAssets = {
  readonly background: Uint8Array;
  readonly font: Uint8Array;
};

const BACKGROUND_PATH = '/images/ogp/mq1-web-ogp.png';
const FONT_PATH = '/fonts/noto-sans-jp/NotoSansJP-Variable.ttf';

export class OgAssetLoadError extends Error {
  constructor(
    readonly path: string,
    readonly status?: number,
  ) {
    super(
      status
        ? `OG asset request failed with ${status}: ${path}`
        : `OG asset is empty: ${path}`,
    );
    this.name = 'OgAssetLoadError';
  }
}

const loadAsset = async (
  fetcher: AssetFetcher,
  path: string,
): Promise<Uint8Array> => {
  const response = await fetcher.fetch(`https://assets.local${path}`);
  if (!response.ok) {
    throw new OgAssetLoadError(path, response.status);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new OgAssetLoadError(path);
  }
  return bytes;
};

export const loadOgAssets = async (
  fetcher: AssetFetcher,
): Promise<OgAssets> => {
  const [background, font] = await Promise.all([
    loadAsset(fetcher, BACKGROUND_PATH),
    loadAsset(fetcher, FONT_PATH),
  ]);
  return { background, font };
};
