type ArticleStatus = 'draft' | 'published' | 'private';

interface ArticleEyecatch {
  url: string;
  width?: number | null;
  height?: number | null;
}

interface Article {
  id: string;
  title: string;
  content: TiptapDoc;
  summary: string;
  charCount: number;
  eyecatch?: ArticleEyecatch | null;
  tags?: Tag[];
  is_no_index: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ArticleListResponse {
  contents: Article[];
  totalCount: number;
}
