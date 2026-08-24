import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
  articleListQuerySchema,
  createArticleBodySchema,
  unpublishBodySchema,
  updateArticleBodySchema,
} from '#shared/schemas/article';

describe('updateArticleBodySchema', () => {
  it('空オブジェクトを受理する', () => {
    expect(v.safeParse(updateArticleBodySchema, {}).success).toBe(true);
  });

  it('eyecatchのundefined/null/objectを区別する', () => {
    const cleared = v.parse(updateArticleBodySchema, { eyecatch: null });
    expect(cleared.eyecatch).toBeNull();

    const unchanged = v.parse(updateArticleBodySchema, {});
    expect(unchanged.eyecatch).toBeUndefined();

    const replaced = v.parse(updateArticleBodySchema, {
      eyecatch: { key: 'abc.png', width: 100, height: 50 },
    });
    expect(replaced.eyecatch).toEqual({
      key: 'abc.png',
      width: 100,
      height: 50,
    });
  });

  it('不正なeyecatchを拒否する', () => {
    expect(
      v.safeParse(updateArticleBodySchema, { eyecatch: { key: '' } }).success,
    ).toBe(false);
    expect(
      v.safeParse(updateArticleBodySchema, {
        eyecatch: { key: 'abc.png', width: 0 },
      }).success,
    ).toBe(false);
  });

  it('contentはtype: docのみ受理する', () => {
    expect(
      v.safeParse(updateArticleBodySchema, {
        content: { type: 'doc', content: [] },
      }).success,
    ).toBe(true);
    expect(
      v.safeParse(updateArticleBodySchema, { content: { type: 'paragraph' } })
        .success,
    ).toBe(false);
  });

  it('publishedAtはnullと解釈可能な日付のみ受理する', () => {
    expect(
      v.safeParse(updateArticleBodySchema, { publishedAt: null }).success,
    ).toBe(true);
    expect(
      v.safeParse(updateArticleBodySchema, {
        publishedAt: '2026-01-01T00:00:00.000Z',
      }).success,
    ).toBe(true);
    expect(
      v.safeParse(updateArticleBodySchema, { publishedAt: 'not-a-date' })
        .success,
    ).toBe(false);
    expect(
      v.safeParse(updateArticleBodySchema, { publishedAt: '' }).success,
    ).toBe(false);
  });

  it('tagIdsの空文字要素と非booleanのisNoIndexを拒否する', () => {
    expect(
      v.safeParse(updateArticleBodySchema, { tagIds: ['a', ''] }).success,
    ).toBe(false);
    expect(
      v.safeParse(updateArticleBodySchema, { isNoIndex: 'true' }).success,
    ).toBe(false);
  });
});

describe('createArticleBodySchema', () => {
  it('body省略と空オブジェクトを受理する', () => {
    expect(v.safeParse(createArticleBodySchema, undefined).success).toBe(true);
    expect(v.safeParse(createArticleBodySchema, null).success).toBe(true);
    expect(v.safeParse(createArticleBodySchema, {}).success).toBe(true);
  });

  it('idは空文字(自動採番)かパターン適合のみ受理する', () => {
    expect(v.safeParse(createArticleBodySchema, { id: '' }).success).toBe(true);
    expect(v.safeParse(createArticleBodySchema, { id: '  ' }).success).toBe(
      true,
    );
    expect(
      v.safeParse(createArticleBodySchema, { id: 'abc_123' }).success,
    ).toBe(true);
    expect(v.safeParse(createArticleBodySchema, { id: 'ab' }).success).toBe(
      false,
    );
    expect(v.safeParse(createArticleBodySchema, { id: 'あいう' }).success).toBe(
      false,
    );
  });

  it('titleをtrimする', () => {
    const result = v.parse(createArticleBodySchema, { title: ' hello ' });
    expect(result?.title).toBe('hello');
  });
});

describe('articleListQuerySchema', () => {
  it('未指定と有効値を受理する', () => {
    expect(v.safeParse(articleListQuerySchema, {}).success).toBe(true);
    const result = v.parse(articleListQuerySchema, {
      limit: '10',
      offset: '0',
      tag: 'abc',
    });
    expect(result).toEqual({ limit: 10, offset: 0, tag: 'abc' });
  });

  it('未知キーを除去する', () => {
    const result = v.parse(articleListQuerySchema, { limit: '10', foo: 'bar' });
    expect(result).toEqual({ limit: 10 });
  });

  it('範囲外と非数値を拒否する', () => {
    expect(v.safeParse(articleListQuerySchema, { limit: '51' }).success).toBe(
      false,
    );
    expect(v.safeParse(articleListQuerySchema, { limit: 'abc' }).success).toBe(
      false,
    );
    expect(
      v.safeParse(articleListQuerySchema, { offset: '100001' }).success,
    ).toBe(false);
  });
});

describe('unpublishBodySchema', () => {
  it('body省略とdraft/privateを受理する', () => {
    expect(v.safeParse(unpublishBodySchema, undefined).success).toBe(true);
    expect(v.safeParse(unpublishBodySchema, {}).success).toBe(true);
    expect(v.safeParse(unpublishBodySchema, { status: 'draft' }).success).toBe(
      true,
    );
    expect(
      v.safeParse(unpublishBodySchema, { status: 'private' }).success,
    ).toBe(true);
  });

  it('それ以外のstatusを拒否する', () => {
    expect(
      v.safeParse(unpublishBodySchema, { status: 'published' }).success,
    ).toBe(false);
  });
});
