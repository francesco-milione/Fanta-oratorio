-- ═══════════════════════════════════════════════════════════════════════════
-- Fanta Oratorio — Migrazione "Giocatore Extra"
-- Esegui questo script in Supabase → SQL Editor (Dashboard del progetto)
--
-- È SICURO ED ADDITIVO:
--  - non cancella né modifica righe esistenti
--  - usa IF NOT EXISTS ovunque possibile
--  - segue lo stesso pattern già usato per la funzionalità "Capitano"
--    (vedi supabase_migrazione_capitano.sql)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Nuova colonna sulla tabella "giocatori" già esistente.
--    Memorizza l'id del personaggio scelto (o assegnato a caso) come
--    "giocatore extra", in aggiunta alla formazione titolare.
ALTER TABLE giocatori ADD COLUMN IF NOT EXISTS giocatore_extra TEXT;

-- 2) Nuove colonne sulla tabella "impostazioni" (già creata dalla migrazione
--    "Capitano"). Se la tabella non esiste ancora, questo blocco la crea.
CREATE TABLE IF NOT EXISTS impostazioni (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  capitano_attivo  BOOLEAN NOT NULL DEFAULT FALSE,
  giorno_capitano  INTEGER,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT impostazioni_singleton CHECK (id = 1)
);

INSERT INTO impostazioni (id, capitano_attivo, giorno_capitano)
VALUES (1, FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- extra_attivo:    flag che abilita/disabilita per tutti il bottone
--                  "Scegli il tuo giocatore extra"
-- extra_deadline:  data/ora di chiusura della scelta. Dopo questo momento,
--                  al primo caricamento dell'app ogni squadra senza scelta
--                  riceve automaticamente un giocatore extra casuale
--                  (tra tutti, tranne il proprio personaggio e chi ha già
--                  nella propria formazione titolare — nessuna esclusività
--                  tra squadre diverse).
ALTER TABLE impostazioni ADD COLUMN IF NOT EXISTS extra_attivo    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE impostazioni ADD COLUMN IF NOT EXISTS extra_deadline  TIMESTAMPTZ;

-- extra_giorno_da: i bonus/malus del giocatore extra contano nel punteggio
--                  solo dalla giornata indicata in poi (le giornate precedenti
--                  a quando lo slot extra è stato introdotto non contano).
--                  Lascia NULL per contare tutto lo storico.
ALTER TABLE impostazioni ADD COLUMN IF NOT EXISTS extra_giorno_da INTEGER;

-- Stessa policy di sicurezza già usata per le altre tabelle
ALTER TABLE impostazioni DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- Dopo aver eseguito questo script:
--  - il flag parte disattivato (extra_attivo = FALSE)
--  - nessuna squadra ha ancora un giocatore extra (giocatore_extra = NULL)
--  - tutti i punteggi esistenti restano invariati
--
-- Per attivare la funzione:
--  1. Vai su Admin → tab "🎁 Extra"
--  2. Imposta la data/ora di chiusura (es. domani alle 16:00)
--  3. Imposta la giornata da cui contano i punti (es. Giornata 8)
--  4. Attiva il flag: ogni squadra vedrà il bottone per scegliere
--  5. Dopo la chiusura, chi non ha scelto riceve un giocatore casuale
--     (automaticamente al primo accesso, oppure subito con il bottone
--     "Assegna a chi non ha scelto" nel pannello Admin)
-- ═══════════════════════════════════════════════════════════════════════════
