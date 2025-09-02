import { createClient } from "microcms-js-sdk";

export const useMicroCMSClient = () => {
    const config = useRuntimeConfig();
    const serviceDomain = config.public.microcms.serviceDomain as unknown as string;
    const apiKey = config.public.microcms.apiKey as unknown as string;
    // check if service domain and API key are set
    if (!serviceDomain || !apiKey) throw new Error("MicroCMS service domain and API key must be set in runtime config.");

    const client = createClient({
        serviceDomain,
        apiKey,
    });
    return client;
}
