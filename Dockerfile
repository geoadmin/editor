FROM nodesource/xenial:6.1.0

EXPOSE 8010

ENV HOME /maputnik
RUN mkdir ${HOME}

COPY . ${HOME}/

WORKDIR ${HOME}

RUN npm install
RUN npm run build

CMD npm run start -- --host 0.0.0.0 -p 8010
