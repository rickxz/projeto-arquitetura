#!/bin/sh
# Direciona 100% do tráfego para a versão Blue (v1)
echo "==> [Blue-Green] Apontando tráfego para Blue (v1)..."
cp ./nginx/upstreams/blue.conf ./nginx/conf.d/upstream.conf
docker compose exec proxy nginx -s reload
echo "==> [OK] Tráfego 100% no Blue! (Rollback instantâneo concluído)"
