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
         "ops_degraded_mode" {:enabled false :type "ops"        :description "Desliga busca pesada durante pico de tráfego"}}))

(def unleash-url (or (System/getenv "UNLEASH_URL") "http://unleash:4242/api/client/features"))
(def unleash-token (or (System/getenv "UNLEASH_API_TOKEN") "*:default.1234567890abcdef"))

(defn query-unleash []
  (try
    (let [client  (.. (HttpClient/newBuilder)
                      (connectTimeout (Duration/ofSeconds 2))
                      build)
          request (.. (HttpRequest/newBuilder)
                      (uri (URI/create unleash-url))
                      (header "Authorization" unleash-token)
                      (header "Accept" "application/json")
                      (timeout (Duration/ofSeconds 2))
                      GET
                      build)
          response (.send client request (HttpResponse$BodyHandlers/ofString))]
      (if (= 200 (.statusCode response))
        {:status "connected"
         :data (json/parse-string (.body response) true)}
        {:status "error"
         :code (.statusCode response)}))
    (catch Exception e
      {:status "unavailable"
       :message (.getMessage e)})))

(defn get-all-flags []
  (let [unleash-info (query-unleash)]
    {:mode "dual"
     :local @local-flags
     :unleash {:configured (some? (System/getenv "UNLEASH_URL"))
               :connection (:status unleash-info)
               :features (get-in unleash-info [:data :features] [])}}))

(defn toggle-local-flag! [flag-name enabled]
  (if (contains? @local-flags flag-name)
    (do
      (swap! local-flags update-in [flag-name :enabled] (constantly (boolean enabled)))
      {:success true :flag flag-name :enabled (get-in @local-flags [flag-name :enabled])})
    {:success false :error (str "Flag " flag-name " nao encontrada.")}))
