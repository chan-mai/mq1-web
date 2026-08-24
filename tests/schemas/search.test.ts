import { describe, expect, it } from "vitest";
import * as v from "valibot";
import {
  linkPreviewQuerySchema,
  popularArticlesQuerySchema,
  searchQuerySchema,
} from "#shared/schemas/search";

describe("searchQuerySchema", () => {
  it("全項目未指定を受理する", () => {
    expect(v.safeParse(searchQuerySchema, {}).success).toBe(true);
  });

  it("tagsをCSVから配列へ変換する", () => {
    expect(v.parse(searchQuerySchema, { tags: "a,b" }).tags).toEqual([
      "a",
      "b",
    ]);
    expect(v.parse(searchQuerySchema, { tags: "a,,b" }).tags).toEqual([
      "a",
      "b",
    ]);
    expect(v.parse(searchQuerySchema, { tags: "" }).tags).toEqual([]);
  });

  it("tagsの11個以上を拒否する", () => {
    const tags = Array.from({ length: 11 }, (_, i) => `t${i}`).join(",");
    expect(v.safeParse(searchQuerySchema, { tags }).success).toBe(false);
  });

  it("qの201文字以上を拒否する", () => {
    expect(v.safeParse(searchQuerySchema, { q: "a".repeat(201) }).success).toBe(
      false,
    );
  });

  it("解釈不能なsince/untilを拒否する", () => {
    expect(
      v.safeParse(searchQuerySchema, { since: "2026-01-01T00:00:00.000Z" })
        .success,
    ).toBe(true);
    expect(v.safeParse(searchQuerySchema, { since: "bad-date" }).success).toBe(
      false,
    );
    expect(v.safeParse(searchQuerySchema, { until: "bad-date" }).success).toBe(
      false,
    );
  });
});

describe("popularArticlesQuerySchema", () => {
  it("未指定と64文字以内を受理する", () => {
    expect(v.safeParse(popularArticlesQuerySchema, {}).success).toBe(true);
    expect(
      v.safeParse(popularArticlesQuerySchema, { excludeId: "abc" }).success,
    ).toBe(true);
  });

  it("65文字以上を拒否する", () => {
    expect(
      v.safeParse(popularArticlesQuerySchema, { excludeId: "a".repeat(65) })
        .success,
    ).toBe(false);
  });
});

describe("linkPreviewQuerySchema", () => {
  it("urlをtrimして受理する", () => {
    expect(
      v.parse(linkPreviewQuerySchema, { url: " https://example.com " }).url,
    ).toBe("https://example.com");
  });

  it("欠落・空文字・上限超過を拒否する", () => {
    expect(v.safeParse(linkPreviewQuerySchema, {}).success).toBe(false);
    expect(v.safeParse(linkPreviewQuerySchema, { url: "" }).success).toBe(
      false,
    );
    expect(
      v.safeParse(linkPreviewQuerySchema, {
        url: `https://e.com/${"a".repeat(2048)}`,
      }).success,
    ).toBe(false);
  });
});
