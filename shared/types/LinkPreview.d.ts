type LinkPreviewType = 'GENERAL' | 'MISSKEY_NOTE' | 'MISSKEY_HASHTAG' | 'MISSKEY_USER' | 'MISSKEY_CLIP';

interface LinkPreviewResponse {
  url: string;
  domain: string;
  title: string;
  description: string;
  image?: string;
  favicon?: string;
  isMisskey: boolean;
  type: LinkPreviewType;
}
