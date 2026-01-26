FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update -y && apt-get install -y openssl
RUN corepack enable
COPY . /app
WORKDIR /app

# Build misskey embed dependency
FROM node:24-slim AS misskey-embed-build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update -y && apt-get install -y openssl git
RUN corepack enable
WORKDIR /app
RUN git clone https://github.com/misskey-dev/vue-misskey-embed.git
WORKDIR /app/vue-misskey-embed
RUN git checkout b8e64b3
RUN pnpm install && pnpm run build

FROM base AS prod-deps
RUN pnpm install --prod --frozen-lockfile
# Copy built artifact to node_modules
COPY --from=misskey-embed-build /app/vue-misskey-embed/dist /app/node_modules/@misskey-dev/vue-misskey-embed/dist

FROM base AS build
RUN pnpm install --frozen-lockfile
# Copy built artifact to node_modules
COPY --from=misskey-embed-build /app/vue-misskey-embed/dist /app/node_modules/@misskey-dev/vue-misskey-embed/dist

ARG DATABASE_URL
ARG DISCORD_WEBHOOK_URL
ARG GA_TRACKING_ID
ARG GITHUB_CLIENT_ID
ARG GITHUB_SECRET
ARG MICROCMS_API_KEY
ARG MICROCMS_SERVICE_DOMAIN
ARG NUXT_SESSION_PASSWORD
ARG TURNSTILE_SECRET_KEY
ARG TURNSTILE_SITE_KEY
ARG ADMIN_COMMENT_CREDENTIAL

ENV DATABASE_URL=$DATABASE_URL
ENV DISCORD_WEBHOOK_URL=$DISCORD_WEBHOOK_URL
ENV GA_TRACKING_ID=$GA_TRACKING_ID
ENV GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
ENV GITHUB_SECRET=$GITHUB_SECRET
ENV MICROCMS_API_KEY=$MICROCMS_API_KEY
ENV MICROCMS_SERVICE_DOMAIN=$MICROCMS_SERVICE_DOMAIN
ENV NUXT_SESSION_PASSWORD=$NUXT_SESSION_PASSWORD
ENV TURNSTILE_SECRET_KEY=$TURNSTILE_SECRET_KEY
ENV TURNSTILE_SITE_KEY=$TURNSTILE_SITE_KEY
ENV ADMIN_COMMENT_CREDENTIAL=$ADMIN_COMMENT_CREDENTIAL

RUN pnpm nuxt prepare && pnpm prisma generate && pnpm build && pnpm prisma migrate deploy

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/.output /app/.output

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

EXPOSE 3000
CMD [ "sh", "-c", "pnpm start" ]
