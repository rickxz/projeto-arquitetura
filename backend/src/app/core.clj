(ns app.core
  (:gen-class)
  (:require [clojure.string :as str]
            [ring.adapter.jetty :as jetty]
            [reitit.ring :as ring]
            [cheshire.core :as json]
            [app.db :as db]
            [app.flags :as flags]))

;; Estado de falha proposital para simulação de Canary / Rollback
(def fault-injected? (atom false))
(def ready? (atom false))
(def start-time (System/currentTimeMillis))

(def ^:private max-title-length 255)

(defn get-hostname []
  (try
    (.getHostName (java.net.InetAddress/getLocalHost))
    (catch Exception _ "unknown-host")))

(defn json-response
  ([data] (json-response data 200))
  ([data status]
   {:status status
    :headers {"Content-Type" "application/json; charset=utf-8"
              "Access-Control-Allow-Origin" "*"
              "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
              "Access-Control-Allow-Headers" "Content-Type, Authorization"}
    :body (json/generate-string data)}))

(def ^:private invalid-body ::invalid-body)

(defn- parse-json-body
  "Devolve o corpo JSON como mapa, nil quando não há corpo, ou ::invalid-body
  quando o JSON é inválido - erro do cliente, não do servidor."
  [req]
  (if-let [body (:body req)]
    (let [raw (slurp body)]
      (when-not (str/blank? raw)
        (try
          (let [parsed (json/parse-string raw true)]
            (if (map? parsed) parsed invalid-body))
          (catch Exception _ invalid-body))))
    nil))

(def ^:private degraded-limit 5)

(defn- active-behaviour
  "Efeito de cada feature flag na resposta da API. É o que permite mostrar em
  aula que o comportamento muda sem novo deploy (Seção 6 do Guia)."
  []
  {:checkout (if (flags/enabled? "new_checkout") "em-etapas" "classico")
   :layout   (if (flags/enabled? "modern_layout") "moderno" "classico")
   :discount (if (flags/enabled? "vip_discount") 20 0)
   :degraded (flags/enabled? "ops_degraded_mode")})

;; Handlers
(defn version-handler [_req]
  (if @fault-injected?
    (json-response {:status "error"
                    :error "Falha proposital ativada para simulacao de Canary!"
                    :version (or (System/getenv "APP_VERSION") "v1.0.0")
                    :color (or (System/getenv "APP_COLOR") "blue")
                    :hostname (get-hostname)}
                   500)
    (json-response {:version   (or (System/getenv "APP_VERSION") "v1.0.0")
                    :color     (or (System/getenv "APP_COLOR") "blue")
                    :hostname  (get-hostname)
                    :uptime_ms (- (System/currentTimeMillis) start-time)
                    :timestamp (str (java.time.Instant/now))
                    :behaviour (active-behaviour)})))

(defn health-handler [_req]
  (if @fault-injected?
    (json-response {:status "DOWN" :error "Instancia com falha injetada"} 500)
    (json-response {:status "UP"
                    :version (or (System/getenv "APP_VERSION") "v1.0.0")
                    :color (or (System/getenv "APP_COLOR") "blue")
                    :hostname (get-hostname)})))

(defn readiness-handler [_req]
  ;; Readiness = "já posso receber tráfego?". Enquanto o banco não responde a
  ;; instância fica 503 e o rolling update não a promove (Seção 2.5 do Guia).
  (if @ready?
    (json-response {:status "READY" :database "up" :hostname (get-hostname)})
    (json-response {:status "NOT_READY" :database "connecting" :hostname (get-hostname)} 503)))

(defn toggle-fault-handler [req]
  (try
    (let [parsed (parse-json-body req)
          _ (when (= parsed invalid-body)
              (throw (ex-info "JSON invalido" {})))
          desired (:enabled parsed)
          new-val (if (nil? desired)
                    (swap! fault-injected? not)
                    (reset! fault-injected? (boolean desired)))]
      (json-response {:fault_injected new-val
                      :hostname (get-hostname)
                      :message (if new-val
                                 "Falha simulada ATIVADA nesta instancia."
                                 "Falha simulada DESATIVADA nesta instancia.")}))
    (catch Exception e
      (json-response {:error (str "Corpo invalido: " (.getMessage e))} 400))))

(defn list-items-handler [_req]
  ;; Ops Toggle: em modo degradado a consulta é encurtada para aliviar o banco.
  (let [degraded? (flags/enabled? "ops_degraded_mode")
        limit     (if degraded? degraded-limit db/default-limit)]
    (json-response (cond-> {:items (db/list-items limit)
                            :total (db/count-items)
                            :limit limit
                            :degraded degraded?}
                     (flags/enabled? "vip_discount") (assoc :discount_percent 20)))))

(defn create-item-handler [req]
  (try
    (let [parsed (parse-json-body req)
          raw-title (:title parsed)]
      (cond
        (= parsed invalid-body)
        (json-response {:error "Corpo da requisicao nao e um JSON valido"} 400)

        (and (some? raw-title) (not (string? raw-title)))
        (json-response {:error "Titulo deve ser texto"} 400)

        :else
        (let [title (some-> raw-title str/trim)]
          (cond
            (str/blank? title)
            (json-response {:error "Titulo e obrigatorio"} 400)

            (> (count title) max-title-length)
            (json-response {:error (str "Titulo deve ter no maximo " max-title-length " caracteres")} 400)

            :else
            (json-response {:success true :item (db/add-item! title)} 201)))))
    (catch Exception e
      (json-response {:error (.getMessage e)} 500))))

(defn features-handler [_req]
  (json-response (flags/get-all-flags)))

(defn toggle-feature-handler [req]
  (try
    (let [parsed (parse-json-body req)
          flag (:flag parsed)
          enabled (:enabled parsed)]
      (cond
        (or (= parsed invalid-body) (nil? parsed))
        (json-response {:error "Informe {\"flag\": nome, \"enabled\": true|false}"} 400)

        (not (flags/known-flag? flag))
        (json-response {:success false :error (str "Flag " flag " nao encontrada.")} 404)

        (not (boolean? enabled))
        (json-response {:error "O campo 'enabled' deve ser true ou false"} 400)

        :else
        (json-response (flags/toggle-local-flag! flag enabled))))
    (catch Exception e
      (json-response {:error (.getMessage e)} 500))))

(defn options-handler [_req]
  {:status 204
   :headers {"Access-Control-Allow-Origin" "*"
             "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
             "Access-Control-Allow-Headers" "Content-Type, Authorization"}})

(def app
  (ring/ring-handler
   (ring/router
    [["/api"
      ["/version" {:get version-handler :options options-handler}]
      ["/health" {:get health-handler :options options-handler}]
      ["/readiness" {:get readiness-handler :options options-handler}]
      ["/fault/toggle" {:post toggle-fault-handler :options options-handler}]
      ["/items" {:get list-items-handler
                 :post create-item-handler
                 :options options-handler}]
      ["/features" {:get features-handler :options options-handler}]
      ["/features/toggle" {:post toggle-feature-handler :options options-handler}]]])
   (ring/create-default-handler)))

(defn -main [& _args]
  (let [port (Integer/parseInt (or (System/getenv "PORT") "3000"))]
    (println (str "Iniciando backend Clojure na porta " port "..."))
    (println (str "Versao: " (or (System/getenv "APP_VERSION") "v1.0.0")
                  " | Cor: " (or (System/getenv "APP_COLOR") "blue")))
    (let [server (jetty/run-jetty app {:port port :join? false})]
      (println (str "Servidor ativo em http://0.0.0.0:" port))
      ;; A conexão com o banco roda em paralelo: a porta já aceita requisições,
      ;; mas /api/readiness só fica verde quando o PostgreSQL responde.
      (future
        (loop []
          (if (db/init-db!)
            (reset! ready? true)
            (do (Thread/sleep 5000)
                (recur)))))
      (.join server))))
