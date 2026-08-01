#!/bin/sh
set -eu

tls_dir=/var/lib/postgresql/tls
cert_file="${tls_dir}/server.crt"
key_file="${tls_dir}/server.key"

mkdir -p "${tls_dir}"

if [ ! -s "${cert_file}" ] || [ ! -s "${key_file}" ]; then
  echo "[VX House] Generating the internal PostgreSQL TLS certificate..."
  umask 077
  openssl req \
    -x509 \
    -newkey rsa:4096 \
    -sha256 \
    -nodes \
    -days "${POSTGRES_TLS_CERT_DAYS:-3650}" \
    -subj "/CN=postgres" \
    -keyout "${key_file}" \
    -out "${cert_file}"
fi

chown -R postgres:postgres "${tls_dir}"
chmod 0600 "${key_file}"
chmod 0644 "${cert_file}"

exec docker-entrypoint.sh "$@" \
  -c ssl=on \
  -c "ssl_cert_file=${cert_file}" \
  -c "ssl_key_file=${key_file}" \
  -c password_encryption=scram-sha-256
