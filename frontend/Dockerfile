FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./public ./public
COPY ./src ./src
RUN npx --yes react-scripts build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]