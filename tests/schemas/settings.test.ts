import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { settingsPutBodySchema } from '#shared/schemas/settings';

describe('settingsPutBodySchema', () => {
  it('文字列配列を受理する', () => {
    expect(
      v.safeParse(settingsPutBodySchema, { pinnedArticleIds: [] }).success,
    ).toBe(true);
    expect(
      v.safeParse(settingsPutBodySchema, { pinnedArticleIds: ['a', 'b'] })
        .success,
    ).toBe(true);
  });

  it('非配列・非文字列要素・空文字要素を拒否する', () => {
    expect(v.safeParse(settingsPutBodySchema, {}).success).toBe(false);
    expect(
      v.safeParse(settingsPutBodySchema, { pinnedArticleIds: 'a' }).success,
    ).toBe(false);
    expect(
      v.safeParse(settingsPutBodySchema, { pinnedArticleIds: ['a', 1] })
        .success,
    ).toBe(false);
    expect(
      v.safeParse(settingsPutBodySchema, { pinnedArticleIds: [''] }).success,
    ).toBe(false);
  });
});
