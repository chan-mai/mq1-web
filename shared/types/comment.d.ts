import type { Comments } from '~~/generated/prisma/browser';

declare global {
  // PrismaのComments型を拡張して返信を含む型を定義
  interface CommentWithReplies extends Comments {
    replies?: CommentWithReplies[];
    parent?: CommentWithReplies | null;
    level?: number;
  }

  // ページネーション情報のインターフェース
  interface CommentsPagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }

  // コメント取得APIのレスポンス形式
  interface CommentsResponse {
    status: 'success' | 'check' | 'error';
    comments: CommentWithReplies[];
    pagination: CommentsPagination;
    overallCount: number; // 返信を含む全コメント数
  }
}

export {}
