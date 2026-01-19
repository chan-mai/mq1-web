type LinkPreviewType = 'GENERAL' | 'MISSKEY_NOTE' | 'MISSKEY_HASHTAG' | 'MISSKEY_USER' | 'MISSKEY_CLIP' | 'GITHUB_PERMALINK';

interface LinkPreviewResponse {
  url: string;
  domain: string;
  title: string;
  description: string;
  image?: string;
  favicon?: string;
  isMisskey: boolean;
  type: LinkPreviewType;
  code?: string;
  startLine?: number;
  endLine?: number;
}
