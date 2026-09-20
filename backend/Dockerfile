FROM clojure:temurin-21-alpine

WORKDIR /app

# Copia deps.edn e faz download antecipado das dependências para cache do Docker
COPY deps.edn /app/
RUN clj -P

# Copia o código fonte e recursos
COPY src /app/src
COPY resources /app/resources

EXPOSE 3000

ENV PORT=3000
ENV APP_VERSION=v1.0.0
ENV APP_COLOR=blue

CMD ["clj", "-M:run"]
