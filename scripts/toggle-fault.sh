#!/bin/sh
# Alterna injeção de erro HTTP 500 no container especificado (default: api-green)
TARGET=${1:-api-green}

echo "==> [Caos / Canary] Alternando estado de falha simulada em $TARGET..."
docker compose exec proxy wget -qO- --post-data="" http://${TARGET}:3000/api/fault/toggle
echo ""
echo "==> Verifique os alertas e a taxa de erro no dashboard (http://localhost)."
