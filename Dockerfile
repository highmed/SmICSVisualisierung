FROM node:14.17.5-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3231

ENV DEV_MODE=false
ENV USE_AUTH=true

CMD [ "npm", "run", "server" ]
