FROM node:14.17.5-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV USE_AUTH=false
ENV SMICS_HOSTNAME=localhost
ENV SMICS_PORT=9787
ENV AUTH_PRORIVDER_URL
ENV AUTH_REALM
ENV AUTH_CLIENT_ID
ENV AUTH_CLIENT_SECRET

RUN npm run build

EXPOSE 3231

CMD [ "npm", "run", "server" ]
