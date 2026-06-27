import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PersonaggioCard } from '../components/PersonaggioCard';

const RUOLI = [
  { key: 'educatore', label: 'Educatore', emoji: '🙏' },
  { key: 'animatore1', label: 'Animatore 1', emoji: '🎮' },
  { key: 'animatore2', label: 'Animatore 2', emoji: '🎮' },
  { key: 'bambino1', label: 'Bambino 1', emoji: '⭐' },
  { key: 'bambino2', label: 'Bambino 2', emoji: '⭐' },
  { key: 'bambino3', label: 'Bambino 3', emoji: '⭐' },
];

export default function MiaSquadra() {
  const { utente } = useAuth();
  const { personaggi, classifica, bonusMalus, giorni, getPersonaggioScore } = useData();
  const [giornoSelezionato, setGiornoSelezionato] = useState(null);

  const squadraInClassifica = classifica.find(g => g.codice === utente?.codice);
  const posizione = squadraInClassifica?.posizione ?? '—';
  const totale = squadraInClassifica?.punteggio ?? 0;

  const renderPersonaggio = (ruolo) => {
    const id = utente?.[ruolo.key];
    if (!id) return null;
    const personaggio = personaggi.find(p => p.id === id);
    const score = getPersonaggioScore(id);
    return (
      <PersonaggioCard
        key={ruolo.key}
        id={id}
        nome={personaggio?.nome}
        ruolo={ruolo.key}
        score={score}
      />
    );
  };

  // Bonus/malus della squadra filtrati per giorno selezionato
  const myIds = RUOLI.map(r => utente?.[r.key]).filter(Boolean);
  const bmFiltrati = bonusMalus.filter(b =>
    myIds.includes(b.id_personaggio) &&
    (giornoSelezionato === null || b.giorno === String(giornoSelezionato))
  ).sort((a, b) => parseInt(a.giorno) - parseInt(b.giorno));

  return (
    <div className="page">
      {/* Header squadra */}
      <div className="squadra-hero">
        <div className="squadra-badge">#{posizione}</div>
        <div className="squadra-info">
          <h2 className="squadra-nome">{utente?.nome_squadra}</h2>
          <p className="squadra-owner">di {utente?.proprietario}</p>
        </div>
        <div className="squadra-totale">
          <span className="totale-num">{totale.toFixed(1)}</span>
          <span className="totale-label">punti totali</span>
        </div>
      </div>

      {/* Sezione formazione */}
      <section className="section">
        <h3 className="section-title">La tua formazione</h3>
        <div className="personaggi-grid">
          {RUOLI.map(r => renderPersonaggio(r))}
        </div>
      </section>

      {/* Sezione bonus/malus */}
      <section className="section">
        <div className="section-header-row">
          <h3 className="section-title">Bonus & Malus</h3>
          <div className="giorni-filter">
            <button
              className={`giorno-btn ${giornoSelezionato === null ? 'active' : ''}`}
              onClick={() => setGiornoSelezionato(null)}
            >Tutti</button>
            {giorni.map(g => (
              <button
                key={g}
                className={`giorno-btn ${giornoSelezionato === parseInt(g) ? 'active' : ''}`}
                onClick={() => setGiornoSelezionato(parseInt(g))}
              >G{g}</button>
            ))}
          </div>
        </div>

        {bmFiltrati.length === 0 ? (
          <div className="empty-state">
            <span>🎯</span>
            <p>Nessun bonus o malus {giornoSelezionato ? `per il giorno ${giornoSelezionato}` : 'ancora'}</p>
          </div>
        ) : (
          <div className="bm-list">
            {bmFiltrati.map((b, i) => {
              const pts = parseFloat((b.punti || '0').replace('+', ''));
              const personaggio = personaggi.find(p => p.id === b.id_personaggio);
              return (
                <div key={i} className={`bm-item ${b.tipo === 'bonus' ? 'bonus' : 'malus'}`}>
                  <div className="bm-icon">{b.tipo === 'bonus' ? '✅' : '❌'}</div>
                  <div className="bm-content">
                    <span className="bm-nome">{personaggio?.nome || b.id_personaggio}</span>
                    <span className="bm-desc">{b.descrizione}</span>
                    <span className="bm-giorno-tag">Giorno {b.giorno}</span>
                  </div>
                  <div className={`bm-punti ${pts >= 0 ? 'pos' : 'neg'}`}>
                    {pts > 0 ? '+' : ''}{pts}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
