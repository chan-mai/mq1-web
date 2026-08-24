import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { proofreadBodySchema } from "#shared/schemas/llm";

describe("proofreadBodySchema", () => {
  it("textをtrimして受理する", () => {
    expect(v.parse(proofreadBodySchema, { text: " hello " })).toEqual({
      text: "hello",
    });
  });

  it("空文字と空白のみを拒否する", () => {
    expect(v.safeParse(proofreadBodySchema, { text: "" }).success).toBe(false);
    expect(v.safeParse(proofreadBodySchema, { text: "   " }).success).toBe(
      false,
    );
    expect(v.safeParse(proofreadBodySchema, {}).success).toBe(false);
  });
});
