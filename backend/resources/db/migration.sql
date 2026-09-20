-- Schema inicial da aplicação
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserção de dados de exemplo para demonstrar persistência
INSERT INTO items (title) 
VALUES ('Item Inicial (Criado antes do Deploy v1)')
ON CONFLICT DO NOTHING;
