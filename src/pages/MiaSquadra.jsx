import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SQUADRE_LABEL } from '../context/DataContext';
import { mergeBonusMalus } from '../utils/mergeBonusMalus';
import { supabase } from '../supabaseClient';

const RUOLI = [
  { key: 'educatore',       label: 'Educatore',       emoji: '🙏',  color: '#6c63ff' },
  { key: 'animatore1',      label: 'Animatore 1',     emoji: '🎮',  color: '#f59e0b' },
  { key: 'animatore2',      label: 'Animatore 2',     emoji: '🎮',  color: '#f59e0b' },
  { key: 'pre animatore',   label: 'Pre animatore',   emoji: '🌱',  color: '#10b981' },
  { key: 'amico san carlo', label: 'Amico San Carlo', emoji: '✝️',  color: '#ec4899' },
];

export default function MiaSquadra({ onModifica }) {
  const { utente } = useAuth();
  const { personaggi, classifica, bonusMalus, giorni, getPersonaggioScore, impostazioni, reload } = useData();
  const [aperto, setAperto] = useState({});
  const [salvandoCapitano, setSalvandoCapitano] = useState(false);

  const capitanoAttivo = !!impostazioni?.capitano_attivo;

  async function scegliCapitano(ruoloKey) {
    if (!utente?.codice || salvandoCapitano) return;
    setSalvandoCapitano(true);
    const { error } = await supabase.from('giocatori')
      .update({ capitano: ruoloKey }).eq('codice', utente.codice);
    setSalvandoCapitano(false);
    if (!error) reload();
  }

  const squadraInClassifica = classifica.find(g => g.codice === utente?.codice);
  const posizione = squadraInClassifica?.posizione ?? '—';
  const totale = squadraInClassifica?.punteggio ?? 0;
  const squadraScore = squadraInClassifica?.squadraScore ?? null;
  const dettagliByRuolo = {};
  (squadraInClassifica?.dettagliSquadra || []).forEach(d => { dettagliByRuolo[d.ruolo] = d; });

  const giornoCapitano = impostazioni?.giorno_capitano ?? null;
  const dettaglioCapitano = Object.values(dettagliByRuolo).find(d => d.isCapitano);

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

  const renderBmList = (bmList, key, capitanoGiorno = null) => {
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
            <span className="ms-bm-giorno-label">
              Giorno {g}
              {capitanoGiorno != null && String(g) === String(capitanoGiorno) && (
                <span className="ms-bm-giorno-x2"> ⭐ ×2 capitano</span>
              )}
            </span>
            {mergeBonusMalus(perGiorno[g]).map((b, i) => {
              const pts = parseFloat((b.punti || '0').replace('+', '')) * b.count;
              return (
                <div key={i} className={`ms-bm-item ${b.tipo}`}>
                  <span className="ms-bm-icon">{b.tipo === 'bonus' ? '✅' : '❌'}</span>
                  <span className="ms-bm-desc">{b.descrizione}{b.count > 1 ? ` ×${b.count}` : ''}</span>
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
    const dettaglio = dettagliByRuolo[ruolo.key];
    // totaleBM include già il raddoppio del capitano per la giornata impostata
    const bm = dettaglio?.totaleBM ?? getPersonaggioScore(id).totaleBM ?? 0;
    const bmList = getBmPerPersonaggio(id);

    const hasBm = bmList.length > 0;
    const isCapitano = utente?.capitano === ruolo.key;
    const bonusCapitano = dettaglio?.bonusCapitano ?? 0;
    return (
      <div key={ruolo.key} className={`ms-card ${isCapitano ? 'ms-card-capitano' : ''}`}>
        <div
          className={`ms-card-header ${hasBm ? 'clickable' : ''}`}
          onClick={hasBm ? () => toggleAperto(ruolo.key) : undefined}
        >
          <div className="personaggio-avatar" style={{ background: ruolo.color + '22', borderColor: ruolo.color }}>
            <span>{ruolo.emoji}</span>
          </div>
          <div className="personaggio-info">
            <span className="personaggio-ruolo" style={{ color: ruolo.color }}>{ruolo.label}</span>
            <span className="personaggio-nome">{personaggio?.nome || id}{isCapitano ? ' ⭐' : ''}</span>
            {isCapitano && giornoCapitano != null && (
              <span className="ms-capitano-tag">
                ⭐ Capitano — punti raddoppiati Giorno {giornoCapitano}
                {bonusCapitano !== 0 ? ` (+${bonusCapitano.toFixed(1)} extra)` : ''}
              </span>
            )}
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
        {renderBmList(bmList, ruolo.key, isCapitano ? giornoCapitano : null)}
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
          <div className="squadra-punteggio-right">
            <span className="totale-num">{totale.toFixed(1)}</span>
            <span className="totale-label">punti totali</span>
          </div>
        </div>
        {squadraInfo && (
          <div className="squadra-oratorio-tag" style={{ background: squadraInfo.colore + '28', color: squadraInfo.colore, borderColor: squadraInfo.colore + '55' }}>
            {squadraInfo.emoji} {squadraInfo.label}
          </div>
        )}
        {onModifica && (
          <div className="squadra-hero-modifica">
            <button className="btn-modifica-hero" onClick={onModifica} title="Modifica squadra">
              ✏️ Modifica
            </button>
            <span className="modifica-hint">Puoi modificare la squadra entro martedì alle 8:00</span>
          </div>
        )}
      </div>

      {/* Banner: giorno del capitano già passato/attivo con raddoppio calcolato */}
      {giornoCapitano != null && dettaglioCapitano && (
        <div className="capitano-banner">
          ⭐ <strong>Giorno {giornoCapitano}</strong>: il tuo capitano <strong>{dettaglioCapitano.nome}</strong> ha
          punti raddoppiati
          {dettaglioCapitano.bonusCapitano !== 0
            ? ` — bonus extra dal raddoppio: ${dettaglioCapitano.bonusCapitano > 0 ? '+' : ''}${dettaglioCapitano.bonusCapitano.toFixed(1)}`
            : ' (nessun bonus/malus registrato per ora quel giorno)'}
        </div>
      )}

      {/* Selezione capitano: visibile solo quando l'admin attiva il flag */}
      {capitanoAttivo && (
        <section className="section capitano-picker">
          <h3 className="section-title">⭐ Scegli il tuo capitano</h3>
          <p className="capitano-picker-hint">
            Il capitano prenderà il doppio dei punti nella giornata stabilita. Puoi cambiarlo finché questa scelta resta aperta.
          </p>
          <div className="capitano-picker-options">
            {RUOLI.map(r => {
              const id = utente?.[r.key];
              if (!id) return null;
              const personaggio = personaggi.find(p => p.id === id);
              const attivo = utente?.capitano === r.key;
              return (
                <button
                  key={r.key}
                  className={`capitano-opt ${attivo ? 'attivo' : ''}`}
                  disabled={salvandoCapitano}
                  onClick={() => scegliCapitano(r.key)}
                >
                  <span>{r.emoji}</span>
                  <span>{personaggio?.nome || id}</span>
                  {attivo && <span className="capitano-opt-check">⭐</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

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
