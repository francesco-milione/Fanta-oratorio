import React from 'react';
import { SQUADRE_LABEL } from '../context/DataContext';
import { mergeBonusMalus } from '../utils/mergeBonusMalus';

const RUOLO_CONFIG = {
  educatore:         { label: 'Educatore',       emoji: '🙏',  color: '#6c63ff' },
  animatore:         { label: 'Animatore',        emoji: '🎮',  color: '#f59e0b' },
  'pre animatore':   { label: 'Pre Animatore',    emoji: '🌱',  color: '#10b981' },
  'amico san carlo': { label: 'Amico San Carlo',  emoji: '✝️',  color: '#ec4899' },
};

// Card per i singoli personaggi: mostra solo bonus/malus (niente voto base)
export function PersonaggioCard({ id, nome, ruolo, score }) {
  const cfg = RUOLO_CONFIG[ruolo] || { label: ruolo, emoji: '👤', color: '#888' };
  const bm = score?.totaleBM ?? 0;

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
        <span className="score-big" style={{ color: bm < 0 ? '#ef4444' : bm > 0 ? '#10b981' : '#888' }}>
          {bm > 0 ? '+' : ''}{bm.toFixed(1)}
        </span>
        <span className="score-sub">bonus/malus</span>
      </div>
    </div>
  );
}

// Card per la squadra oratorio: mostra voto base + bonus/malus
export function SquadraCard({ squadraOratorio, squadraScore }) {
  const info = SQUADRE_LABEL[squadraOratorio];
  if (!info) return null;
  const voto = squadraScore?.votoBase ?? 0;
  const bm = squadraScore?.totaleBM ?? 0;
  const totale = squadraScore?.totale ?? 0;

  return (
    <div className="personaggio-card">
      <div className="personaggio-avatar" style={{ background: info.colore + '22', borderColor: info.colore }}>
        <span style={{ fontSize: 22 }}>{info.emoji}</span>
      </div>
      <div className="personaggio-info">
        <span className="personaggio-ruolo" style={{ color: info.colore }}>Squadra Oratorio</span>
        <span className="personaggio-nome">{info.label}</span>
        {(bm !== 0) && (
          <span style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            voto {voto.toFixed(1)} {bm > 0 ? '+' : ''}{bm.toFixed(1)} bm
          </span>
        )}
      </div>
      <div className="personaggio-score">
        <span className="score-big" style={{ color: totale < 0 ? '#ef4444' : totale > 0 ? '#10b981' : '#888' }}>
          {totale.toFixed(1)}
        </span>
        <span className="score-sub">{squadraScore?.numGiorni ?? 0} gior.</span>
      </div>
    </div>
  );
}

export function PersonaggioDettaglioCard({ personaggio, bonusMalus, giorno }) {
  const bm = bonusMalus.filter(b => b.id_personaggio === personaggio.id && b.giorno === String(giorno));

  return (
    <div className="personaggio-dettaglio-card">
      <div className="pd-header">
        <span className="pd-nome">{personaggio.nome}</span>
        <span className="pd-ruolo">{personaggio.ruolo}</span>
      </div>
      {bm.length > 0 ? (
        <div className="pd-bm">
          {mergeBonusMalus(bm).map((b, i) => {
            const pts = parseFloat((b.punti || '0').replace('+', '')) * b.count;
            return (
              <div key={i} className={`bm-row ${b.tipo === 'bonus' ? 'bonus' : 'malus'}`}>
                <span>{b.tipo === 'bonus' ? '✅' : '❌'} {b.descrizione}{b.count > 1 ? ` ×${b.count}` : ''}</span>
                <span className="bm-pts">{pts > 0 ? '+' : ''}{pts}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pd-empty">Nessun bonus/malus per questo giorno</div>
      )}
    </div>
  );
}
