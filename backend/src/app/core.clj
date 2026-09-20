(ns app.core
  (:gen-class)
  (:require [ring.adapter.jetty :as jetty]
            [reitit.ring :as ring]
            [cheshire.core :as json]
            [app.db :as db]
            [app.flags :as flags]))

;; Estado de falha proposital para simulação de Canary / Rollback
(def fault-injected? (atom false))
(def ready? (atom true))
(def start-time (System/currentTimeMillis))

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
                    :timestamp (str (java.time.Instant/now))})))

(defn health-handler [_req]
  (if @fault-injected?
    (json-response {:status "DOWN" :error "Instancia com falha injetada"} 500)
    (json-response {:status "UP"
                    :version (or (System/getenv "APP_VERSION") "v1.0.0")
                    :color (or (System/getenv "APP_COLOR") "blue")
                    :hostname (get-hostname)})))

(defn readiness-handler [_req]
  (if @ready?
    (json-response {:status "READY" :hostname (get-hostname)})
    (json-response {:status "NOT_READY"} 503)))

(defn toggle-fault-handler [_req]
  (let [new-val (swap! fault-injected? not)]
    (json-response {:fault_injected new-val
                    :hostname (get-hostname)
                    :message (if new-val
                               "Falha simulada ATIVADA nesta instancia."
                               "Falha simulada DESATIVADA nesta instancia.")})))

(defn list-items-handler [_req]
  (json-response {:items (db/list-items)}))

(defn create-item-handler [req]
  (try
    (let [body (slurp (:body req))
          parsed (json/parse-string body true)
          title (:title parsed)]
      (if (and title (not (empty? title)))
        (let [created (db/add-item! title)]
          (json-response {:success true :item created} 201))
        (json-response {:error "Titulo e obrigatorio"} 400)))
    (catch Exception e
      (json-response {:error (.getMessage e)} 500))))

(defn features-handler [_req]
  (json-response (flags/get-all-flags)))

(defn toggle-feature-handler [req]
  (try
    (let [body (slurp (:body req))
          parsed (json/parse-string body true)
          flag (:flag parsed)
          enabled (:enabled parsed)
          result (flags/toggle-local-flag! flag enabled)]
      (if (:success result)
        (json-response result)
        (json-response result 404)))
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
    (prn (str "Iniciando backend Clojure na porta " port "..."))
    (prn (str "Versao: " (or (System/getenv "APP_VERSION") "v1.0.0")
                  " | Cor: " (or (System/getenv "APP_COLOR") "blue")))
    (db/init-db!)
    (jetty/run-jetty app {:port port :join? false})
    (prn (str "Servidor ativo em http://0.0.0.0:" port))))
