(ns app.flags
  (:require [cheshire.core :as json])
  (:import (java.net URI)
           (java.net.http HttpClient HttpRequest HttpResponse$BodyHandlers)
           (java.time Duration)))

;; Estado local das Feature Flags (Modo Embutido)
(def local-flags
  (atom {"new_checkout"      {:enabled false :type "release"    :description "Nova tela de checkout em etapas"}
         "modern_layout"     {:enabled false :type "experiment" :description "Layout moderno com gradiente e novos cards"}
         "vip_discount"      {:enabled false :type "permission" :description "Cupom VIP de 20% para clientes selecionados"}
         "ops_degraded_mode" {:enabled false :type "ops"        :description "Desliga busca pesada durante pico de trafego"}}))

(def unleash-url (or (System/getenv "UNLEASH_URL") "http://unleash:4242/api/client/features"))
(def unleash-token (or (System/getenv "UNLEASH_API_TOKEN") "*:default.1234567890abcdef"))

;; Um HttpClient por processo: cada build cria selector thread e pool proprios.
(def ^:private http-client
  (delay (.. (HttpClient/newBuilder)
             (connectTimeout (Duration/ofSeconds 2))
             build)))

(def ^:private cache-ttl-ms 10000)
(def ^:private unleash-state (atom {:status "unknown"}))
(def ^:private last-refresh (atom 0))
(def ^:private refreshing? (atom false))

(defn- fetch-unleash []
  (try
    (let [request  (.. (HttpRequest/newBuilder)
                       (uri (URI/create unleash-url))
                       (header "Authorization" unleash-token)
                       (header "Accept" "application/json")
                       (timeout (Duration/ofSeconds 2))
                       GET
                       build)
          response (.send @http-client request (HttpResponse$BodyHandlers/ofString))]
      (if (= 200 (.statusCode response))
        {:status "connected"
         :data (json/parse-string (.body response) true)}
        {:status "error"
         :code (.statusCode response)}))
    (catch Exception e
      {:status "unavailable"
       :message (.getMessage e)})))

(defn- refresh-unleash!
  "Atualiza o cache fora da thread da requisicao. Quando o Unleash nao esta no
  ar, a resolucao de DNS do host chega a travar segundos - tempo suficiente
  para o Nginx cortar a chamada com 504 se ela fosse feita de forma sincrona."
  []
  (let [now (System/currentTimeMillis)]
    (when (and (> (- now @last-refresh) cache-ttl-ms)
               (compare-and-set! refreshing? false true))
      (future
        (try
          (reset! unleash-state (fetch-unleash))
          (finally
            (reset! last-refresh (System/currentTimeMillis))
            (reset! refreshing? false)))))))

(defn query-unleash []
  (refresh-unleash!)
  @unleash-state)

(defn get-all-flags []
  (let [unleash-info (query-unleash)]
    {:mode "dual"
     :local @local-flags
     :unleash {:configured (some? (System/getenv "UNLEASH_URL"))
               :connection (:status unleash-info)
               :features (get-in unleash-info [:data :features] [])}}))

(defn toggle-local-flag! [flag-name enabled]
  (if (contains? @local-flags flag-name)
    (let [updated (swap! local-flags assoc-in [flag-name :enabled] (boolean enabled))]
      {:success true :flag flag-name :enabled (get-in updated [flag-name :enabled])})
    {:success false :error (str "Flag " flag-name " nao encontrada.")}))
