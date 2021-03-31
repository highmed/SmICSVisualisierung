# based on https://nodejs.org/fr/docs/guides/nodejs-docker-webapp/
FROM node:13-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

RUN npm run build-server

EXPOSE 3231
CMD [ "npm", "run", "server" ]
