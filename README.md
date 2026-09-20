# Laboratório Prático: Estratégias Modernas de Implantação e Entrega Contínua

Este projeto foi desenvolvido para ministrar uma aula prática e interativa de **aproximadamente 1 hora** demonstrando as 4 estratégias fundamentais de implantação de software abordadas no Guia de Estudo:

1. **Rolling Update (Atualização Gradual)**
2. **Blue-Green Deployment**
3. **Canary Release**
4. **Feature Flags (Feature Toggles)**

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: [Clojure](https://clojure.org/) (Ring, Reitit, next.jdbc, Cheshire)
- **Frontend**: [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/) + [Vite](https://vitejs.dev/)
- **Orquestração & Proxy**: [Docker Compose](https://docs.docker.com/compose/) + [Nginx](https://nginx.org/)
- **Banco de Dados**: [PostgreSQL 16](https://www.postgresql.org/)
- **Feature Flags**: Modo Duplo (In-Memory / REST e container opcional do [Unleash](https://www.getunleash.io/))
- **Automação**: `Makefile` e Shell Scripts (`.sh`)

---

## 🚀 Como Iniciar

### Pré-requisitos
- Docker e Docker Compose instalados e em execução.
- Git e terminal compatível com `make` e `sh` (Linux, macOS ou Windows via WSL/Git Bash/PowerShell com make).

### 1. Subir o ambiente
```bash
make start
```
Após o build, acesse a interface visual no navegador:
👉 **[http://localhost](http://localhost)**

---

## 🎮 Comandos de Demonstração durante a Aula

| Cenário | Comando | Efeito Observado no Dashboard |
| :--- | :--- | :--- |
| **Status do Ambiente** | `make status` | Exibe containers e configuração ativa do Nginx |
| **Rolling Update** | `make rolling` | Substituição gradual de instâncias com verificação de readiness probe (zero downtime) |
| **Blue-Green (Switch)** | `make switch-green` | Roteia 100% do tráfego para a versão Green (v2.0.0) instantaneamente |
| **Blue-Green (Rollback)** | `make switch-blue` | Reverte 100% do tráfego para a versão Blue (v1.0.0) em milissegundos |
| **Canary 10%** | `make canary-10` | 90% do tráfego vai para Blue e 10% vai para Green |
| **Canary 50%** | `make canary-50` | Divisão 50/50 entre Blue e Green |
| **Canary 100%** | `make canary-100` | Promove Green para 100% |
| **Simular Falha no Canário** | `make fault-v2` | Injeta erro HTTP 500 na v2 para disparar alertas sem derrubar a v1 |
| **Curar Falha** | `make heal-v2` | Restaura a saúde da v2 |
| **Feature Flags (Unleash)** | `make start-unleash` | Sobe o servidor Unleash na porta `4242` ([http://localhost:4242](http://localhost:4242)) |
| **Encerrar Ambiente** | `make stop` | Desliga todos os containers |

---

## 📖 Roteiro Completo do Instrutor
Para conduzir a apresentação minuto a minuto, consulte o documento detalhado:
👉 **[`AULA_ROTEIRO.md`](./AULA_ROTEIRO.md)**
