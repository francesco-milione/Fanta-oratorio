import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const BASE = process.env.PUBLIC_URL || '';

const RUOLI = [
  { id: 'Educatore',          label: 'Educatore',          emoji: '📚', colore: '#8b5cf6' },
  { id: 'Pre animatore',      label: 'Pre animatore',      emoji: '🌱', colore: '#10b981' },
  { id: 'Animatore',          label: 'Animatore',          emoji: '🎭', colore: '#f59e0b' },
  { id: 'Amico di San Carlo', label: 'Amico di S. Carlo',  emoji: '✝️', colore: '#ec4899' },
  { id: 'Squadra',            label: 'Squadra',            emoji: '🏆', colore: '#3b82f6' },
  { id: 'Tutti',              label: 'Tutti',              emoji: '⭐', colore: '#64748b' },
];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; }
      else if (line[i] === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += line[i]; }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

export default function Regolamento() {
  const { utente } = useAuth();
  const [voci, setVoci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ruoloAttivo, setRuoloAttivo] = useState('Educatore');
  const [bannerVisible, setBannerVisible] = useState(() => {
    return sessionStorage.getItem('reg_banner_closed') !== '1';
  });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackTesto, setFeedbackTesto] = useState('');
  const [feedbackStato, setFeedbackStato] = useState(null); // null | 'loading' | 'ok' | 'error'

  const chiudiBanner = () => {
    setBannerVisible(false);
    sessionStorage.setItem('reg_banner_closed', '1');
  };

  const inviaFeedback = async () => {
    if (!feedbackTesto.trim()) return;
    setFeedbackStato('loading');
    const { error } = await supabase.from('feedback').insert({
      utente_codice: utente?.codice || 'anonimo',
      testo: feedbackTesto.trim(),
    });
    if (error) {
      setFeedbackStato('error');
    } else {
      setFeedbackStato('ok');
      setFeedbackTesto('');
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackStato(null);
      }, 2000);
    }
  };

  useEffect(() => {
    fetch(`${BASE}/data/regolamento.csv?t=${Date.now()}`)
      .then(r => { if (!r.ok) throw new Error('File non trovato'); return r.text(); })
      .then(text => { setVoci(parseCSV(text)); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const vociFiltrate = voci.filter(v => v.categoria === ruoloAttivo);
  const bonus = vociFiltrate.filter(v => v.tipo === 'bonus');
  const malus = vociFiltrate.filter(v => v.tipo === 'malus');
  const ruoloInfo = RUOLI.find(r => r.id === ruoloAttivo);

  if (loading) return (
    <div className="page">
      <div className="empty-state"><div className="spinner" style={{margin:'0 auto 12px'}} /><p>Caricamento regolamento…</p></div>
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="reg-error-card">
        <span>📭</span>
        <h3>Regolamento non ancora caricato</h3>
        <p>Aggiungi il file <code>public/data/regolamento.csv</code> al progetto.</p>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>📋 Regolamento</h2>
        <p className="page-subtitle">Come si guadagnano (e perdono) i punti</p>
      </div>

      {/* Banner "regole non ufficiali" */}
      {bannerVisible && (
        <div style={{
          background: '#fef9c3',
          border: '1px solid #fbbf24',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          position: 'relative',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#78350f', fontWeight: 600 }}>
              Queste non sono ancora le regole ufficiali!
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#92400e' }}>
              Il regolamento è ancora in definizione. Hai idee o suggerimenti?{' '}
              <button
                onClick={() => setFeedbackOpen(true)}
                style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 13 }}
              >
                Lascia un feedback
              </button>
              , lo leggeremo!
            </p>
          </div>
          <button
            onClick={chiudiBanner}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#b45309', lineHeight: 1, padding: 0, flexShrink: 0 }}
            title="Chiudi"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form feedback inline */}
      {feedbackOpen && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px',
          marginBottom: 16,
        }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14 }}>💬 Suggerisci una regola</p>
          <textarea
            value={feedbackTesto}
            onChange={e => setFeedbackTesto(e.target.value)}
            placeholder="Scrivi il tuo suggerimento..."
            rows={3}
            disabled={feedbackStato === 'loading' || feedbackStato === 'ok'}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              borderRadius: 8,
              border: '1px solid var(--border)',
              padding: '10px 12px',
              fontSize: 14,
              background: 'var(--bg)',
              color: 'var(--text)',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <button
              onClick={inviaFeedback}
              disabled={!feedbackTesto.trim() || feedbackStato === 'loading' || feedbackStato === 'ok'}
              style={{
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                opacity: (!feedbackTesto.trim() || feedbackStato === 'loading' || feedbackStato === 'ok') ? 0.6 : 1,
              }}
            >
              {feedbackStato === 'loading' ? '⏳ Invio…' : feedbackStato === 'ok' ? '✅ Inviato!' : '📤 Invia'}
            </button>
            <button
              onClick={() => { setFeedbackOpen(false); setFeedbackTesto(''); setFeedbackStato(null); }}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 14, cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              Annulla
            </button>
            {feedbackStato === 'error' && (
              <span style={{ fontSize: 13, color: '#ef4444' }}>Errore nell'invio, riprova.</span>
            )}
          </div>
        </div>
      )}

      {/* Pulsante feedback (sempre visibile se banner chiuso) */}
      {!bannerVisible && !feedbackOpen && (
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <button
            onClick={() => setFeedbackOpen(true)}
            style={{
              background: 'none',
              border: '1px solid #fbbf24',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 13,
              color: '#b45309',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            💬 Suggerisci una regola
          </button>
        </div>
      )}

      {/* Banner oratorio */}
      <div className="reg-oratorio-banner">
        <div className="reg-oratorio-icon">✝️</div>
        <div>
          <div className="reg-oratorio-nome">Oratorio San Carlo Acutis</div>
          <div className="reg-oratorio-luogo">Rotonda</div>
        </div>
        <div className="reg-oratorio-anno">Estate 2026</div>
      </div>

      {/* Intro */}
      <div className="reg-intro-card">
        <p>Ogni personaggio riceve ogni sera un <strong>voto base</strong> dalla staff e può guadagnare o perdere punti extra con <strong>bonus e malus</strong> per gli episodi speciali della giornata.</p>
        <p style={{marginTop: 10}}>Il punteggio della squadra è la <strong>somma dei punteggi di tutti e 5 i personaggi</strong> più i <strong>punti della squadra oratorio</strong> scelta (Leoni, Gechi, Aquile o Squali).</p>
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <strong>Formazione:</strong> 1 Educatore · 1 Pre animatore · 2 Animatori · 1 Amico di San Carlo + Squadra oratorio
        </div>
      </div>

      {/* Tab ruoli */}
      <div className="reg-ruoli-tabs" style={{ flexWrap: 'wrap' }}>
        {RUOLI.map(r => (
          <button
            key={r.id}
            className={`reg-ruolo-tab ${ruoloAttivo === r.id ? 'active' : ''}`}
            style={ruoloAttivo === r.id ? { borderColor: r.colore, color: r.colore, background: r.colore + '18' } : {}}
            onClick={() => setRuoloAttivo(r.id)}
          >
            <span className="reg-ruolo-tab-emoji">{r.emoji}</span>
            <span>{r.label}</span>
          </button>
        ))}
      </div>

      {/* Titolo sezione ruolo */}
      <div className="reg-ruolo-header" style={{borderLeftColor: ruoloInfo?.colore}}>
        <span style={{fontSize: 28}}>{ruoloInfo?.emoji}</span>
        <div>
          <h3 style={{margin: 0, color: ruoloInfo?.colore}}>Bonus &amp; Malus — {ruoloInfo?.label}</h3>
          <p style={{margin: 0, fontSize: 13, color: '#888'}}>
            {bonus.length} azioni positive · {malus.length} azioni negative
          </p>
        </div>
      </div>

      {/* Bonus */}
      {bonus.length > 0 && (
        <section className="section">
          <h3 className="section-title">✅ Bonus — Punti guadagnati</h3>
          <div className="reg-list">
            {bonus.map((v, i) => <RegVoce key={i} voce={v} />)}
          </div>
        </section>
      )}

      {/* Malus */}
      {malus.length > 0 && (
        <section className="section">
          <h3 className="section-title">❌ Malus — Punti persi</h3>
          <div className="reg-list">
            {malus.map((v, i) => <RegVoce key={i} voce={v} />)}
          </div>
        </section>
      )}

      {/* Nota */}
      <div className="reg-nota">
        <span>💡</span>
        <p>I bonus e malus vengono assegnati dalla staff a fine giornata. La staff ha sempre l'ultima parola e può aggiungere eventi speciali non in elenco.</p>
      </div>

      {/* Footer */}
      <div className="reg-footer">
        <span>⛪</span>
        <span>Oratorio San Carlo Acutis — Rotonda</span>
      </div>
    </div>
  );
}

function RegVoce({ voce }) {
  const isBonus = voce.tipo === 'bonus';
  return (
    <div className={`reg-voce ${isBonus ? 'bonus' : 'malus'}`}>
      <span className="reg-voce-emoji">{voce.emoji || (isBonus ? '✅' : '❌')}</span>
      <div className="reg-voce-content">
        <span className="reg-voce-desc">{voce.descrizione}</span>
      </div>
      <span className={`reg-voce-punti ${isBonus ? 'pos' : 'neg'}`}>{voce.punti}</span>
    </div>
  );
}
