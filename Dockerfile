# Development container. Production is static assets on Cloudflare Workers —
# nothing from this image ships to production.
FROM node:24-alpine

ENV PNPM_HOME=/pnpm
ENV COREPACK_HOME=/pnpm/corepack
ENV PATH="$PNPM_HOME:$PATH"

# Activate the pnpm pinned by package.json#packageManager while still root, then
# hand /pnpm and /app to the node user — both must be writable unprivileged or
# the install below fails with EACCES.
RUN corepack enable \
  && corepack prepare pnpm@10.13.1 --activate \
  && mkdir -p /pnpm /app \
  && chown -R node:node /pnpm /app

WORKDIR /app
USER node

# Manifests first so the install layer caches across source edits.
COPY --chown=node:node package.json pnpm-lock.yaml* ./

# --ignore-scripts skips the `prepare` script: there is no .git in the build
# context (see .dockerignore), so installing git hooks here is meaningless.
RUN pnpm install --ignore-scripts

COPY --chown=node:node . .

EXPOSE 4321

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
