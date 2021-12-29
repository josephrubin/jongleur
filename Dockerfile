FROM node:17

WORKDIR /usr/src/app

# Cache layer the packages before copying the rest of the files.
COPY package*.json ./
RUN npm install

# Copy and build the rest of the files.
COPY . .
RUN npm run build

# The Remix server runs on port 3000, but we'll redirect HTTPS on
# the load balancer (443) to container port 3000 to route requests.
EXPOSE 3000

CMD npm run start