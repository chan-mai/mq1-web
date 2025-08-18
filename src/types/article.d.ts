interface Article  {
    title?: string;
    summary?: string;
    content?: string;
    eyecatch?: MicroCMSImage;
    tags?: MicroCMSObject<Tag[]>;
};
