FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.9.0 --activate

# Set working directory
WORKDIR /workspace

# Configure git to trust the workspace directory
RUN git config --global --add safe.directory /workspace

