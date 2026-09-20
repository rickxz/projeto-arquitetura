#!/bin/sh
# Demonstração de Rolling Update gradual (Capítulo 3 do Guia)
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
COMPOSE="docker compose -f $ROOT/docker-compose.yml"

echo "=========================================================="
echo "    DEMONSTRAÇÃO DE ROLLING UPDATE (ATUALIZAÇÃO GRADUAL)  "
echo "=========================================================="
echo "Conceito: Em vez de trocar tudo de uma vez (Big Bang),"
echo "substituímos instâncias uma a uma, verificando a saúde"
echo "(readiness probe) antes de desligar as versões antigas."
echo "----------------------------------------------------------"

echo "Passo 1: Verificando a saúde da versão atual..."
$COMPOSE exec -T proxy wget -q -O - http://api-blue:3000/api/health
echo ""

echo "Passo 2: Subindo réplicas da nova versão em segundo plano..."
# Em Kubernetes seria: kubectl set image deployment/...
# No Docker Compose, realizamos o rebuild e restart com zero downtime
$COMPOSE up -d --no-deps --build api-green

echo "Passo 3: Aguardando readiness probe da nova versão responder 200 OK..."
READY=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  # O wget do busybox devolve exit code != 0 para qualquer status fora do 2xx,
  # então não é preciso interpretar o cabeçalho HTTP.
  if $COMPOSE exec -T proxy wget -q -O /dev/null http://api-green:3000/api/readiness 2>/dev/null; then
    echo "  [OK] Nova versão pronta para receber tráfego!"
    READY=1
    break
  fi
  echo "  Aguardando inicialização da nova réplica... ($i/10)"
  sleep 2
done

if [ "$READY" != "1" ]; then
  echo "  [ABORTADO] A readiness probe não ficou verde: o tráfego continua 100% na versão antiga."
  echo "  É exatamente assim que o Kubernetes impede um rollout defeituoso de avançar."
  exit 1
fi

echo "Passo 4: Atualizando o balanceador para incluir a nova versão gradualmente..."
sh "$ROOT/scripts/set-canary.sh" 50

echo "Passo 5: Concluindo a transição para 100% da nova versão..."
sleep 3
sh "$ROOT/scripts/set-canary.sh" 100

echo "=========================================================="
echo "Rolling Update concluído com ZERO DOWNTIME no dashboard!"
echo "=========================================================="
