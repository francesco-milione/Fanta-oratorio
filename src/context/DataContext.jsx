import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

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

// Slot extra facoltativo: un personaggio in più a scelta (o assegnato a caso
// alla chiusura), colonna "giocatore_extra" sulla tabella giocatori.
export const RUOLO_EXTRA = { key: 'giocatore_extra', label: 'Giocatore Extra', emoji: '🎁', color: '#8b5cf6' };

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
    impostazioni: { capitano_attivo: false, giorno_capitano: null, extra_attivo: false, extra_deadline: null, extra_giorno_da: null },
    loading: true,
    error: null,
    lastUpdate: null,
  });

  const loadData = useCallback(async () => {
    try {
      setData(d => ({ ...d, loading: true, error: null }));
      const [[p, u, v, b], giocatoriRes, impostazioniRes] = await Promise.all([
        Promise.all([
          fetchCSV('/data/personaggi.csv'),
          fetchCSV('/data/utenti.csv'),
          fetchCSV('/data/votazioni.csv'),
          fetchCSV('/data/bonus_malus.csv'),
        ]),
        supabase.from('giocatori').select('*').order('created_at', { ascending: true }),
        // Tabella opzionale: se non esiste ancora (migrazione non eseguita) non
        // deve bloccare il resto del sito, quindi l'errore viene ignorato qui
        // e gestito solo dove serve (tab admin "Capitano").
        supabase.from('impostazioni').select('*').eq('id', 1).maybeSingle(),
      ]);
      if (giocatoriRes.error) throw new Error(`Supabase: ${giocatoriRes.error.message}`);
      setData({
        personaggi: parseCSV(p),
        giocatori: giocatoriRes.data || [],
        utenti: parseCSV(u),
        votazioni: parseCSV(v),
        bonusMalus: parseCSV(b),
        impostazioni: impostazioniRes?.data || { capitano_attivo: false, giorno_capitano: null, extra_attivo: false, extra_deadline: null, extra_giorno_da: null },
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

  // Punteggio di un personaggio contando solo i bonus/malus da una certa
  // giornata in poi (usato per il "giocatore extra", i cui punti partono
  // dalla giornata impostata dall'admin, non da tutto lo storico).
  const getPersonaggioScoreDaGiorno = useCallback((idPersonaggio, giornoMin) => {
    const bm = data.bonusMalus.filter(b =>
      b.id_personaggio === idPersonaggio &&
      (giornoMin == null || parseInt(b.giorno, 10) >= parseInt(giornoMin, 10))
    );
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

  // Punti extra del capitano: raddoppia (aggiungendoli una seconda volta) i
  // punti bonus/malus guadagnati esclusivamente nel giorno "giorno_capitano"
  // impostato dall'admin. Non tocca gli altri giorni né gli altri ruoli.
  const getBonusCapitanoGiorno = useCallback((idPersonaggio) => {
    const giornoCap = data.impostazioni?.giorno_capitano;
    if (!giornoCap && giornoCap !== 0) return 0;
    const bm = data.bonusMalus.filter(
      b => b.id_personaggio === idPersonaggio && String(b.giorno) === String(giornoCap)
    );
    return bm.reduce((acc, b) => acc + parseFloat((b.punti || '0').replace('+', '')), 0);
  }, [data.bonusMalus, data.impostazioni]);

  // Punteggio totale della squadra fantasy
  const getSquadraScore = useCallback((giocatore) => {
    let totale = 0;
    const dettagli = [];

    RUOLI_FORMAZIONE.forEach(r => {
      const id = giocatore[r.key];
      if (!id) return;
      const score = getPersonaggioScore(id);
      const personaggio = data.personaggi.find(p => p.id === id);
      const isCapitano = giocatore.capitano === r.key;
      const bonusCapitano = isCapitano ? getBonusCapitanoGiorno(id) : 0;
      const totaleRuolo = score.totale + bonusCapitano;
      dettagli.push({
        ruolo: r.key,
        id,
        nome: personaggio?.nome || id,
        ...score,
        totaleBM: score.totaleBM + bonusCapitano,
        totale: totaleRuolo,
        isCapitano,
        bonusCapitano,
      });
      totale += totaleRuolo;
    });

    // Giocatore extra (facoltativo): un personaggio in più, scelto o assegnato
    // a caso alla chiusura. Non è mai capitano. I suoi punti contano solo dalla
    // giornata "extra_giorno_da" impostata dall'admin (non da tutto lo storico).
    const idExtra = giocatore['giocatore_extra'];
    if (idExtra) {
      const giornoDa = data.impostazioni?.extra_giorno_da;
      const scoreExtra = getPersonaggioScoreDaGiorno(idExtra, giornoDa);
      const personaggioExtra = data.personaggi.find(p => p.id === idExtra);
      dettagli.push({
        ruolo: 'giocatore_extra',
        id: idExtra,
        nome: personaggioExtra?.nome || idExtra,
        ...scoreExtra,
        isCapitano: false,
        bonusCapitano: 0,
      });
      totale += scoreExtra.totale;
    }

    const squadraOratorio = giocatore['squadra-oratorio'];
    const squadraScore = getSquadraOratorioScore(squadraOratorio);
    totale += squadraScore.totale;

    return { totale, dettagli, squadraScore };
  }, [getPersonaggioScore, getPersonaggioScoreDaGiorno, getSquadraOratorioScore, data.personaggi, data.impostazioni]);

  const classifica = React.useMemo(() => {
    return data.giocatori
      .map(g => {
        const { totale, dettagli, squadraScore } = getSquadraScore(g);
        return { ...g, punteggio: totale, dettagliSquadra: dettagli, squadraScore };
      })
      .sort((a, b) => b.punteggio - a.punteggio)
      .map((g, i) => ({ ...g, posizione: i + 1 }));
  }, [data.giocatori, getSquadraScore]);

  // Squadra ideale: il migliore per ogni ruolo della formazione (educatore,
  // 2 animatori, pre animatore, amico san carlo) + la migliore squadra oratorio,
  // cioè la formazione più forte teoricamente possibile con le regole del gioco.
  const squadraIdeale = React.useMemo(() => {
    const conPunteggio = data.personaggi.map(p => ({ ...p, score: getPersonaggioScore(p.id).totale }));
    const migliori = (ruolo) => conPunteggio
      .filter(p => p.ruolo === ruolo)
      .sort((a, b) => b.score - a.score);

    const dettagli = [];
    let totale = 0;

    const educatori = migliori('educatore');
    if (educatori[0]) {
      dettagli.push({ ruoloKey: 'educatore', ruoloLabel: 'Educatore', ...educatori[0] });
      totale += educatori[0].score;
    }

    migliori('animatore').slice(0, 2).forEach((a, i) => {
      dettagli.push({ ruoloKey: `animatore${i + 1}`, ruoloLabel: 'Animatore', ...a });
      totale += a.score;
    });

    const preAnimatori = migliori('pre animatore');
    if (preAnimatori[0]) {
      dettagli.push({ ruoloKey: 'pre animatore', ruoloLabel: 'Pre Animatore', ...preAnimatori[0] });
      totale += preAnimatori[0].score;
    }

    const amici = migliori('amico san carlo');
    if (amici[0]) {
      dettagli.push({ ruoloKey: 'amico san carlo', ruoloLabel: 'Amico San Carlo', ...amici[0] });
      totale += amici[0].score;
    }

    // Migliore squadra oratorio tra le 4
    let squadraOratorio = null;
    let squadraScore = null;
    SQUADRE_ORATORIO.forEach(sq => {
      const s = getSquadraOratorioScore(sq);
      if (!squadraScore || s.totale > squadraScore.totale) {
        squadraScore = s;
        squadraOratorio = sq;
      }
    });
    if (squadraScore) totale += squadraScore.totale;

    return { dettagli, totale, squadraOratorio, squadraScore };
  }, [data.personaggi, getPersonaggioScore, getSquadraOratorioScore]);

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
      squadraIdeale,
      giorni,
      getPersonaggioScore,
      getPersonaggioScoreDaGiorno,
      getSquadraOratorioScore,
      getSquadraScore,
      getBonusCapitanoGiorno,
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
