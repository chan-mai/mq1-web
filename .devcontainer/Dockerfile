FROM mcr.microsoft.com/devcontainers/typescript-node:24

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

# Set working directory
WORKDIR /workspace

# Configure git to trust the workspace directory
RUN git config --global --add safe.directory /workspace

