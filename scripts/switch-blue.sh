#!/bin/sh
# Direciona 100% do tráfego para a versão Blue (v1)
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "==> [Blue-Green] Apontando tráfego para Blue (v1)..."
cp "$ROOT/nginx/upstreams/blue.conf" "$ROOT/nginx/conf.d/upstream.conf"
docker compose -f "$ROOT/docker-compose.yml" exec -T proxy nginx -s reload
if sh "$ROOT/scripts/wait-color.sh" blue; then
  echo "==> [OK] Tráfego 100% no Blue! (Rollback instantâneo concluído)"
else
  echo "==> [ATENCAO] O Nginx recarregou, mas o trafego ainda nao respondeu como blue. Rode 'make status'."
  exit 1
fi
