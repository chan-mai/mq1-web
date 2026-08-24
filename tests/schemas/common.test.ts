import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
  imageKey,
  nonEmptyId,
  parseableDate,
  queryInt,
  tagSlug,
} from '#shared/schemas/common';

describe('queryInt', () => {
  const schema = queryInt({ min: 0, max: 50 });

  it('境界値を受理する', () => {
    expect(v.safeParse(schema, '0').success).toBe(true);
    expect(v.parse(schema, '50')).toBe(50);
  });

  it('数値へ変換する', () => {
    expect(v.parse(schema, '10')).toBe(10);
  });

  it('範囲外と非整数を拒否する', () => {
    expect(v.safeParse(schema, '51').success).toBe(false);
    expect(v.safeParse(schema, '-1').success).toBe(false);
    expect(v.safeParse(schema, 'abc').success).toBe(false);
    expect(v.safeParse(schema, '1e2').success).toBe(false);
    expect(v.safeParse(schema, '1.5').success).toBe(false);
    expect(v.safeParse(schema, 10).success).toBe(false);
  });
});

describe('nonEmptyId', () => {
  it('非空64文字以内を受理する', () => {
    expect(v.safeParse(nonEmptyId, 'abc').success).toBe(true);
    expect(v.safeParse(nonEmptyId, 'a'.repeat(64)).success).toBe(true);
  });

  it('空文字と65文字以上を拒否する', () => {
    expect(v.safeParse(nonEmptyId, '').success).toBe(false);
    expect(v.safeParse(nonEmptyId, 'a'.repeat(65)).success).toBe(false);
  });
});

describe('tagSlug', () => {
  it('小文字slugを受理する', () => {
    expect(v.safeParse(tagSlug, 'my-tag').success).toBe(true);
  });

  it('大文字と65文字以上を拒否する', () => {
    expect(v.safeParse(tagSlug, 'My-Tag').success).toBe(false);
    expect(v.safeParse(tagSlug, 'a'.repeat(65)).success).toBe(false);
  });
});

describe('imageKey', () => {
  it('拡張子付きキーを受理する', () => {
    expect(v.safeParse(imageKey, 'abc.png').success).toBe(true);
    expect(v.safeParse(imageKey, 'dir/abc.webp').success).toBe(true);
  });

  it('パストラバーサルと不正形式を拒否する', () => {
    expect(v.safeParse(imageKey, '../etc/passwd').success).toBe(false);
    expect(v.safeParse(imageKey, 'a..png').success).toBe(false);
    expect(v.safeParse(imageKey, 'abc').success).toBe(false);
    expect(v.safeParse(imageKey, 'abc.PNG').success).toBe(false);
  });
});

describe('parseableDate', () => {
  it('Date.parse可能な文字列を受理する', () => {
    expect(v.safeParse(parseableDate, '2026-01-01T00:00:00.000Z').success).toBe(
      true,
    );
  });

  it('解釈不能な文字列と空文字を拒否する', () => {
    expect(v.safeParse(parseableDate, 'not-a-date').success).toBe(false);
    expect(v.safeParse(parseableDate, '').success).toBe(false);
  });
});
