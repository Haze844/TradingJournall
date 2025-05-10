-- Einfaches SQL-Skript zum Erstellen der Sessions-Tabelle
-- Diese Tabelle wird für connect-pg-simple benötigt

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_sessions_expire ON sessions (expire);