-- ═══════════════════════════════════════════════════════════════════════════
-- Fanta Oratorio — Migrazione "Capitano"
-- Esegui questo script in Supabase → SQL Editor (Dashboard del progetto)
--
-- È SICURO ED ADDITIVO:
--  - non cancella né modifica righe esistenti
--  - usa IF NOT EXISTS / ON CONFLICT DO NOTHING ovunque possibile
--  - segue lo stesso pattern di sicurezza già in uso nelle altre tabelle
--    del progetto (RLS disabilitata, accesso tramite anon key pubblica)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Nuova colonna sulla tabella "giocatori" già esistente.
--    Memorizza quale ruolo della formazione è il capitano per quella squadra,
--    es. 'educatore' | 'animatore1' | 'animatore2' | 'pre animatore' | 'amico san carlo'.
--    Se la colonna esiste già, questo comando non fa nulla.
ALTER TABLE giocatori ADD COLUMN IF NOT EXISTS capitano TEXT;

-- 2) Nuova tabella "impostazioni": un'unica riga (id = 1) con:
--    - capitano_attivo: flag che abilita/disabilita il bottone "Imposta capitano"
--    - giorno_capitano: il giorno (numero) in cui il capitano prende doppi punti
CREATE TABLE IF NOT EXISTS impostazioni (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  capitano_attivo  BOOLEAN NOT NULL DEFAULT FALSE,
  giorno_capitano  INTEGER,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT impostazioni_singleton CHECK (id = 1)
);

-- Riga di default: creata solo se non esiste già (non sovrascrive nulla)
INSERT INTO impostazioni (id, capitano_attivo, giorno_capitano)
VALUES (1, FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- Stessa policy di sicurezza già usata per "regolamento" e "bonus_malus_live"
ALTER TABLE impostazioni DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- Dopo aver eseguito questo script:
--  - il flag parte disattivato (capitano_attivo = FALSE)
--  - nessuna squadra ha ancora un capitano (capitano = NULL)
--  - tutti i punteggi esistenti restano invariati
-- ═══════════════════════════════════════════════════════════════════════════
