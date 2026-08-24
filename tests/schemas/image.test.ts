import { describe, expect, it } from "vitest";
import * as v from "valibot";
import {
  imageDimensionSchema,
  imageKeyParamsSchema,
  imageMimeSchema,
} from "#shared/schemas/image";

describe("imageMimeSchema", () => {
  it("対応MIMEを受理する", () => {
    expect(v.safeParse(imageMimeSchema, "image/png").success).toBe(true);
    expect(v.safeParse(imageMimeSchema, "image/avif").success).toBe(true);
  });

  it("非対応MIMEを拒否する", () => {
    expect(v.safeParse(imageMimeSchema, "text/html").success).toBe(false);
    expect(v.safeParse(imageMimeSchema, "").success).toBe(false);
    expect(v.safeParse(imageMimeSchema, "image/svg+xml").success).toBe(false);
  });
});

describe("imageDimensionSchema", () => {
  it("未指定と正整数文字列を受理する", () => {
    expect(v.parse(imageDimensionSchema, undefined)).toBeUndefined();
    expect(v.parse(imageDimensionSchema, "100")).toBe(100);
  });

  it("0以下と非整数を拒否する", () => {
    expect(v.safeParse(imageDimensionSchema, "0").success).toBe(false);
    expect(v.safeParse(imageDimensionSchema, "-1").success).toBe(false);
    expect(v.safeParse(imageDimensionSchema, "12.5").success).toBe(false);
    expect(v.safeParse(imageDimensionSchema, "abc").success).toBe(false);
  });
});

describe("imageKeyParamsSchema", () => {
  it("有効なキーを受理する", () => {
    expect(v.safeParse(imageKeyParamsSchema, { key: "abc.png" }).success).toBe(
      true,
    );
  });

  it("パストラバーサルを拒否する", () => {
    expect(
      v.safeParse(imageKeyParamsSchema, { key: "../secret.png" }).success,
    ).toBe(false);
  });
});
