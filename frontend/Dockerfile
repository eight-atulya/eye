#--------------------- Build Stage ---------------------#
FROM node:20-alpine AS deps

LABEL org.opencontainers.image.title="The Project EYE - Frontend"
LABEL org.opencontainers.image.description="EYE - Preserve memories. Have intelligent conversations."
LABEL org.opencontainers.image.source="https://github.com/eight-atulya/eye.git"
LABEL org.opencontainers.image.url="Need to add Docker-Hub Link here"
LABEL org.opencontainers.image.version="1.0.1"
LABEL org.opencontainers.image.authors="Karan Negi"
LABEL maintainer.email="Mail ID here"

WORKDIR /app

COPY package*.json  yarn.lock* pnpm-lock.yaml* ./

RUN npm install

#--------------------- Build Stage ---------------------#
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN npm run build

#---------------------Runner Stage ---------------------#
#We need to create nginx.conf for version controlled secured container and have to implement in dockerfile as well as.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/package*.json ./
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/.next ./.next
COPY --from=builder --chown=appuser:nodejs /app/public ./public

#COPY --from=builder --chown=appuser:nodejs /app/.next/standalone ./ 2>/dev/null || true

USER appuser

EXPOSE 3000

CMD ["npm", "run", "start"]
