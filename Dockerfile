FROM node:15.13.0

WORKDIR /usr/src/app

# Cache layer the packages before copying the rest of the files.
COPY package*.json ./
RUN npm install

# Copy and build the rest of the files.
COPY . .
RUN npm run build

EXPOSE 3000
EXPOSE 80

CMD npm run start