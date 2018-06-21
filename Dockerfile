FROM alpine
RUN apk add --no-cache bash g++ git make nodejs python 
RUN mkdir /cryptoprof
ADD ./package.json ./package-lock.json /cryptoprof/
WORKDIR /cryptoprof
RUN npm install
ADD . /cryptoprof
ENTRYPOINT ["/usr/bin/node", "index.js"]
