#!/bin/sh
# Configura a proporção de Canary (10%, 25%, 50%, 100%)
set -e
PCT=$1
ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [ -z "$PCT" ]; then
  echo "Uso: $0 [10|25|50|100]"
  exit 1
fi

case "$PCT" in
  10)
    echo "==> [Canary] Configurando tráfego: 90% Blue (v1) e 10% Green (v2)..."
    SRC="canary-10.conf"
    ;;
  25)
    echo "==> [Canary] Configurando tráfego: 75% Blue (v1) e 25% Green (v2)..."
    SRC="canary-25.conf"
    ;;
  50)
    echo "==> [Canary] Configurando tráfego: 50% Blue (v1) e 50% Green (v2)..."
    SRC="canary-50.conf"
    ;;
  100)
    echo "==> [Canary] Promoção final: 100% Green (v2)..."
    SRC="green.conf"
    ;;
  *)
    echo "Erro: Porcentagem inválida. Escolha entre 10, 25, 50 ou 100."
    exit 1
    ;;
esac

cp "$ROOT/nginx/upstreams/$SRC" "$ROOT/nginx/conf.d/upstream.conf"
docker compose -f "$ROOT/docker-compose.yml" exec -T proxy nginx -s reload
echo "==> [OK] Nginx recarregado com Canary em ${PCT}%!"
