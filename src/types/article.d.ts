interface Article  {
    id: string;
    title?: string;
    summary?: string;
    content?: string;
    eyecatch?: MicroCMSImage;
    tags?: Tag[];
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    revisedAt?: string;
};
