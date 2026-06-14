#!/bin/sh
set -e

# Run the tapi API (the bundled srvx fetch handler) on an internal port.
srvx serve --prod --host 127.0.0.1 --port "${API_PORT:-3000}" /srv/server.js &

# Caddy serves the static client files and reverse-proxies the API.
# exec so Caddy becomes PID 1 and receives stop signals directly; the srvx
# child exits with the container.
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
