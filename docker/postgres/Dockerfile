FROM postgres:17-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY docker/postgres/start-tls.sh /usr/local/bin/start-postgres-tls
RUN chmod 0755 /usr/local/bin/start-postgres-tls

ENTRYPOINT ["start-postgres-tls"]
CMD ["postgres"]
