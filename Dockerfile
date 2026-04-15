FROM cgr.dev/chainguard/node:latest-dev AS build
USER root
WORKDIR /app
RUN chown -R node:node /app
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --ignore-scripts

COPY --chown=node:node . .
RUN npm run build

FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.mjs ./server.mjs

EXPOSE 4321
CMD ["server.mjs"]
