# ⛪ Fanta Oratorio

Sito web per il gioco del Fanta Oratorio durante il campo estivo.
Ogni partecipante ha una squadra con 1 educatore, 2 animatori e 3 bambini.
I punteggi vengono calcolati automaticamente dai file CSV caricati.

---

## 🚀 Come usarlo

### 1. Fork/Import del progetto su GitLab
Crea un nuovo progetto su GitLab e carica tutti i file.
GitLab Pages si attiverà automaticamente ad ogni push sul branch `main`.

### 2. URL del sito
Dopo il primo deploy, il sito sarà disponibile su:
`https://<tuo-username>.gitlab.io/<nome-progetto>/`

### 3. Aggiornare i dati
Basta modificare i file CSV nella cartella `public/data/` e fare push.
Il sito si aggiorna entro pochi minuti (tempo di build GitLab CI).

---

## 📁 Struttura dei file CSV

Tutti i file CSV vanno in `public/data/`.

---

### `personaggi.csv`
Lista di tutti i personaggi partecipanti.

| Colonna | Descrizione | Esempio |
|---------|-------------|---------|
| `id` | Identificativo univoco (usato negli altri CSV) | `EDU001`, `ANI001`, `BAM001` |
| `nome` | Nome del personaggio | `Don Marco`, `Giulia` |
| `ruolo` | Ruolo: `educatore`, `animatore`, `bambino` | `educatore` |
| `squadra_immagine` | Opzionale: URL immagine avatar | *(lasciare vuoto)* |

**Convenzione ID consigliata:**
- Educatori: `EDU001`, `EDU002`, …
- Animatori: `ANI001`, `ANI002`, …
- Bambini: `BAM001`, `BAM002`, …

```csv
id,nome,ruolo,squadra_immagine
EDU001,Don Marco,educatore,
ANI001,Giulia,animatore,
BAM001,Tommy,bambino,
```

---

### `giocatori.csv`
Un giocatore per riga. Contiene il **codice segreto** e la squadra scelta.

| Colonna | Descrizione | Esempio |
|---------|-------------|---------|
| `codice` | Codice segreto per il login (consegnato a voce) | `ALFA2026` |
| `nome_squadra` | Nome della squadra scelto dal giocatore | `Gli Invincibili` |
| `proprietario` | Nome del partecipante reale | `Alberto R.` |
| `educatore` | ID dell'educatore scelto | `EDU001` |
| `animatore1` | ID del primo animatore | `ANI001` |
| `animatore2` | ID del secondo animatore | `ANI003` |
| `bambino1` | ID del primo bambino | `BAM001` |
| `bambino2` | ID del secondo bambino | `BAM003` |
| `bambino3` | ID del terzo bambino | `BAM005` |

```csv
codice,nome_squadra,proprietario,educatore,animatore1,animatore2,bambino1,bambino2,bambino3
ALFA2026,Gli Invincibili,Alberto R.,EDU001,ANI001,ANI003,BAM001,BAM003,BAM005
```

> ⚠️ Il codice è **case-insensitive** (ALFA2026 = alfa2026).
> Tienilo segreto e consegnalo a voce ad ogni partecipante.

---

### `votazioni.csv`
Voti base giornalieri per ogni personaggio (tipo pagella).

| Colonna | Descrizione | Esempio |
|---------|-------------|---------|
| `id_personaggio` | ID del personaggio | `EDU001` |
| `giorno` | Numero del giorno (1, 2, 3, …) | `1` |
| `voto_base` | Voto in decimali (es. 6.5, 8, 7.5) | `7.5` |

```csv
id_personaggio,giorno,voto_base
EDU001,1,7.5
ANI001,1,6.5
BAM001,1,8.0
```

> Aggiungi una riga per ogni personaggio ogni giorno.
> Se un personaggio non ha voto per un giorno, non inserire la riga.

---

### `bonus_malus.csv`
Bonus e malus giornalieri per eventi specifici.

| Colonna | Descrizione | Esempio |
|---------|-------------|---------|
| `id_personaggio` | ID del personaggio | `ANI004` |
| `giorno` | Numero del giorno | `1` |
| `punti` | Punti (positivi con +, negativi senza) | `+3` o `-2` |
| `descrizione` | Descrizione dell'evento | `Ha organizzato il gioco finale` |
| `tipo` | `bonus` o `malus` | `bonus` |

```csv
id_personaggio,giorno,punti,descrizione,tipo
EDU001,1,+3,Ha organizzato il gioco finale,bonus
ANI003,1,-1,In ritardo alla preghiera,malus
BAM006,1,+2,Ha aiutato un compagno,bonus
```

> Puoi aggiungere più righe per lo stesso personaggio nello stesso giorno.

---

## 🔢 Come viene calcolato il punteggio

**Punteggio personaggio** = Somma voti base + Somma bonus/malus

**Punteggio squadra** = Somma punteggi di tutti e 6 i personaggi della squadra

---

## 🔄 Flusso di aggiornamento giornaliero

1. A fine giornata, assegna i voti in `votazioni.csv`
2. Aggiungi gli eventi in `bonus_malus.csv`
3. Fai `git add . && git commit -m "Giorno X" && git push`
4. Dopo ~2 minuti il sito è aggiornato

---

## 🛠 Sviluppo locale

```bash
npm install
npm start
```

Il sito si apre su `http://localhost:3000`.

Per il build di produzione:
```bash
npm run build
```

---

## 📋 Configurazione GitLab Pages

Il file `.gitlab-ci.yml` è già configurato.
Assicurati che nel tuo progetto GitLab sia attivato:
**Settings → General → Visibility → Pages → Everyone**

Se il progetto è in un gruppo/subgroup, l'URL sarà:
`https://<gruppo>.gitlab.io/<progetto>/`
