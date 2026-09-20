#!/bin/sh
# Aguarda o Nginx concluir o reload e passar a responder com a cor esperada.
# O reload é gracioso: os workers antigos ainda atendem por ~100ms.
COLOR=$1
ROOT=$(cd "$(dirname "$0")/.." && pwd)

i=0
while [ $i -lt 20 ]; do
  if docker compose -f "$ROOT/docker-compose.yml" exec -T proxy \
       wget -q -O - http://127.0.0.1/api/version 2>/dev/null | grep -q "\"color\":\"$COLOR\""; then
    exit 0
  fi
  i=$((i + 1))
  sleep 0.1
done
exit 1
