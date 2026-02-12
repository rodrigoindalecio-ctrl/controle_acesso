-- Adiciona o campo lastChangeType à tabela de eventos
ALTER TABLE events ADD COLUMN lastChangeType TEXT;
-- Opcional: define valor padrão nulo
UPDATE events SET lastChangeType = NULL WHERE lastChangeType IS NULL;