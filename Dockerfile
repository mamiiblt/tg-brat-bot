FROM node:22-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm run build
COPY . .

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
