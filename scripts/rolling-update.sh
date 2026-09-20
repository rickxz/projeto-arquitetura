#!/bin/sh
# Demonstração de Rolling Update gradual (Capítulo 3 do Guia)
echo "=========================================================="
echo "    DEMONSTRAÇÃO DE ROLLING UPDATE (ATUALIZAÇÃO GRADUAL)  "
echo "=========================================================="
echo "Conceito: Em vez de trocar tudo de uma vez (Big Bang),"
echo "substituímos instâncias uma a uma, verificando a saúde"
echo "(readiness probe) antes de desligar as versões antigas."
echo "----------------------------------------------------------"

echo "Passo 1: Verificando a saúde da versão atual..."
docker compose exec proxy wget -qO- http://api-blue:3000/api/health
echo ""

echo "Passo 2: Subindo réplicas da nova versão em segundo plano..."
# Em Kubernetes seria: kubectl set image deployment/...
# No Docker Compose, realizamos o rebuild e restart com zero downtime
docker compose up -d --no-deps --build api-green

echo "Passo 3: Aguardando readiness probe da nova versão responder 200 OK..."
for i in 1 2 3 4 5; do
  STATUS=$(docker compose exec proxy wget -q -S -O /dev/null http://api-green:3000/api/readiness 2>&1 | grep "HTTP/" | awk '{print $2}')
  if [ "$STATUS" = "200" ]; then
    echo "  [OK] Nova versão pronta para receber tráfego!"
    break
  fi
  echo "  Aguardando inicialização da nova réplica... ($i/5)"
  sleep 2
done

echo "Passo 4: Atualizando o balanceador para incluir a nova versão gradualmente..."
./scripts/set-canary.sh 50

echo "Passo 5: Concluindo a transição para 100% da nova versão..."
sleep 3
./scripts/set-canary.sh 100

echo "=========================================================="
echo "Rolling Update concluído com ZERO DOWNTIME no dashboard!"
echo "=========================================================="
