#!/bin/sh
# Liga/desliga a injeção de erro HTTP 500 no container indicado.
# Uso: toggle-fault.sh [servico] [on|off]
# Sem o segundo argumento o estado é apenas alternado.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
TARGET=${1:-api-green}
STATE=$2

case "$STATE" in
  on)  BODY='{"enabled":true}';  echo "==> [Caos / Canary] Injetando falha em $TARGET..." ;;
  off) BODY='{"enabled":false}'; echo "==> [Caos / Canary] Removendo falha de $TARGET..." ;;
  "")  BODY='{}';                echo "==> [Caos / Canary] Alternando estado de falha em $TARGET..." ;;
  *)   echo "Uso: $0 [servico] [on|off]"; exit 1 ;;
esac

docker compose -f "$ROOT/docker-compose.yml" exec -T proxy \
  wget -q -O - --header="Content-Type: application/json" \
  --post-data="$BODY" "http://${TARGET}:3000/api/fault/toggle"
echo ""
echo "==> Verifique os alertas e a taxa de erro no dashboard (http://localhost)."
