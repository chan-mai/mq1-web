import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { likeDeleteBodySchema, likeParamsSchema } from "#shared/schemas/like";

describe("likeParamsSchema", () => {
  it("非空contentIdを受理する", () => {
    expect(v.safeParse(likeParamsSchema, { contentId: "abc" }).success).toBe(
      true,
    );
  });

  it("空contentIdを拒否する", () => {
    expect(v.safeParse(likeParamsSchema, { contentId: "" }).success).toBe(
      false,
    );
  });
});

describe("likeDeleteBodySchema", () => {
  const valid = { id: crypto.randomUUID(), secret: crypto.randomUUID() };

  it("idとsecretの組を受理する", () => {
    expect(v.safeParse(likeDeleteBodySchema, valid).success).toBe(true);
  });

  it("未指定と空文字を拒否する", () => {
    expect(v.safeParse(likeDeleteBodySchema, {}).success).toBe(false);
    expect(
      v.safeParse(likeDeleteBodySchema, { ...valid, secret: "" }).success,
    ).toBe(false);
    expect(v.safeParse(likeDeleteBodySchema, { id: valid.id }).success).toBe(
      false,
    );
  });

  it("上限超過を拒否する", () => {
    expect(
      v.safeParse(likeDeleteBodySchema, { ...valid, id: "a".repeat(65) })
        .success,
    ).toBe(false);
    expect(
      v.safeParse(likeDeleteBodySchema, { ...valid, secret: "a".repeat(129) })
        .success,
    ).toBe(false);
  });
});
