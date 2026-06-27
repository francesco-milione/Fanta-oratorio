import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext(null);

const BASE = process.env.PUBLIC_URL || '';

async function fetchCSV(path) {
  const res = await fetch(`${BASE}${path}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Impossibile caricare ${path}`);
  const text = await res.text();
  return text;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

export function DataProvider({ children }) {
  const [data, setData] = useState({
    personaggi: [],
    giocatori: [],
    votazioni: [],
    bonusMalus: [],
    loading: true,
    error: null,
    lastUpdate: null,
  });

  const loadData = useCallback(async () => {
    try {
      setData(d => ({ ...d, loading: true, error: null }));
      const [p, g, v, b] = await Promise.all([
        fetchCSV('/data/personaggi.csv'),
        fetchCSV('/data/giocatori.csv'),
        fetchCSV('/data/votazioni.csv'),
        fetchCSV('/data/bonus_malus.csv'),
      ]);
      setData({
        personaggi: parseCSV(p),
        giocatori: parseCSV(g),
        votazioni: parseCSV(v),
        bonusMalus: parseCSV(b),
        loading: false,
        error: null,
        lastUpdate: new Date(),
      });
    } catch (e) {
      setData(d => ({ ...d, loading: false, error: e.message }));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Calcola il punteggio totale di un personaggio
  const getPersonaggioScore = useCallback((idPersonaggio) => {
    const voti = data.votazioni.filter(v => v.id_personaggio === idPersonaggio);
    const bm = data.bonusMalus.filter(b => b.id_personaggio === idPersonaggio);
    const totaleVoti = voti.reduce((acc, v) => acc + parseFloat(v.voto_base || 0), 0);
    const totaleBM = bm.reduce((acc, b) => {
      const p = parseFloat((b.punti || '0').replace('+', ''));
      return acc + p;
    }, 0);
    return { totaleVoti, totaleBM, totale: totaleVoti + totaleBM, numGiorni: voti.length };
  }, [data.votazioni, data.bonusMalus]);

  // Calcola il punteggio totale di una squadra (riga giocatori)
  const getSquadraScore = useCallback((giocatore) => {
    const ruoli = ['educatore', 'animatore1', 'animatore2', 'bambino1', 'bambino2', 'bambino3'];
    let totale = 0;
    const dettagli = [];
    ruoli.forEach(ruolo => {
      const id = giocatore[ruolo];
      if (!id) return;
      const score = getPersonaggioScore(id);
      const personaggio = data.personaggi.find(p => p.id === id);
      dettagli.push({ ruolo, id, nome: personaggio?.nome || id, ...score });
      totale += score.totale;
    });
    return { totale, dettagli };
  }, [getPersonaggioScore, data.personaggi]);

  // Classifica completa
  const classifica = React.useMemo(() => {
    return data.giocatori
      .map(g => {
        const { totale, dettagli } = getSquadraScore(g);
        return { ...g, punteggio: totale, dettagliSquadra: dettagli };
      })
      .sort((a, b) => b.punteggio - a.punteggio)
      .map((g, i) => ({ ...g, posizione: i + 1 }));
  }, [data.giocatori, getSquadraScore]);

  // Giorni disponibili
  const giorni = React.useMemo(() => {
    const set = new Set([
      ...data.votazioni.map(v => v.giorno),
      ...data.bonusMalus.map(b => b.giorno),
    ]);
    return [...set].sort((a, b) => parseInt(a) - parseInt(b));
  }, [data.votazioni, data.bonusMalus]);

  return (
    <DataContext.Provider value={{ ...data, classifica, giorni, getPersonaggioScore, getSquadraScore, reload: loadData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
