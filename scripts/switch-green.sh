#!/bin/sh
# Direciona 100% do tráfego para a versão Green (v2)
echo "==> [Blue-Green] Apontando tráfego para Green (v2)..."
cp ./nginx/upstreams/green.conf ./nginx/conf.d/upstream.conf
docker compose exec proxy nginx -s reload
echo "==> [OK] Tráfego 100% no Green! (Deploy concluído com zero downtime)"
