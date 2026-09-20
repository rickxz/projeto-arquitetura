.PHONY: help start stop status switch-blue switch-green canary-10 canary-25 canary-50 canary-100 fault-v2 heal-v2 rolling start-unleash stop-unleash logs clean

help:
	@echo "=========================================================================="
	@echo "      LABORATÓRIO PRÁTICO: ENTREGA CONTÍNUA E ESTRATÉGIAS DE DEPLOY       "
	@echo "=========================================================================="
	@echo "Comandos de Gerenciamento do Ambiente:"
	@echo "  make start            - Constrói e inicializa todos os containers (Docker)"
	@echo "  make stop             - Encerra todos os containers"
	@echo "  make status           - Exibe status dos containers e upstream ativo no Nginx"
	@echo "  make logs             - Exibe logs em tempo real do proxy e backends"
	@echo ""
	@echo "Cenário 1: Rolling Update (Atualização Gradual com Health Checks)"
	@echo "  make rolling          - Executa demonstração passo a passo de Rolling Update"
	@echo ""
	@echo "Cenário 2: Blue-Green Deployment"
	@echo "  make switch-green     - Transição instantânea de 100% do tráfego para Green (v2)"
	@echo "  make switch-blue      - Rollback instantâneo de 100% do tráfego para Blue (v1)"
	@echo ""
	@echo "Cenário 3: Canary Release (Roteamento Ponderado)"
	@echo "  make canary-10        - Roteia 10% do tráfego para Green (v2) e 90% para Blue (v1)"
	@echo "  make canary-25        - Roteia 25% do tráfego para Green (v2) e 75% para Blue (v1)"
	@echo "  make canary-50        - Roteia 50% do tráfego para Green (v2) e 50% para Blue (v1)"
	@echo "  make canary-100       - Promove Green (v2) para 100% (Rollout concluído)"
	@echo "  make fault-v2         - Injeta erro HTTP 500 na v2 para simular 'canário doente'"
	@echo "  make heal-v2          - Remove a falha injetada na v2"
	@echo ""
	@echo "Cenário 4: Feature Flags (Unleash Opcional)"
	@echo "  make start-unleash    - Inicializa container do Unleash Server (porta 4242)"
	@echo "  make stop-unleash     - Encerra containers do Unleash"
	@echo "=========================================================================="

start:
	docker compose up -d --build
	@echo "==> Aplicação disponível em: http://localhost"

stop:
	docker compose down

status:
	@echo "--- Containers em Execução ---"
	@docker compose ps
	@echo ""
	@echo "--- Configuração Ativa no Nginx ---"
	@cat ./nginx/conf.d/upstream.conf

logs:
	docker compose logs -f proxy api-blue api-green

switch-blue:
	@sh ./scripts/switch-blue.sh

switch-green:
	@sh ./scripts/switch-green.sh

canary-10:
	@sh ./scripts/set-canary.sh 10

canary-25:
	@sh ./scripts/set-canary.sh 25

canary-50:
	@sh ./scripts/set-canary.sh 50

canary-100:
	@sh ./scripts/set-canary.sh 100

fault-v2:
	@sh ./scripts/toggle-fault.sh api-green

heal-v2:
	@sh ./scripts/toggle-fault.sh api-green

rolling:
	@sh ./scripts/rolling-update.sh

start-unleash:
	docker compose -f docker-compose.yml -f docker-compose.unleash.yml up -d unleash unleash-db
	@echo "==> Unleash Server disponível em: http://localhost:4242"

stop-unleash:
	docker compose -f docker-compose.unleash.yml down

clean:
	docker compose down -v
