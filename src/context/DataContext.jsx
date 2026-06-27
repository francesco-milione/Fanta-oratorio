import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext(null);

const BASE = process.env.PUBLIC_URL || '';

export const SQUADRE_ORATORIO = ['leoni', 'gechi', 'aquile', 'squali'];
export const SQUADRE_LABEL = {
  leoni:  { label: 'Leoni',  emoji: '🦁', colore: '#f59e0b' },
  gechi:  { label: 'Gechi',  emoji: '🦎', colore: '#22c55e' },
  aquile: { label: 'Aquile', emoji: '🦅', colore: '#3b82f6' },
  squali: { label: 'Squali', emoji: '🦈', colore: '#6366f1' },
};

// Ordine della formazione (edu → ani → pre → amico)
export const RUOLI_FORMAZIONE = [
  { key: 'educatore',       label: 'Educatore',       emoji: '🙏',  color: '#6c63ff' },
  { key: 'animatore1',      label: 'Animatore',       emoji: '🎮',  color: '#f59e0b' },
  { key: 'animatore2',      label: 'Animatore',       emoji: '🎮',  color: '#f59e0b' },
  { key: 'pre animatore',   label: 'Pre animatore',   emoji: '🌱',  color: '#10b981' },
  { key: 'amico san carlo', label: 'Amico San Carlo', emoji: '✝️',  color: '#ec4899' },
];

async function fetchCSV(path) {
  const res = await fetch(`${BASE}${path}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Impossibile caricare ${path}`);
  return res.text();
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
    utenti: [],
    votazioni: [],   // ora per squadra oratorio: { id_squadra, giorno, voto_base }
    bonusMalus: [],
    loading: true,
    error: null,
    lastUpdate: null,
  });

  const loadData = useCallback(async () => {
    try {
      setData(d => ({ ...d, loading: true, error: null }));
      const [p, g, u, v, b] = await Promise.all([
        fetchCSV('/data/personaggi.csv'),
        fetchCSV('/data/giocatori.csv'),
        fetchCSV('/data/utenti.csv'),
        fetchCSV('/data/votazioni.csv'),
        fetchCSV('/data/bonus_malus.csv'),
      ]);
      setData({
        personaggi: parseCSV(p),
        giocatori: parseCSV(g),
        utenti: parseCSV(u),
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

  // Punteggio di un singolo personaggio = solo bonus/malus (niente voto base)
  const getPersonaggioScore = useCallback((idPersonaggio) => {
    const bm = data.bonusMalus.filter(b => b.id_personaggio === idPersonaggio);
    const totaleBM = bm.reduce((acc, b) => {
      const p = parseFloat((b.punti || '0').replace('+', ''));
      return acc + p;
    }, 0);
    return { totaleBM, totale: totaleBM };
  }, [data.bonusMalus]);

  // Punteggio della squadra oratorio = voto base + bonus/malus della squadra
  const getSquadraOratorioScore = useCallback((squadraOratorio) => {
    if (!squadraOratorio) return { votoBase: 0, totaleBM: 0, totale: 0, numGiorni: 0 };
    const sq = squadraOratorio.toLowerCase();
    const voti = data.votazioni.filter(v => v.id_squadra?.toLowerCase() === sq);
    const bm = data.bonusMalus.filter(b => b.id_personaggio?.toLowerCase() === sq);
    const votoBase = voti.reduce((acc, v) => acc + parseFloat(v.voto_base || 0), 0);
    const totaleBM = bm.reduce((acc, b) => acc + parseFloat((b.punti || '0').replace('+', '')), 0);
    return { votoBase, totaleBM, totale: votoBase + totaleBM, numGiorni: voti.length };
  }, [data.votazioni, data.bonusMalus]);

  // Punteggio totale della squadra fantasy
  const getSquadraScore = useCallback((giocatore) => {
    let totale = 0;
    const dettagli = [];

    RUOLI_FORMAZIONE.forEach(r => {
      const id = giocatore[r.key];
      if (!id) return;
      const score = getPersonaggioScore(id);
      const personaggio = data.personaggi.find(p => p.id === id);
      dettagli.push({ ruolo: r.key, id, nome: personaggio?.nome || id, ...score });
      totale += score.totale;
    });

    const squadraOratorio = giocatore['squadra-oratorio'];
    const squadraScore = getSquadraOratorioScore(squadraOratorio);
    totale += squadraScore.totale;

    return { totale, dettagli, squadraScore };
  }, [getPersonaggioScore, getSquadraOratorioScore, data.personaggi]);

  const classifica = React.useMemo(() => {
    return data.giocatori
      .map(g => {
        const { totale, dettagli, squadraScore } = getSquadraScore(g);
        return { ...g, punteggio: totale, dettagliSquadra: dettagli, squadraScore };
      })
      .sort((a, b) => b.punteggio - a.punteggio)
      .map((g, i) => ({ ...g, posizione: i + 1 }));
  }, [data.giocatori, getSquadraScore]);

  // Giorni dai voti squadra e bonus/malus (escluse le squadre stesse dai bm)
  const giorni = React.useMemo(() => {
    const squadreSet = new Set(SQUADRE_ORATORIO);
    const set = new Set([
      ...data.votazioni.map(v => v.giorno),
      ...data.bonusMalus
        .filter(b => !squadreSet.has(b.id_personaggio?.toLowerCase()))
        .map(b => b.giorno),
    ]);
    return [...set].filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b));
  }, [data.votazioni, data.bonusMalus]);

  return (
    <DataContext.Provider value={{
      ...data,
      classifica,
      giorni,
      getPersonaggioScore,
      getSquadraOratorioScore,
      getSquadraScore,
      reload: loadData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
