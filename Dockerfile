FROM node:22 AS builder

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

ARG APP_VERSION
RUN APP_VERSION_VAL="${APP_VERSION:-dev}" && printf 'export const APP_VERSION = "%s";' "$APP_VERSION_VAL" > /app/src/app/shared/util/version.ts

ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm run build --prod; \
    else \
      npm run build; \
    fi

FROM nginx:1.25.4

COPY --from=builder /app/dist/ /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]