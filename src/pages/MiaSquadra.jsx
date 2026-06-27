import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SQUADRE_LABEL } from '../context/DataContext';

const RUOLI = [
  { key: 'educatore',       label: 'Educatore',       emoji: '🙏',  color: '#6c63ff' },
  { key: 'animatore1',      label: 'Animatore 1',     emoji: '🎮',  color: '#f59e0b' },
  { key: 'animatore2',      label: 'Animatore 2',     emoji: '🎮',  color: '#f59e0b' },
  { key: 'pre animatore',   label: 'Pre animatore',   emoji: '🌱',  color: '#10b981' },
  { key: 'amico san carlo', label: 'Amico San Carlo', emoji: '✝️',  color: '#ec4899' },
];

export default function MiaSquadra({ onModifica }) {
  const { utente } = useAuth();
  const { personaggi, classifica, bonusMalus, giorni, getPersonaggioScore } = useData();
  const [aperto, setAperto] = useState({});

  const squadraInClassifica = classifica.find(g => g.codice === utente?.codice);
  const posizione = squadraInClassifica?.posizione ?? '—';
  const totale = squadraInClassifica?.punteggio ?? 0;
  const squadraScore = squadraInClassifica?.squadraScore ?? null;

  const squadraOratorio = utente?.['squadra-oratorio'];
  const squadraInfo = squadraOratorio ? SQUADRE_LABEL[squadraOratorio] : null;

  // Bonus/malus per personaggio, raggruppati per giorno
  const getBmPerPersonaggio = (id) =>
    bonusMalus
      .filter(b => b.id_personaggio === id)
      .sort((a, b) => parseInt(a.giorno) - parseInt(b.giorno));

  const getBmPerSquadra = () =>
    squadraOratorio
      ? bonusMalus
          .filter(b => b.id_personaggio.toLowerCase() === squadraOratorio.toLowerCase())
          .sort((a, b) => parseInt(a.giorno) - parseInt(b.giorno))
      : [];

  const toggleAperto = (key) => setAperto(prev => ({ ...prev, [key]: !prev[key] }));

  const renderBmList = (bmList, key) => {
    if (bmList.length === 0) return null;
    const isOpen = !!aperto[key];
    // Raggruppa per giorno
    const perGiorno = {};
    bmList.forEach(b => {
      if (!perGiorno[b.giorno]) perGiorno[b.giorno] = [];
      perGiorno[b.giorno].push(b);
    });
    return isOpen ? (
      <div className="ms-bm-giorni">
        {Object.keys(perGiorno).sort((a, b) => parseInt(a) - parseInt(b)).map(g => (
          <div key={g} className="ms-bm-giorno">
            <span className="ms-bm-giorno-label">Giorno {g}</span>
            {perGiorno[g].map((b, i) => {
              const pts = parseFloat((b.punti || '0').replace('+', ''));
              return (
                <div key={i} className={`ms-bm-item ${b.tipo}`}>
                  <span className="ms-bm-icon">{b.tipo === 'bonus' ? '✅' : '❌'}</span>
                  <span className="ms-bm-desc">{b.descrizione}</span>
                  <span className={`ms-bm-pts ${pts >= 0 ? 'pos' : 'neg'}`}>
                    {pts > 0 ? '+' : ''}{pts}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    ) : null;
  };

  const renderPersonaggio = (ruolo) => {
    const id = utente?.[ruolo.key];
    if (!id) return null;
    const personaggio = personaggi.find(p => p.id === id);
    const score = getPersonaggioScore(id);
    const bm = score?.totaleBM ?? 0;
    const bmList = getBmPerPersonaggio(id);

    const hasBm = bmList.length > 0;
    return (
      <div key={ruolo.key} className="ms-card">
        <div
          className={`ms-card-header ${hasBm ? 'clickable' : ''}`}
          onClick={hasBm ? () => toggleAperto(ruolo.key) : undefined}
        >
          <div className="personaggio-avatar" style={{ background: ruolo.color + '22', borderColor: ruolo.color }}>
            <span>{ruolo.emoji}</span>
          </div>
          <div className="personaggio-info">
            <span className="personaggio-ruolo" style={{ color: ruolo.color }}>{ruolo.label}</span>
            <span className="personaggio-nome">{personaggio?.nome || id}</span>
          </div>
          <div className="personaggio-score">
            <span className="score-big" style={{ color: bm < 0 ? '#ef4444' : bm > 0 ? '#10b981' : '#888' }}>
              {bm > 0 ? '+' : ''}{bm.toFixed(1)}
            </span>
            <span className="score-sub">bonus/malus</span>
          </div>
          {hasBm && (
            <span className="ms-arrow">{aperto[ruolo.key] ? '▲' : '▼'}</span>
          )}
        </div>
        {renderBmList(bmList, ruolo.key)}
      </div>
    );
  };

  const renderSquadra = () => {
    if (!squadraOratorio || !squadraInfo) return null;
    const voto = squadraScore?.votoBase ?? 0;
    const bm = squadraScore?.totaleBM ?? 0;
    const totaleS = squadraScore?.totale ?? 0;
    const bmList = getBmPerSquadra();

    const hasBm = bmList.length > 0;
    return (
      <div className="ms-card">
        <div
          className={`ms-card-header ${hasBm ? 'clickable' : ''}`}
          onClick={hasBm ? () => toggleAperto('squadra') : undefined}
        >
          <div className="personaggio-avatar" style={{ background: squadraInfo.colore + '22', borderColor: squadraInfo.colore }}>
            <span style={{ fontSize: 22 }}>{squadraInfo.emoji}</span>
          </div>
          <div className="personaggio-info">
            <span className="personaggio-ruolo" style={{ color: squadraInfo.colore }}>Squadra Oratorio</span>
            <span className="personaggio-nome">{squadraInfo.label}</span>
            {bm !== 0 && (
              <span style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                voto {voto.toFixed(1)} {bm > 0 ? '+' : ''}{bm.toFixed(1)} bm
              </span>
            )}
          </div>
          <div className="personaggio-score">
            <span className="score-big" style={{ color: totaleS < 0 ? '#ef4444' : totaleS > 0 ? '#10b981' : '#888' }}>
              {totaleS.toFixed(1)}
            </span>
            <span className="score-sub">{squadraScore?.numGiorni ?? 0} gior.</span>
          </div>
          {hasBm && <span className="ms-arrow">{aperto['squadra'] ? '▲' : '▼'}</span>}
        </div>
        {renderBmList(bmList, 'squadra')}
      </div>
    );
  };

  return (
    <div className="page">
      {/* Hero card */}
      <div className="squadra-hero">
        <div className="squadra-hero-top">
          <div className="squadra-badge">#{posizione}</div>
          <div className="squadra-info">
            <h2 className="squadra-nome">{utente?.['nome-squadra']}</h2>
            <p className="squadra-owner">di {utente?.proprietario}</p>
          </div>
          {onModifica && (
            <button className="btn-modifica-hero" onClick={onModifica} title="Modifica squadra">
              ✏️ Modifica
            </button>
          )}
        </div>
        {squadraInfo && (
          <div className="squadra-oratorio-tag" style={{ background: squadraInfo.colore + '28', color: squadraInfo.colore, borderColor: squadraInfo.colore + '55' }}>
            {squadraInfo.emoji} {squadraInfo.label}
          </div>
        )}
        <div className="squadra-hero-bottom">
          <span className="totale-num">{totale.toFixed(1)}</span>
          <span className="totale-label">punti totali</span>
        </div>
      </div>

      {/* Formazione con bonus/malus integrati */}
      <section className="section">
        <h3 className="section-title">La tua formazione</h3>
        <div className="ms-cards">
          {RUOLI.map(r => renderPersonaggio(r))}
          {renderSquadra()}
        </div>
      </section>
    </div>
  );
}
