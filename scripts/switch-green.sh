#!/bin/sh
# Direciona 100% do tráfego para a versão Green (v2)
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "==> [Blue-Green] Apontando tráfego para Green (v2)..."
cp "$ROOT/nginx/upstreams/green.conf" "$ROOT/nginx/conf.d/upstream.conf"
docker compose -f "$ROOT/docker-compose.yml" exec -T proxy nginx -s reload
if sh "$ROOT/scripts/wait-color.sh" green; then
  echo "==> [OK] Tráfego 100% no Green! (Deploy concluído com zero downtime)"
else
  echo "==> [ATENCAO] O Nginx recarregou, mas o trafego ainda nao respondeu como green. Rode 'make status'."
  exit 1
fi
