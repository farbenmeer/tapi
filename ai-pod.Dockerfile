FROM node:24

RUN corepack enable
RUN npm install -g @playwright/cli
RUN npx playwright install-deps

WORKDIR /app

RUN useradd -ms /bin/bash claude
RUN chown -R claude /app

# System-level git identity
RUN git config --system user.email "claude@ai-pod" && \
    git config --system user.name "claude"

USER claude

ENV PATH="/home/claude/.local/bin:${PATH}"


CMD ["claude"]
