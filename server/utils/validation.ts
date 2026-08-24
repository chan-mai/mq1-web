import type { H3Event } from 'h3';
import * as v from 'valibot';

// バリデーション失敗を統一形式でthrow
export const parseOrThrow = <TSchema extends v.GenericSchema>(
  schema: TSchema,
  data: unknown,
  statusCode: 400 | 404 = 400,
): v.InferOutput<TSchema> => {
  const result = v.safeParse(schema, data);
  if (!result.success) {
    throw createError({
      statusCode,
      statusMessage: statusCode === 404 ? 'Not Found' : 'Validation Error',
      message: 'Invalid request',
      // 秘匿値反射防止: pathとmessageのみ返却
      data: {
        issues: result.issues.map((issue) => ({
          path: v.getDotPath(issue) ?? '',
          message: issue.message,
        })),
      },
    });
  }
  return result.output;
};

export const validateBody = async <TSchema extends v.GenericSchema>(
  event: H3Event,
  schema: TSchema,
): Promise<v.InferOutput<TSchema>> => {
  let raw: unknown;
  try {
    raw = await readBody(event);
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      message: 'Invalid JSON body',
    });
  }
  return parseOrThrow(schema, raw);
};

export const validateQuery = <TSchema extends v.GenericSchema>(
  event: H3Event,
  schema: TSchema,
): v.InferOutput<TSchema> => parseOrThrow(schema, getQuery(event));

export const validateParams = <TSchema extends v.GenericSchema>(
  event: H3Event,
  schema: TSchema,
  statusCode: 400 | 404 = 400,
): v.InferOutput<TSchema> =>
  parseOrThrow(schema, getRouterParams(event), statusCode);
