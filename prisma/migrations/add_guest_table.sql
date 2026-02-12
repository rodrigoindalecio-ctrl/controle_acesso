-- Criar tabela de convidados (guests)
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  phone TEXT,
  category TEXT DEFAULT 'outros',
  tableNumber TEXT,
  notes TEXT,
  checkedInAt DATETIME,
  isManual INTEGER DEFAULT 0,
  isChild INTEGER DEFAULT 0,
  childAge INTEGER,
  isPaying INTEGER DEFAULT 1,
  eventId TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE(fullName, eventId)
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_guests_eventId ON guests(eventId);
CREATE INDEX IF NOT EXISTS idx_guests_category ON guests(category);
CREATE INDEX IF NOT EXISTS idx_guests_checkedInAt ON guests(checkedInAt);
