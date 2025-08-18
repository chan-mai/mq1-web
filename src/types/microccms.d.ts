import type { MicroCMSDate, MicroCMSObjectContent } from "microcms-js-sdk";
type MicroCMSObject<T> = MicroCMSContentId & MicroCMSDate & T;
