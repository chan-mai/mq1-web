import type { MicroCMSDate, MicroCMSObjectContent } from "microcms-js-sdk";
export type MicroCMSObject<T> = MicroCMSContentId & MicroCMSDate & T;
