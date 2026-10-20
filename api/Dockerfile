FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js build-docs-context.js docs-retrieval.js chat-request.js gemini.js limits.js ./
COPY docs-context.txt ./
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
