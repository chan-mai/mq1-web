type LinkPreviewType =
  | 'GENERAL'
  | 'MISSKEY_NOTE'
  | 'MISSKEY_HASHTAG'
  | 'MISSKEY_USER'
  | 'MISSKEY_CLIP'
  | 'GITHUB_PERMALINK'
  | 'TWITTER'
  | 'YOUTUBE'
  | 'INSTAGRAM';

type LinkPreviewResponse = {
  url: string;
  domain: string;
  title: string;
  description: string;
  image?: string;
  favicon?: string;
  type: LinkPreviewType;
  embedId?: string;
  code?: string;
  startLine?: number;
  endLine?: number;
};
