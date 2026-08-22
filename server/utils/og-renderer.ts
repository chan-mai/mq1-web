import { container, image, text } from "@takumi-rs/helpers";
import initTakumi, { Renderer } from "@takumi-rs/wasm";
import wasmModule from "../assets/takumi.wasm?module";
import type { OgAssets } from "./og-assets";

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const IMAGE_HEIGHT = 630;
const IMAGE_WIDTH = 1200;
const TITLE_HEIGHT = 350;
const TITLE_LEFT = 50;
const TITLE_TOP = 140;
const TITLE_WIDTH = 1100;

let renderer: Promise<Renderer> | undefined;

const getRenderer = (): Promise<Renderer> => {
  if (!renderer) {
    renderer = initTakumi({ module_or_path: wasmModule })
      .then(() => new Renderer())
      .catch((error: unknown) => {
        renderer = undefined;
        throw error;
      });
  }
  return renderer;
};

export const renderOgImage = async (
  title: string,
  assets: OgAssets,
): Promise<Response> => {
  const node = container({
    style: {
      display: "flex",
      height: IMAGE_HEIGHT,
      overflow: "hidden",
      position: "relative",
      width: IMAGE_WIDTH,
    },
    children: [
      image({
        src: "background",
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        style: {
          height: IMAGE_HEIGHT,
          left: 0,
          objectFit: "fill",
          position: "absolute",
          top: 0,
          width: IMAGE_WIDTH,
        },
      }),
      container({
        lang: "ja",
        style: {
          display: "flex",
          height: TITLE_HEIGHT,
          left: TITLE_LEFT,
          overflow: "hidden",
          position: "absolute",
          top: TITLE_TOP,
          width: TITLE_WIDTH,
        },
        children: [
          text(title.normalize("NFC"), {
            color: "#f57aa5",
            fontFamily: "Noto Sans JP",
            fontSize: 60,
            fontWeight: 400,
            lineHeight: 1.2,
            textAlign: "left",
          }),
        ],
      }),
    ],
  });
  const activeRenderer = await getRenderer();
  const output = await activeRenderer.render(node, {
    fonts: [
      {
        data: assets.font,
        name: "Noto Sans JP",
        weight: 400,
      },
    ],
    format: "png",
    images: [
      {
        data: assets.background,
        src: "background",
      },
    ],
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
  });

  return new Response(output, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": "image/png",
    },
  });
};
