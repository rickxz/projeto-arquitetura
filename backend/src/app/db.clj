(ns app.db
  (:require [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [next.jdbc.sql :as sql]))

(def db-config
  {:dbtype   "postgres"
   :dbname   (or (System/getenv "DB_NAME") "app_db")
   :host     (or (System/getenv "DB_HOST") "db")
   :port     (Integer/parseInt (or (System/getenv "DB_PORT") "5432"))
   :user     (or (System/getenv "DB_USER") "app_user")
   :password (or (System/getenv "DB_PASSWORD") "app_pass")})

;; O dashboard consome as chaves simples (id/title/created_at). Sem este
;; builder o next.jdbc devolve :items/id, :items/title... e o JSON chega no
;; React como "items/title", deixando a lista de registros em branco.
(def query-opts {:builder-fn rs/as-unqualified-maps})

;; Fallback em memória para caso o PostgreSQL esteja indisponível
(def in-memory-items (atom [{:id 1 :title "Primeiro Item (Demo)" :created_at (str (java.time.Instant/now))}]))
(def ^:private in-memory-seq (atom 1))

(def ^:private datasource (delay (jdbc/get-datasource db-config)))

(defn get-datasource []
  (try
    @datasource
    (catch Exception _
      nil)))

(defn- add-in-memory! [title]
  (let [item {:id (swap! in-memory-seq inc)
              :title title
              :created_at (str (java.time.Instant/now))}]
    (swap! in-memory-items conj item)
    item))

(defn connected?
  "Readiness real: só responde true quando o banco aceita uma consulta."
  []
  (boolean
   (try
     (when-let [ds (get-datasource)]
       (jdbc/execute-one! ds ["SELECT 1"] query-opts)
       true)
     (catch Exception _ false))))

(defn init-db!
  "Cria o schema, aguardando o PostgreSQL subir. Devolve true quando conecta."
  ([] (init-db! 15 2000))
  ([attempts delay-ms]
   (loop [remaining attempts]
     (let [result (try
                    (when-let [ds (get-datasource)]
                      (jdbc/execute! ds ["
                        CREATE TABLE IF NOT EXISTS items (
                          id SERIAL PRIMARY KEY,
                          title VARCHAR(255) NOT NULL,
                          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                      "])
                      (println "Banco de dados inicializado com sucesso.")
                      true)
                    (catch Exception e
                      (println "Aguardando PostgreSQL..." (.getMessage e))
                      false))]
       (cond
         result true
         (<= remaining 1) (do (println "Aviso: seguindo com o fallback em memoria.") false)
         :else (do (Thread/sleep delay-ms)
                   (recur (dec remaining))))))))

(def default-limit 20)

(defn list-items
  ([] (list-items default-limit))
  ([limit]
   (try
     (if-let [ds (get-datasource)]
       (jdbc/execute! ds ["SELECT id, title, created_at FROM items ORDER BY id DESC LIMIT ?" limit] query-opts)
       (take limit (reverse @in-memory-items)))
     (catch Exception _
       (take limit (reverse @in-memory-items))))))

(defn count-items []
  (try
    (if-let [ds (get-datasource)]
      (:count (jdbc/execute-one! ds ["SELECT COUNT(*) AS count FROM items"] query-opts))
      (count @in-memory-items))
    (catch Exception _
      (count @in-memory-items))))

(defn add-item! [title]
  (try
    (if-let [ds (get-datasource)]
      (sql/insert! ds :items {:title title} query-opts)
      (add-in-memory! title))
    (catch Exception _
      (add-in-memory! title))))
