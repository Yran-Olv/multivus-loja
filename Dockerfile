# MULTIVUS Loja — imagem de produção (Next.js standalone)
FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --legacy-peer-deps

FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_DOMAIN=http://multivus.local
ARG NEXT_PUBLIC_BACKEND_DOMAIN=http://apiloja.multivus.local
ENV NEXT_PUBLIC_DOMAIN=$NEXT_PUBLIC_DOMAIN
ENV NEXT_PUBLIC_BACKEND_DOMAIN=$NEXT_PUBLIC_BACKEND_DOMAIN
ENV NODE_ENV=production

RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

RUN apt-get update && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
RUN mkdir -p public/uploads && chown -R nextjs:nodejs public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3255
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
