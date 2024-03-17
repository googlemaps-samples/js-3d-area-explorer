###

FROM node:alpine 

RUN npm install -g http-server
RUN npm -g install firebase
# RUN npm install -g node-fetch

WORKDIR /home/node

COPY ./src .
COPY ./demo/src ./demo

ARG API_KEY

RUN cp env.example.js env.js
RUN sed -i -r "s/<API_KEY>/${API_KEY}/g" env.js
RUN sed -i "s/main.js/demo\/config-panel.js/g" index.html

# The default port of the application
EXPOSE  8080

CMD ["http-server", "-p", "8080", "."]
