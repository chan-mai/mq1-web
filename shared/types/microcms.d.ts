import type { MicroCMSContentId, MicroCMSDate, MicroCMSImage as SdkImage, MicroCMSQueries as SdkQueries } from "microcms-js-sdk";

declare global {
    type MicroCMSObject<T> = MicroCMSContentId & MicroCMSDate & T;
    type MicroCMSImage = SdkImage;
    type MicroCMSQueries = SdkQueries;
}

export {};
