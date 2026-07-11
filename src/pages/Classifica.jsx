import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SQUADRE_LABEL } from '../context/DataContext';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Classifica() {
  const { utente } = useAuth();
  const { classifica, personaggi, squadraIdeale } = useData();
  const [expanded, setExpanded] = useState(null);

  const toggle = (codice) => setExpanded(prev => prev === codice ? null : codice);

  const openAndScroll = (codice) => {
    setExpanded(codice);
    setTimeout(() => {
      document.getElementById(`cl-row-${codice}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const podio = classifica.slice(0, 3);

  return (
    <div className="page">
      <div className="page-header">
        <h2>🏆 Classifica</h2>
        <p className="page-subtitle">{classifica.length} squadre in gara</p>
      </div>

      {/* Podio dei primi 3 */}
      {podio.length > 0 && (
        <div className="podio-wrap">
          {podio.map((g, i) => {
            const rank = ['gold', 'silver', 'bronze'][i];
            const medal = MEDAL[i];
            const sqInfo = SQUADRE_LABEL[g['squadra-oratorio']];
            const isMine = g.codice === utente?.codice;
            return (
              <div
                key={g.codice}
                className={`podio-item ${rank} ${isMine ? 'mine' : ''}`}
                onClick={() => openAndScroll(g.codice)}
              >
                <span className="podio-medal">{medal}</span>
                <div
                  className="podio-avatar"
                  style={sqInfo ? { background: sqInfo.colore + '22', borderColor: sqInfo.colore } : { borderColor: 'var(--viola-mid)' }}
                >
                  <span>{sqInfo ? sqInfo.emoji : '🏆'}</span>
                </div>
                <span className="podio-pos">{i + 1}° posto</span>
                <span className="podio-nome">{g['nome-squadra']}</span>
                <span className="podio-ruolo">{g.proprietario}{isMine ? ' · TU' : ''}</span>
                <span className="podio-pts">{g.punteggio.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="classifica-list">
        {classifica.map((g) => {
          const isMine = g.codice === utente?.codice;
          const isOpen = expanded === g.codice;
          const medal = MEDAL[g.posizione - 1] ?? null;

          return (
            <div
              key={g.codice}
              id={`cl-row-${g.codice}`}
              className={`classifica-row ${isMine ? 'mine' : ''} ${isOpen ? 'open' : ''}`}
              onClick={() => toggle(g.codice)}
            >
              <div className="cl-main">
                <div className="cl-pos">
                  {medal ? <span className="medal">{medal}</span> : <span className="pos-num">{g.posizione}</span>}
                </div>
                <div className="cl-info">
                  <span className="cl-squadra">{g['nome-squadra']}</span>
                  <span className="cl-owner">{g.proprietario}</span>
                </div>
                {isMine && <span className="tu-badge">TU</span>}
                <div className="cl-score">
                  <span className="cl-pts">{g.punteggio.toFixed(1)}</span>
                  <span className="cl-expand">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {isOpen && (
                <div className="cl-dettagli">
                  <div className="cl-dettagli-title">Formazione</div>
                  <div className="cl-formazione">
                    {g.dettagliSquadra.map((d, i) => {
                      const personaggio = personaggi.find(p => p.id === d.id);
                      return (
                        <div key={i} className="cl-membro">
                          <div className="cl-membro-info">
                            <span className="cl-membro-ruolo">{personaggio?.ruolo || d.ruolo}</span>
                            <span className="cl-membro-nome">{d.nome}</span>
                          </div>
                          <div className="cl-membro-score">
                            <span
                              className={`cl-membro-bm ${d.totaleBM >= 0 ? 'pos' : 'neg'}`}
                              style={d.totaleBM === 0 ? { visibility: 'hidden' } : {}}
                            >
                              {d.totaleBM > 0 ? '+' : ''}{d.totaleBM.toFixed(1)}
                            </span>
                            <span className="cl-membro-pts">{d.totale.toFixed(1)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {/* Riga squadra oratorio */}
                    {g['squadra-oratorio'] && (() => {
                      const sq = g['squadra-oratorio'];
                      const info = SQUADRE_LABEL[sq];
                      const sqScore = g.squadraScore;
                      if (!info || !sqScore) return null;
                      return (
                        <div className="cl-membro">
                          <div className="cl-membro-info">
                            <span className="cl-membro-ruolo">{info.emoji} Squadra</span>
                            <span className="cl-membro-nome">{info.label}</span>
                          </div>
                          <div className="cl-membro-score">
                            <span
                              className={`cl-membro-bm ${sqScore.totaleBM >= 0 ? 'pos' : 'neg'}`}
                              style={sqScore.totaleBM === 0 ? { visibility: 'hidden' } : {}}
                            >
                              {sqScore.totaleBM > 0 ? '+' : ''}{sqScore.totaleBM.toFixed(1)}
                            </span>
                            <span className="cl-membro-pts">{sqScore.totale.toFixed(1)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Squadra ideale: il migliore per ogni ruolo, la formazione più forte teoricamente possibile */}
      {squadraIdeale && squadraIdeale.dettagli.length > 0 && (
        <section className="section" style={{ marginTop: 28 }}>
          <h3 className="section-title">🌟 Squadra Ideale</h3>
          <p className="page-subtitle" style={{ marginTop: -6, marginBottom: 10 }}>
            La formazione più forte possibile, scegliendo il migliore per ogni ruolo
          </p>
          <div className="classifica-row ideale">
            <div className="cl-main">
              <div className="cl-pos"><span className="medal">🌟</span></div>
              <div className="cl-info">
                <span className="cl-squadra">Squadra Ideale</span>
                <span className="cl-owner">Il meglio di ogni ruolo</span>
              </div>
              <div className="cl-score">
                <span className="cl-pts">{squadraIdeale.totale.toFixed(1)}</span>
              </div>
            </div>
            <div className="cl-dettagli">
              <div className="cl-dettagli-title">Formazione</div>
              <div className="cl-formazione">
                {squadraIdeale.dettagli.map((d, i) => (
                  <div key={i} className="cl-membro">
                    <div className="cl-membro-info">
                      <span className="cl-membro-ruolo">{d.ruoloLabel}</span>
                      <span className="cl-membro-nome">{d.nome}{d.isCapitano ? ' ⭐' : ''}</span>
                    </div>
                    <div className="cl-membro-score">
                      <span className="cl-membro-pts">{d.score.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
                {squadraIdeale.squadraOratorio && squadraIdeale.squadraScore && (() => {
                  const info = SQUADRE_LABEL[squadraIdeale.squadraOratorio];
                  if (!info) return null;
                  return (
                    <div className="cl-membro">
                      <div className="cl-membro-info">
                        <span className="cl-membro-ruolo">{info.emoji} Squadra</span>
                        <span className="cl-membro-nome">{info.label}</span>
                      </div>
                      <div className="cl-membro-score">
                        <span className="cl-membro-pts">{squadraIdeale.squadraScore.totale.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
