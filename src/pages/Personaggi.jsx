import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { mergeBonusMalus } from '../utils/mergeBonusMalus';

const RUOLO_CONFIG = {
  educatore:          { label: 'Educatore',       emoji: '🙏',  color: '#6c63ff' },
  animatore:          { label: 'Animatore',        emoji: '🎮',  color: '#f59e0b' },
  'pre animatore':    { label: 'Pre Animatore',    emoji: '🌱',  color: '#10b981' },
  'amico san carlo':  { label: 'Amico San Carlo',  emoji: '✝️',  color: '#ec4899' },
};

function getRuoloCfg(ruolo) {
  return RUOLO_CONFIG[ruolo] || { label: ruolo, emoji: '👤', color: '#888' };
}

export default function Personaggi() {
  const { personaggi, votazioni, bonusMalus, giorni } = useData();
  const [selezionato, setSelezionato] = useState(null);

  // Calcola punteggio totale e per giornata per ogni personaggio
  const ranking = useMemo(() => {
    return personaggi.map(p => {
      const perGiorno = giorni.map(g => {
        const voto = votazioni.find(v => v.id_personaggio === p.id && v.giorno === g);
        const bm = bonusMalus.filter(b => b.id_personaggio === p.id && b.giorno === g);
        const votoBase = voto ? parseFloat(voto.voto_base) : null;
        const totBM = bm.reduce((acc, b) => acc + parseFloat((b.punti || '0').replace('+', '')), 0);
        const totale = (votoBase ?? 0) + totBM;
        const hasDati = voto !== undefined || bm.length > 0;
        return { giorno: g, votoBase, totBM, totale, bm, hasDati };
      }).filter(g => g.hasDati);

      const totaleAssoluto = perGiorno.reduce((acc, g) => acc + g.totale, 0);
      const miglioreGiorno = perGiorno.length > 0
        ? perGiorno.reduce((best, g) => g.totale > best.totale ? g : best, perGiorno[0])
        : null;

      return { ...p, perGiorno, totaleAssoluto, miglioreGiorno };
    }).sort((a, b) => b.totaleAssoluto - a.totaleAssoluto);
  }, [personaggi, votazioni, bonusMalus, giorni]);

  const miglioreAssoluto = ranking[0] ?? null;

  const personaggioAperto = ranking.find(p => p.id === selezionato);

  const handleSelect = (id) => {
    setSelezionato(prev => prev === id ? null : id);
  };

  const goToMigliore = () => {
    setSelezionato(miglioreAssoluto?.id ?? null);
    setTimeout(() => {
      document.getElementById('personaggi-list')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>🎭 Personaggi</h2>
        <p className="page-subtitle">Riepilogo punteggi per ogni personaggio</p>
      </div>

      {/* Card migliore assoluto */}
      {miglioreAssoluto && (
        <div className="migliore-banner" onClick={goToMigliore}>
          <div className="migliore-corona">👑</div>
          <div className="migliore-info">
            <span className="migliore-label">Migliore in classifica</span>
            <span className="migliore-nome">{miglioreAssoluto.nome}</span>
            <span className="migliore-ruolo">{getRuoloCfg(miglioreAssoluto.ruolo).label}</span>
          </div>
          <div className="migliore-score">{miglioreAssoluto.totaleAssoluto.toFixed(1)}</div>
        </div>
      )}

      {/* Lista personaggi */}
      <div className="personaggi-ranking" id="personaggi-list">
        {ranking.map((p, i) => {
          const cfg = getRuoloCfg(p.ruolo);
          const isOpen = selezionato === p.id;
          const isMigliore = i === 0;

          return (
            <div
              key={p.id}
              className={`pg-row ${isOpen ? 'open' : ''} ${isMigliore ? 'migliore' : ''}`}
              onClick={() => handleSelect(p.id)}
            >
              {/* Riga principale */}
              <div className="pg-main">
                <div className="pg-pos">
                  {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="pos-num">{i + 1}</span>}
                </div>
                <div className="pg-avatar" style={{ background: cfg.color + '22', borderColor: cfg.color }}>
                  <span>{cfg.emoji}</span>
                </div>
                <div className="pg-info">
                  <span className="pg-nome">{p.nome}</span>
                  <span className="pg-ruolo" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                <div className="pg-totale">
                  <span className="pg-pts">{p.totaleAssoluto.toFixed(1)}</span>
                  <span className="pg-expand">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Dettaglio espanso */}
              {isOpen && (
                <div className="pg-dettaglio">
                  {p.perGiorno.length === 0 ? (
                    <div className="pg-empty">Nessun dato disponibile</div>
                  ) : (
                    <>
                      <div className="pg-giornate-title">Punteggi per giornata</div>
                      <div className="pg-giornate">
                        {p.perGiorno.map(g => {
                          const isMigliorGiorno = p.miglioreGiorno?.giorno === g.giorno;
                          return (
                            <div key={g.giorno} className={`pg-giorno-card ${isMigliorGiorno ? 'best-day' : ''}`}>
                              <div className="pg-giorno-header">
                                <span className="pg-giorno-label">
                                  {isMigliorGiorno && <span className="best-star">⭐</span>}
                                  Giorno {g.giorno}
                                </span>
                                <span className="pg-giorno-tot">{g.totale.toFixed(1)}</span>
                              </div>
                              {g.votoBase !== null && (
                                <div className="pg-giorno-voto">
                                  <span>📊 Voto base</span>
                                  <span>{g.votoBase.toFixed(1)}</span>
                                </div>
                              )}
                              {mergeBonusMalus(g.bm).map((b, bi) => {
                                const pts = parseFloat((b.punti || '0').replace('+', '')) * b.count;
                                return (
                                  <div key={bi} className={`pg-bm-row ${b.tipo === 'bonus' ? 'bonus' : 'malus'}`}>
                                    <span>{b.tipo === 'bonus' ? '✅' : '❌'} {b.descrizione}{b.count > 1 ? ` ×${b.count}` : ''}</span>
                                    <span className={pts >= 0 ? 'pos' : 'neg'}>
                                      {pts > 0 ? '+' : ''}{pts}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
