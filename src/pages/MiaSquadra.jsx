import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SQUADRE_LABEL } from '../context/DataContext';
import { PersonaggioCard, SquadraCard } from '../components/PersonaggioCard';

const RUOLI = [
  { key: 'educatore',       label: 'Educatore',       emoji: '🙏' },
  { key: 'animatore1',      label: 'Animatore 1',     emoji: '🎮' },
  { key: 'animatore2',      label: 'Animatore 2',     emoji: '🎮' },
  { key: 'pre animatore',   label: 'Pre animatore',   emoji: '🌱' },
  { key: 'amico san carlo', label: 'Amico San Carlo', emoji: '✝️' },
];

export default function MiaSquadra() {
  const { utente } = useAuth();
  const { personaggi, classifica, bonusMalus, giorni, getPersonaggioScore } = useData();
  const [giornoSelezionato, setGiornoSelezionato] = useState(null);

  const squadraInClassifica = classifica.find(g => g.codice === utente?.codice);
  const posizione = squadraInClassifica?.posizione ?? '—';
  const totale = squadraInClassifica?.punteggio ?? 0;
  const squadraScore = squadraInClassifica?.squadraScore ?? null;

  const squadraOratorio = utente?.['squadra-oratorio'];
  const squadraInfo = squadraOratorio ? SQUADRE_LABEL[squadraOratorio] : null;

  const renderPersonaggio = (ruolo) => {
    const id = utente?.[ruolo.key];
    if (!id) return null;
    const personaggio = personaggi.find(p => p.id === id);
    const score = getPersonaggioScore(id);
    return (
      <PersonaggioCard key={ruolo.key} id={id} nome={personaggio?.nome} ruolo={ruolo.key} score={score} />
    );
  };

  // Bonus/malus personaggi + squadra oratorio, filtrati per giorno
  const myIds = RUOLI.map(r => utente?.[r.key]).filter(Boolean);
  const bmPersonaggi = bonusMalus.filter(b =>
    myIds.includes(b.id_personaggio) &&
    (giornoSelezionato === null || b.giorno === String(giornoSelezionato))
  );
  const bmSquadra = squadraOratorio ? bonusMalus.filter(b =>
    b.id_personaggio.toLowerCase() === squadraOratorio.toLowerCase() &&
    (giornoSelezionato === null || b.giorno === String(giornoSelezionato))
  ) : [];
  const bmFiltrati = [...bmPersonaggi, ...bmSquadra]
    .sort((a, b) => parseInt(a.giorno) - parseInt(b.giorno));

  return (
    <div className="page">
      {/* Header */}
      <div className="squadra-hero">
        <div className="squadra-badge">#{posizione}</div>
        <div className="squadra-info">
          <h2 className="squadra-nome">{utente?.['nome-squadra']}</h2>
          <p className="squadra-owner">di {utente?.proprietario}</p>
          {squadraInfo && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: squadraInfo.colore, fontWeight: 600 }}>
              {squadraInfo.emoji} {squadraInfo.label}
            </p>
          )}
        </div>
        <div className="squadra-totale">
          <span className="totale-num">{totale.toFixed(1)}</span>
          <span className="totale-label">punti totali</span>
        </div>
      </div>

      {/* Formazione: 5 personaggi + squadra oratorio */}
      <section className="section">
        <h3 className="section-title">La tua formazione</h3>
        <div className="personaggi-grid">
          {RUOLI.map(r => renderPersonaggio(r))}
          {squadraOratorio && (
            <SquadraCard squadraOratorio={squadraOratorio} squadraScore={squadraScore} />
          )}
        </div>
      </section>

      {/* Bonus/malus */}
      <section className="section">
        <div className="section-header-row">
          <h3 className="section-title">Bonus & Malus</h3>
          <div className="giorni-filter">
            <button className={`giorno-btn ${giornoSelezionato === null ? 'active' : ''}`} onClick={() => setGiornoSelezionato(null)}>Tutti</button>
            {giorni.map(g => (
              <button key={g} className={`giorno-btn ${giornoSelezionato === parseInt(g) ? 'active' : ''}`} onClick={() => setGiornoSelezionato(parseInt(g))}>G{g}</button>
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
              const sqInfo = SQUADRE_LABEL[b.id_personaggio?.toLowerCase()];
              const personaggio = sqInfo ? null : personaggi.find(p => p.id === b.id_personaggio);
              const nomeDisplay = sqInfo
                ? `${sqInfo.emoji} Squadra ${sqInfo.label}`
                : (personaggio?.nome || b.id_personaggio);
              return (
                <div key={i} className={`bm-item ${b.tipo === 'bonus' ? 'bonus' : 'malus'}`}>
                  <div className="bm-icon">{b.tipo === 'bonus' ? '✅' : '❌'}</div>
                  <div className="bm-content">
                    <span className="bm-nome">{nomeDisplay}</span>
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
