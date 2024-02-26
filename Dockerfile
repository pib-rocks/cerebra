FROM node:18 AS builder

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

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