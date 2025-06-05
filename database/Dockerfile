FROM alpine AS builder
COPY init.sql /init.sql

FROM postgres:latest

ENV POSTGRES_DB=mydatabase
ENV POSTGRES_USER=myuser
ENV POSTGRES_PASSWORD=mypassword

COPY --from=builder /init.sql /docker-entrypoint-initdb.d/