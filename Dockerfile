# build
FROM node:12.7-alpine as build

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci

COPY src tsconfig.json ./
RUN npm run build && \
    npm prune --production

# run
FROM node:12.7-alpine

WORKDIR /opt/app

RUN apk add --update --no-cache \
      udev \
      ttf-freefont \
      chromium

COPY --from=build /opt/app ./

CMD ["node", "lib/index.js"]
