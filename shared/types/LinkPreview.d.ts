type LinkPreviewType = 'GENERAL' | 'MISSKEY_NOTE' | 'MISSKEY_HASHTAG' | 'MISSKEY_USER' | 'MISSKEY_CLIP' | 'GITHUB_PERMALINK';

interface LinkPreviewResponse {
  url: string;
  domain: string;
  title: string;
  description: string;
  image?: string;
  favicon?: string;
  favicon?: string;
  type: LinkPreviewType;
  code?: string;
  startLine?: number;
  endLine?: number;
}
