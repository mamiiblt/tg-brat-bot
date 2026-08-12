FROM node:22-alpine

ARG CHROMIUM_VERSION=151.0.7922.138

RUN apk add --no-cache \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \ 
    font-noto-emoji \
    font-noto \
    font-noto-cjk

RUN wget -q \
    "https://storage.googleapis.com/chrome-for-testing-public/${CHROMIUM_VERSION}/linux64/chrome-linux64.zip" \
    -O /tmp/chromium.zip \
    && unzip -q /tmp/chromium.zip -d /opt \
    && mv /opt/chrome-linux64 /opt/chromium \
    && rm /tmp/chromium.zip \
    && ln -s /opt/chromium/chrome /usr/local/bin/chromium \
    && fc-cache -f -v

ENV PUPPETEER_EXECUTABLE_PATH=/opt/chromium/chrome
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "run", "start"]