FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.9.0 --activate

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    postgresql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Configure git to trust the workspace directory
RUN git config --global --add safe.directory /workspace

