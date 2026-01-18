FROM node:22-slim

# Minimal tooling commonly needed for npm installs (and debugging in the sandbox).
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Vite + React + Tailwind skeleton (pre-installed for fast sandbox startup).
# Keep the template sources as real repo files so automation can update deps cleanly.
COPY e2b/template/package.json /app/package.json
COPY e2b/template/vite.config.js /app/vite.config.js
COPY e2b/template/tailwind.config.js /app/tailwind.config.js
COPY e2b/template/postcss.config.js /app/postcss.config.js
COPY e2b/template/index.html /app/index.html
COPY e2b/template/src /app/src

# Prevent npm EACCES issues at runtime by ensuring /app and npm cache are writable for the sandbox runtime user.
# Note: E2B command runner often executes as uid=1001(user), not the image's default `node` user.
RUN mkdir -p /tmp/npm-cache \
  && chown -R node:node /app /tmp/npm-cache

ENV NPM_CONFIG_CACHE=/tmp/npm-cache

# Install deps at build-time so sandboxes start fast (as non-root), then open permissions for runtime user.
USER node
RUN npm install && chmod -R a+rwX /app /tmp/npm-cache

