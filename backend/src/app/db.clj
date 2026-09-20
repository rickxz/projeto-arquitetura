(ns app.db
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]))

(def db-config
  {:dbtype   "postgres"
   :dbname   (or (System/getenv "DB_NAME") "app_db")
   :host     (or (System/getenv "DB_HOST") "db")
   :port     (Integer/parseInt (or (System/getenv "DB_PORT") "5432"))
   :user     (or (System/getenv "DB_USER") "app_user")
   :password (or (System/getenv "DB_PASSWORD") "app_pass")})

;; Fallback em memória para caso o DB ainda esteja inicializando
(def in-memory-items (atom [{:id 1 :title "Primeiro Item (Demo)" :created_at (str (java.time.Instant/now))}]))

(defn get-datasource []
  (try
    (jdbc/get-datasource db-config)
    (catch Exception _
      nil)))

(defn init-db! []
  (try
    (let [ds (get-datasource)]
      (when ds
        (jdbc/execute! ds ["
          CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        "])
        (println "Banco de dados inicializado com sucesso.")))
    (catch Exception e
      (println "Aviso: Nao foi possivel conectar ao PostgreSQL imediatamente, usando fallback em memoria." (.getMessage e)))))

(defn list-items []
  (try
    (let [ds (get-datasource)]
      (if ds
        (jdbc/execute! ds ["SELECT id, title, created_at FROM items ORDER BY id DESC LIMIT 20"])
        @in-memory-items))
    (catch Exception _
      @in-memory-items)))

(defn add-item! [title]
  (try
    (let [ds (get-datasource)]
      (if ds
        (sql/insert! ds :items {:title title})
        (let [new-id (inc (count @in-memory-items))
              item   {:id new-id :title title :created_at (str (java.time.Instant/now))}]
          (swap! in-memory-items conj item)
          item)))
    (catch Exception _
      (let [new-id (inc (count @in-memory-items))
            item   {:id new-id :title title :created_at (str (java.time.Instant/now))}]
        (swap! in-memory-items conj item)
        item))))
