import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SQUADRE_LABEL, RUOLO_EXTRA } from '../context/DataContext';
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
  const [salvandoExtra, setSalvandoExtra] = useState(false);
  const [assegnandoAuto, setAssegnandoAuto] = useState(false);
  const [cercaExtra, setCercaExtra] = useState('');

  const capitanoAttivo = !!impostazioni?.capitano_attivo;

  async function scegliCapitano(ruoloKey) {
    if (!utente?.codice || salvandoCapitano) return;
    setSalvandoCapitano(true);
    const { error } = await supabase.from('giocatori')
      .update({ capitano: ruoloKey }).eq('codice', utente.codice);
    setSalvandoCapitano(false);
    if (!error) reload();
  }

  // ── Giocatore extra: un personaggio in più a scelta, tra tutti tranne se
  // stesso e chi è già nella propria formazione (altre squadre possono avere
  // lo stesso extra, non c'è esclusività). Se non scelto entro la chiusura,
  // ne viene assegnato uno a caso automaticamente.
  const extraAttivo = !!impostazioni?.extra_attivo;
  const extraDeadline = impostazioni?.extra_deadline ? new Date(impostazioni.extra_deadline) : null;
  const extraChiuso = !!(extraDeadline && new Date() > extraDeadline);
  const giocatoreExtraId = utente?.giocatore_extra || null;

  const propriIds = useMemo(() => new Set(
    [utente?.educatore, utente?.animatore1, utente?.animatore2, utente?.['pre animatore'], utente?.['amico san carlo']]
      .filter(Boolean)
  ), [utente]);

  const poolExtra = useMemo(() => personaggi.filter(p =>
    p.id !== utente?.id_personaggio &&
    !propriIds.has(p.id)
  ), [personaggi, propriIds, utente]);

  const risultatiExtra = useMemo(() => poolExtra.filter(p =>
    p.nome.toLowerCase().includes(cercaExtra.toLowerCase()) || p.id.toLowerCase().includes(cercaExtra.toLowerCase())
  ), [poolExtra, cercaExtra]);

  async function scegliExtra(id) {
    if (!utente?.codice || salvandoExtra) return;
    setSalvandoExtra(true);
    const { error } = await supabase.from('giocatori')
      .update({ giocatore_extra: id }).eq('codice', utente.codice);
    setSalvandoExtra(false);
    if (!error) { setCercaExtra(''); reload(); }
  }

  // Assegnazione automatica alla chiusura: se il flag è attivo, la scadenza è
  // passata e la squadra non ha ancora scelto, assegna un extra a caso tra
  // quelli ancora liberi al primo caricamento dell'app.
  useEffect(() => {
    if (!extraAttivo || !extraChiuso) return;
    if (!utente?.codice || giocatoreExtraId) return;
    if (assegnandoAuto) return;
    if (poolExtra.length === 0) return;
    setAssegnandoAuto(true);
    const scelta = poolExtra[Math.floor(Math.random() * poolExtra.length)];
    supabase.from('giocatori').update({ giocatore_extra: scelta.id }).eq('codice', utente.codice)
      .then(({ error }) => {
        setAssegnandoAuto(false);
        if (!error) reload();
      });
  }, [extraAttivo, extraChiuso, utente?.codice, giocatoreExtraId]); // eslint-disable-line

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

  const renderExtra = () => {
    if (!giocatoreExtraId) return null;
    const personaggio = personaggi.find(p => p.id === giocatoreExtraId);
    const bm = getPersonaggioScore(giocatoreExtraId).totaleBM ?? 0;
    const bmList = getBmPerPersonaggio(giocatoreExtraId);
    const hasBm = bmList.length > 0;
    return (
      <div className="ms-card">
        <div
          className={`ms-card-header ${hasBm ? 'clickable' : ''}`}
          onClick={hasBm ? () => toggleAperto('giocatore_extra') : undefined}
        >
          <div className="personaggio-avatar" style={{ background: RUOLO_EXTRA.color + '22', borderColor: RUOLO_EXTRA.color }}>
            <span>{RUOLO_EXTRA.emoji}</span>
          </div>
          <div className="personaggio-info">
            <span className="personaggio-ruolo" style={{ color: RUOLO_EXTRA.color }}>{RUOLO_EXTRA.label}</span>
            <span className="personaggio-nome">{personaggio?.nome || giocatoreExtraId}</span>
          </div>
          <div className="personaggio-score">
            <span className="score-big" style={{ color: bm < 0 ? '#ef4444' : bm > 0 ? '#10b981' : '#888' }}>
              {bm > 0 ? '+' : ''}{bm.toFixed(1)}
            </span>
            <span className="score-sub">bonus/malus</span>
          </div>
          {hasBm && <span className="ms-arrow">{aperto['giocatore_extra'] ? '▲' : '▼'}</span>}
        </div>
        {renderBmList(bmList, 'giocatore_extra')}
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

      {/* Selezione giocatore extra: visibile solo quando l'admin attiva il flag */}
      {extraAttivo && !extraChiuso && (
        <section className="section">
          <h3 className="section-title">🎁 Scegli il tuo giocatore extra</h3>
          <div className="iscrizione-form-box">
            <p className="capitano-picker-hint" style={{ margin: '0 0 14px' }}>
              Puoi aggiungere un personaggio in più tra tutti, tranne te stesso e chi hai già nella tua squadra.
              {extraDeadline && (
                <> Scegli entro <strong>{extraDeadline.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })}</strong>,
                altrimenti te ne verrà assegnato uno a caso.</>
              )}
            </p>
            {giocatoreExtraId && (
              <div className="capitano-banner" style={{ marginBottom: 14 }}>
                ✓ Hai scelto <strong>{personaggi.find(p => p.id === giocatoreExtraId)?.nome || giocatoreExtraId}</strong> — puoi ancora cambiare idea finché la scelta resta aperta.
              </div>
            )}
            <div className="iscrizione-cerca-box" style={{ marginBottom: 10 }}>
              <input
                type="text" value={cercaExtra}
                onChange={e => setCercaExtra(e.target.value)}
                placeholder="🔍 Cerca per nome o codice…"
                className="iscrizione-cerca"
              />
              {cercaExtra && <button className="btn-ghost btn-sm" onClick={() => setCercaExtra('')}>✕</button>}
            </div>
            <div className="iscrizione-cards" style={{ maxHeight: 320, overflowY: 'auto' }}>
              {risultatiExtra.length === 0 && (
                <p className="iscrizione-empty">Nessun personaggio libero trovato.</p>
              )}
              {risultatiExtra.map(p => {
                const sel = giocatoreExtraId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`iscrizione-card ${sel ? 'selected' : ''} ${salvandoExtra ? 'disabled' : ''}`}
                    onClick={() => !salvandoExtra && scegliExtra(p.id)}
                  >
                    <div className="iscrizione-card-info">
                      <span className="iscrizione-card-nome">{p.nome}</span>
                      <span className="iscrizione-card-id">{p.id}</span>
                    </div>
                    <div className="iscrizione-card-right">
                      <span className="iscrizione-card-check">{sel ? '✓' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {extraAttivo && extraChiuso && !giocatoreExtraId && (
        <section className="section">
          <div className="capitano-banner">⏳ Scelta chiusa: ti stiamo assegnando un giocatore extra a caso…</div>
        </section>
      )}

      {/* Formazione con bonus/malus integrati */}
      <section className="section">
        <h3 className="section-title">La tua formazione</h3>
        <div className="ms-cards">
          {RUOLI.map(r => renderPersonaggio(r))}
          {renderExtra()}
          {renderSquadra()}
        </div>
      </section>
    </div>
  );
}
