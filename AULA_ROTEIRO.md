# Roteiro da Aula Prática: Entrega Contínua e Implantação (60 Minutos)

Este documento é o guia completo para o instrutor conduzir a aula prática de 1 hora, cobrindo todos os cenários do **Guia de Estudo: Blue-Green, Canary, Rolling Update e Feature Flags**.

---

## Estrutura da Apresentação e Cronograma

```text
+------------------+------------------+------------------+------------------+------------------+
|  00 - 10 min     |  10 - 22 min     |  22 - 35 min     |  35 - 48 min     |  48 - 60 min     |
|  Setup & Conceito|  Rolling Update  |  Blue-Green      |  Canary Release  |  Feature Flags   |
|  Deploy x Release|  Health Checks   |  Switch & Schema |  Métricas & Falha|  Knight Capital  |
+------------------+------------------+------------------+------------------+------------------+
```

---

## ⏱️ Bloco 1: Setup & Conceitos Fundamentais (00 - 10 min)

### 1. Contextualização Teórica
- **O problema do "Big Bang Deploy" (Seção 1.3 do Guia)**:
  - Explicar o modelo antigo: desligar tudo de madrugada, instalar nova versão, rezar para funcionar.
  - As 3 dores clássicas: **Downtime** (indisponibilidade), **Risco Concentrado** (100% dos usuários afetados de uma vez) e **Rollback lento e estressante**.
- **A distinção crucial: Deploy vs Release (Seção 2.1 do Guia)**:
  - *Deploy*: Ato técnico de colocar o código rodando nos servidores/containers.
  - *Release*: Tornar a funcionalidade visível para o usuário de negócio.

### 2. Comandos do Instrutor
```bash
# Inicializar todo o ambiente (Proxy Nginx, Clojure API v1, Clojure API v2, React Front, Postgres)
make start
```

### 3. O que demonstrar na tela
- Abra o navegador em: **`http://localhost`**.
- Mostre o **Dashboard de Tráfego**:
  - As requisições contínuas estão sendo atendidas 100% pela versão **Blue (v1.0.0)**.
  - Mostre a latência, o hostname do container e a taxa de sucesso de 100%.

---

## ⏱️ Bloco 2: Cenário 1 - Rolling Update (10 - 22 min)

### 1. Contextualização Teórica (Seção 3 do Guia)
- **Origem e Padrão da Indústria**: É a estratégia padrão do Kubernetes e do Borg (Google).
- **Como funciona**: Substituição progressiva de réplicas antigas por novas.
- **Conceito Chave - Health Checks (Seção 2.5)**:
  - *Liveness Probe*: A aplicação travou? Se sim, reinicia.
  - *Readiness Probe*: A aplicação já se conectou ao banco e está pronta para receber tráfego? Sem readiness probe, o Rolling Update enviaria requisições para um container que ainda está iniciando!

### 2. Comandos do Instrutor
```bash
# Executa a demonstração automatizada de Rolling Update com verificação de readiness probe
make rolling
```

### 3. O que observar no Dashboard
- O fluxo de requisições **não é interrompido em nenhum momento (Zero Downtime)**.
- Gradualmente, novas instâncias respondem com `v2.0.0` enquanto as antigas são drenadas.
- **Pergunta para os alunos**: *"Durante a transição, duas versões convivem em produção. O que acontece se a v2 esperar um formato de dados incompatível com a v1?"* (Gancho para a discussão de contratos e compatibilidade).

---

## ⏱️ Bloco 3: Cenário 2 - Blue-Green Deployment (22 - 35 min)

### 1. Contextualização Teórica (Seção 4 do Guia)
- **Dois ambientes de produção completos**: Blue (v1 - ativo) e Green (v2 - ocioso/validação).
- **Vantagem absoluta**: Rollback instantâneo (tempo de recarga do DNS/proxy: milissegundos).
- **Desafio do Banco de Dados (Página 10)**:
  - O banco de dados PostgreSQL é compartilhado.
  - Mudanças de schema precisam ser aditivas (retrocompatíveis) para não quebrar o Blue caso seja necessário fazer rollback.

### 2. Comandos do Instrutor
```bash
# 1. Alterne instantaneamente o tráfego de Blue (v1) para Green (v2)
make switch-green
```
- No Dashboard: O indicador de tráfego vira imediatamente para **100% Green (v2.0.0)**.

```bash
# 2. Teste de persistência: adicione um item no formulário do banco na interface
# e em seguida simule que a versão v2 apresentou um bug inesperado:
make switch-blue
```
- No Dashboard: Rollback imediato para **Blue (v1.0.0)**. Os dados cadastrados na v2 continuam salvos no PostgreSQL!

---

## ⏱️ Bloco 4: Cenário 3 - Canary Release (35 - 48 min)

### 1. Contextualização Teórica (Seção 5 do Guia)
- **A metáfora do Canário na Mina de Carvão**: O pássaro detectava gases venenosos antes de afetar os mineiros. No software, uma pequena fatia de tráfego real (ex: 10%) testa a nova versão.
- **Dependência de Observabilidade (Seção 2.4)**: Canary só funciona com métricas em tempo real. Se não houver monitoramento, você não sabe se o canário está doente!
- **Exemplo Real**: Netflix e a ferramenta open-source Kayenta (Seção 9.1).

### 2. Comandos do Instrutor
```bash
# 1. Direcionar apenas 10% do tráfego para a versão v2 (Green)
make canary-10
```
- No Dashboard: O gráfico de proporção mostrará aproximadamente **90% Blue / 10% Green**.

```bash
# 2. Injetar uma falha simulada na v2 para ver o "canário adoecer"
make fault-v2
```
- No Dashboard:
  - Apenas a fatia de 10% começa a gerar respostas HTTP 500 (vermelho).
  - 90% dos usuários continuam navegando perfeitamente em Blue sem interrupção!
  - Isso demonstra a contenção de risco do Canary.

```bash
# 3. Decisão operacional: Abortar e reverter para Blue
make switch-blue

# Ou curar a falha e avançar no rollout:
make heal-v2
make canary-50
make canary-100
```

---

## ⏱️ Bloco 5: Cenário 4 - Feature Flags (48 - 60 min)

### 1. Contextualização Teórica (Seção 6 do Guia)
- **Atuação no nível do código**: Em vez de rotear tráfego no Nginx, a lógica condicional está dentro da API Clojure.
- **Os 4 Tipos de Toggles (Seção 6.2)**:
  1. *Release Toggle*: Esconde recurso em desenvolvimento (ex: nova tela de checkout).
  2. *Experiment Toggle*: Teste A/B de conversão (ex: botão ou layout diferente).
  3. *Permission Toggle*: Recursos liberados por perfil/plano (ex: desconto VIP).
  4. *Ops Toggle*: Disjuntor de emergência para aliviar carga no banco de dados.
- **O Desastre da Knight Capital (Seção 9.5)**:
  - Em 2012, a empresa perdeu **US$ 460 milhões em 45 minutos** por conta de uma flag esquecida no código que reativou um algoritmo obsoleto ("Power Peg").
  - Lição: Feature flags precisam ter ciclo de vida e serem removidas quando a funcionalidade estiver estável!

### 2. Demonstração Prática
- No Dashboard, vá até o card **Feature Flags**:
  - Ligue o toggle **`new_checkout`** ou **`modern_layout`**.
  - Demonstre que o comportamento do backend mudou **sem reiniciar nenhum container e sem novo deploy**.
  - Ligue o **`ops_degraded_mode`** para demonstrar o disjuntor de emergência.

```bash
# (Opcional - Ferramenta Corporativa): Subir o Unleash oficial
make start-unleash
# Acesse http://localhost:4242 (login padrão criado pelo container)
```

---

## 📊 Tabela Comparativa Resumo (Para Encerramento)

Apresente esta tabela aos alunos para consolidar a escolha arquitetural de cada cenário:

| Estratégia | Velocidade de Rollback | Custo de Infra | Controle de Tráfego | Complexidade | Quando Usar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Rolling Update** | Média (gradual) | Baixo (1x) | Nenhum (apenas réplicas) | Baixa | Padrão do Kubernetes, simplicidade |
| **Blue-Green** | Instantânea (milissegundos) | Alto (2x) | Tudo ou nada (100%) | Média | Sistemas críticos onde rollback rápido é vital |
| **Canary** | Rápida | Médio | Fino (percentual gradual) | Alta | Mudanças de alto risco com boa observabilidade |
| **Feature Flags** | Instantânea | Baixo (1x) | Por usuário / plano / regra | Média | Desacoplar regras de negócio do deploy técnico |

---

## Comandos Úteis de Encerramento
```bash
# Para verificar status dos containers
make status

# Para desligar todo o ambiente após a aula
make stop

# Para limpar volumes
make clean
```
