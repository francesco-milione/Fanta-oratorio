import React from 'react';

const RUOLO_CONFIG = {
  educatore: { label: 'Educatore', emoji: '🙏', color: '#6c63ff' },
  animatore1: { label: 'Animatore', emoji: '🎮', color: '#f59e0b' },
  animatore2: { label: 'Animatore', emoji: '🎮', color: '#f59e0b' },
  bambino1: { label: 'Bambino', emoji: '⭐', color: '#10b981' },
  bambino2: { label: 'Bambino', emoji: '⭐', color: '#10b981' },
  bambino3: { label: 'Bambino', emoji: '⭐', color: '#10b981' },
};

export function PersonaggioCard({ id, nome, ruolo, score, giorno }) {
  const cfg = RUOLO_CONFIG[ruolo] || { label: ruolo, emoji: '👤', color: '#888' };
  const punteggio = giorno !== undefined
    ? (score?.votoGiorno ?? 0) + (score?.bonusMalusGiorno ?? 0)
    : score?.totale ?? 0;

  const segno = punteggio >= 0 ? '+' : '';

  return (
    <div className="personaggio-card">
      <div className="personaggio-avatar" style={{ background: cfg.color + '22', borderColor: cfg.color }}>
        <span>{cfg.emoji}</span>
      </div>
      <div className="personaggio-info">
        <span className="personaggio-ruolo" style={{ color: cfg.color }}>{cfg.label}</span>
        <span className="personaggio-nome">{nome || id}</span>
      </div>
      <div className="personaggio-score">
        <span className="score-big" style={{ color: punteggio < 0 ? '#ef4444' : '#10b981' }}>
          {giorno !== undefined ? `${segno}${punteggio.toFixed(1)}` : punteggio.toFixed(1)}
        </span>
        {giorno === undefined && score && (
          <span className="score-sub">{score.numGiorni} gior.</span>
        )}
      </div>
    </div>
  );
}

export function PersonaggioDettaglioCard({ personaggio, bonusMalus, votazioni, giorno }) {
  const voto = votazioni.find(v => v.id_personaggio === personaggio.id && v.giorno === String(giorno));
  const bm = bonusMalus.filter(b => b.id_personaggio === personaggio.id && b.giorno === String(giorno));

  return (
    <div className="personaggio-dettaglio-card">
      <div className="pd-header">
        <span className="pd-nome">{personaggio.nome}</span>
        <span className="pd-ruolo">{personaggio.ruolo}</span>
      </div>
      {voto && (
        <div className="pd-voto">
          <span>📊 Voto base</span>
          <span className="voto-num">{parseFloat(voto.voto_base).toFixed(1)}</span>
        </div>
      )}
      {bm.length > 0 && (
        <div className="pd-bm">
          {bm.map((b, i) => {
            const pts = parseFloat((b.punti || '0').replace('+', ''));
            return (
              <div key={i} className={`bm-row ${b.tipo === 'bonus' ? 'bonus' : 'malus'}`}>
                <span>{b.tipo === 'bonus' ? '✅' : '❌'} {b.descrizione}</span>
                <span className="bm-pts">{pts > 0 ? '+' : ''}{pts}</span>
              </div>
            );
          })}
        </div>
      )}
      {!voto && bm.length === 0 && (
        <div className="pd-empty">Nessun dato per questo giorno</div>
      )}
    </div>
  );
}
