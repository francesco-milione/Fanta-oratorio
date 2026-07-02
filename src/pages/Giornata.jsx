import React, { useState } from 'react';
import { useData, SQUADRE_ORATORIO } from '../context/DataContext';
import { SquadraCard } from '../components/PersonaggioCard';
import { groupBonusMalusByEvento } from '../utils/mergeBonusMalus';

export default function Giornata() {
  const { personaggi, votazioni, bonusMalus, giorni } = useData();
  const [giorno, setGiorno] = useState(giorni[giorni.length - 1] ?? '1');

  const votiGiorno = votazioni.filter(v => v.giorno === String(giorno));
  const bmGiorno = bonusMalus.filter(b => b.giorno === String(giorno));

  // Punteggio delle squadre oratorio per il giorno selezionato
  const squadreGiorno = SQUADRE_ORATORIO.map(sq => {
    const voto = votiGiorno.find(v => v.id_squadra?.toLowerCase() === sq);
    const bm = bmGiorno.filter(b => b.id_personaggio?.toLowerCase() === sq);
    const votoBase = voto ? parseFloat(voto.voto_base || 0) : 0;
    const totaleBM = bm.reduce((acc, b) => acc + parseFloat((b.punti || '0').replace('+', '')), 0);
    const totale = votoBase + totaleBM;
    return { squadra: sq, votoBase, totaleBM, totale, numGiorni: voto ? 1 : 0, hasDati: voto !== undefined || bm.length > 0 };
  })
    .filter(s => s.hasDati)
    .sort((a, b) => b.totale - a.totale);

  // Calcola punteggio giornaliero per ogni personaggio
  const rankGiorno = personaggi.map(p => {
    const voto = votiGiorno.find(v => v.id_personaggio === p.id);
    const bm = bmGiorno.filter(b => b.id_personaggio === p.id);
    const totBM = bm.reduce((acc, b) => acc + parseFloat((b.punti || '0').replace('+', '')), 0);
    const votoBase = voto ? parseFloat(voto.voto_base) : null;
    const totale = (votoBase ?? 0) + totBM;
    return { ...p, votoBase, totBM, totaleGiorno: totale, bm, hasDati: voto !== undefined || bm.length > 0 };
  })
    .filter(p => p.hasDati)
    .sort((a, b) => b.totaleGiorno - a.totaleGiorno);

  // Eventi bonus/malus del giorno: stessa descrizione + stesso punteggio
  // assegnati a persone diverse vengono uniti in un'unica riga
  const topBonus = groupBonusMalusByEvento(bmGiorno.filter(b => b.tipo === 'bonus'))
    .sort((a, b) => parseFloat((b.punti || '0').replace('+', '')) - parseFloat((a.punti || '0').replace('+', '')));

  const topMalus = groupBonusMalusByEvento(bmGiorno.filter(b => b.tipo === 'malus'))
    .sort((a, b) => parseFloat((a.punti || '0').replace('+', '')) - parseFloat((b.punti || '0').replace('+', '')));

  return (
    <div className="page">
      <div className="page-header">
        <h2>📅 Giornata</h2>
        <p className="page-subtitle">Cosa è successo ogni giorno</p>
      </div>

      {/* Selettore giorno */}
      <div className="giorni-selector">
        {giorni.map(g => (
          <button
            key={g}
            className={`giorno-big-btn ${giorno === g ? 'active' : ''}`}
            onClick={() => setGiorno(g)}
          >
            <span className="giorno-num">{g}</span>
            <span className="giorno-label">Giorno</span>
          </button>
        ))}
      </div>

      {giorni.length === 0 && (
        <div className="empty-state">
          <span>📭</span>
          <p>Nessuna giornata disponibile ancora</p>
        </div>
      )}

      {giorno && (
        <>
          {/* Punteggi squadre del giorno */}
          <section className="section">
            <h3 className="section-title">🏟️ Squadre del Giorno {giorno}</h3>
            {squadreGiorno.length === 0 ? (
              <div className="empty-state"><span>🏟️</span><p>Nessun punteggio squadra ancora per questo giorno</p></div>
            ) : (
              <div className="squadre-giorno-list">
                {squadreGiorno.map(s => (
                  <SquadraCard
                    key={s.squadra}
                    squadraOratorio={s.squadra}
                    squadraScore={{ votoBase: s.votoBase, totaleBM: s.totaleBM, totale: s.totale, numGiorni: s.numGiorni }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Top personaggi del giorno */}
          <section className="section">
            <h3 className="section-title">📊 Voti del Giorno {giorno}</h3>
            {rankGiorno.length === 0 ? (
              <div className="empty-state"><span>🎯</span><p>Nessun voto ancora per questo giorno</p></div>
            ) : (
              <div className="giornata-rank">
                {rankGiorno.map((p, i) => (
                  <div key={p.id} className={`giornata-row ${i === 0 ? 'top' : ''}`}>
                    <span className="gr-pos">{i + 1}</span>
                    <div className="gr-info">
                      <span className="gr-nome">{p.nome}</span>
                      <span className="gr-ruolo">{p.ruolo}</span>
                    </div>
                    {p.votoBase !== null && (
                      <div className="gr-voto-base">
                        <span className="gr-voto-label">Voto</span>
                        <span className="gr-voto-num">{p.votoBase.toFixed(1)}</span>
                      </div>
                    )}
                    {p.totBM !== 0 && (
                      <div className={`gr-bm ${p.totBM > 0 ? 'pos' : 'neg'}`}>
                        {p.totBM > 0 ? '+' : ''}{p.totBM.toFixed(1)}
                      </div>
                    )}
                    <div className="gr-totale">
                      <span>{p.totaleGiorno.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Bonus */}
          {topBonus.length > 0 && (
            <section className="section">
              <h3 className="section-title">✅ Migliori del Giorno</h3>
              <div className="eventi-list">
                {topBonus.map((b, i) => {
                  const nomi = b.ids.map(id => personaggi.find(x => x.id === id)?.nome || id);
                  const pts = parseFloat((b.punti || '0').replace('+', ''));
                  return (
                    <div key={i} className="evento-item bonus">
                      <span className="evento-icon">🌟</span>
                      <div className="evento-info">
                        <span className="evento-nome">{nomi.join(', ')}</span>
                        <span className="evento-desc">{b.descrizione}</span>
                      </div>
                      <span className="evento-pts pos">+{pts}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Malus */}
          {topMalus.length > 0 && (
            <section className="section">
              <h3 className="section-title">❌ Episodi Negativi</h3>
              <div className="eventi-list">
                {topMalus.map((b, i) => {
                  const nomi = b.ids.map(id => personaggi.find(x => x.id === id)?.nome || id);
                  const pts = parseFloat((b.punti || '0').replace('+', ''));
                  return (
                    <div key={i} className="evento-item malus">
                      <span className="evento-icon">😬</span>
                      <div className="evento-info">
                        <span className="evento-nome">{nomi.join(', ')}</span>
                        <span className="evento-desc">{b.descrizione}</span>
                      </div>
                      <span className="evento-pts neg">{pts}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
