type MicroCMSTag = MicroCMSObject<{
  name: string;
  slug: string;
}>;

type Tag = MicroCMSTag & {
  count?: number;
};
