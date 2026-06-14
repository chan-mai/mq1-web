type MicroCMSArticle = MicroCMSObject<{
  title: string;
  content: string;
  eyecatch?: MicroCMSImage;
  tags?: Tag[];
  is_no_index: boolean;
}>;

type Article = MicroCMSArticle & {
  summary?: string;
};
