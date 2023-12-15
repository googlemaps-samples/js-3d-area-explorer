

###

FROM node:21-alpine

RUN npm install -g http-server

COPY ./src .

ARG API_KEY

RUN cp env.example.js env.js
RUN sed -i -r "s/<API_KEY>/${API_KEY}/g" env.js

# The default port of the application
EXPOSE  8080

CMD ["http-server", "-p", "8080", "."]
