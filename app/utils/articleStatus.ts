export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: '下書き',
  published: '公開中',
  private: '非公開',
};

export const ARTICLE_STATUS_ICONS: Record<ArticleStatus, string> = {
  draft: 'lucide:lock',
  published: 'lucide:book-open',
  private: 'lucide:eye-off',
};
