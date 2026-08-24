import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { tagUpsertBodySchema } from '#shared/schemas/tag';

describe('tagUpsertBodySchema', () => {
  it('nameをtrimして受理する', () => {
    const result = v.parse(tagUpsertBodySchema, {
      name: ' Vue ',
      slug: 'vue',
    });
    expect(result).toEqual({ name: 'Vue', slug: 'vue' });
  });

  it('空nameと不正slugを拒否する', () => {
    expect(
      v.safeParse(tagUpsertBodySchema, { name: '', slug: 'vue' }).success,
    ).toBe(false);
    expect(
      v.safeParse(tagUpsertBodySchema, { name: '  ', slug: 'vue' }).success,
    ).toBe(false);
    expect(
      v.safeParse(tagUpsertBodySchema, { name: 'Vue', slug: 'Vue' }).success,
    ).toBe(false);
  });

  it('欠落フィールドを拒否する', () => {
    expect(v.safeParse(tagUpsertBodySchema, { name: 'Vue' }).success).toBe(
      false,
    );
    expect(v.safeParse(tagUpsertBodySchema, undefined).success).toBe(false);
  });
});
