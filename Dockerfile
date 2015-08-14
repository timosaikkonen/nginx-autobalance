FROM phusion/baseimage

CMD ["/sbin/my_init"]
RUN apt-get update -y && apt-get install -y nginx nodejs npm
RUN update-rc.d nginx defaults && ln -s /usr/bin/nodejs /usr/bin/node
RUN npm install forever -g

ADD package.json /usr/src/app/package.json

WORKDIR /usr/src/app
RUN npm install

RUN mkdir /etc/service/app
ADD app.sh /etc/service/app/run

ADD . /usr/src/app
ADD nginx/. /etc/nginx/