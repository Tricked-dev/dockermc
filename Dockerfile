# syntax=docker/dockerfile:1
# FORK of https://github.com/Goobaroo/docker-ftbOceanBlock
FROM openjdk:@version-buster

LABEL version="1.11.0"

RUN apt-get update && apt-get install -y curl unzip && \
 addgroup minecraft && \
 adduser --home /data --ingroup minecraft --disabled-password minecraft

USER minecraft

RUN curl -fsSL https://deno.land/install.sh | sh

VOLUME /data
WORKDIR /data

EXPOSE 25565/tcp

COPY . .

ENV LEVEL world

ENTRYPOINT ["./start.sh"]