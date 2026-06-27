import React, { useState, useEffect } from 'react';

const BASE = process.env.PUBLIC_URL || '';

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
  const [voci, setVoci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaAttiva, setCategoriaAttiva] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/data/regolamento.csv?t=${Date.now()}`)
      .then(r => { if (!r.ok) throw new Error('File non trovato'); return r.text(); })
      .then(text => { setVoci(parseCSV(text)); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const categorie = [...new Set(voci.map(v => v.categoria).filter(Boolean))];
  const vociFiltrate = categoriaAttiva ? voci.filter(v => v.categoria === categoriaAttiva) : voci;
  const bonus = vociFiltrate.filter(v => v.tipo === 'bonus');
  const malus = vociFiltrate.filter(v => v.tipo === 'malus');

  const maxBonus = voci.filter(v => v.tipo === 'bonus').reduce((max, v) => {
    const p = parseFloat((v.punti || '0').replace('+', ''));
    return p > max ? p : max;
  }, 0);
  const maxMalus = voci.filter(v => v.tipo === 'malus').reduce((min, v) => {
    const p = parseFloat((v.punti || '0').replace('+', ''));
    return p < min ? p : min;
  }, 0);

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
        <p>Aggiungi il file <code>public/data/regolamento.csv</code> al progetto per visualizzare il regolamento dei bonus e malus.</p>
        <div className="reg-csv-example">
          <p className="reg-csv-title">Formato del file:</p>
          <pre>{`tipo,punti,descrizione,categoria,emoji\nbonus,+3,Ha aiutato un compagno in difficoltà,Comportamento,🤝\nmalus,-2,Ritardo alle attività,Puntualità,⏰`}</pre>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>📋 Regolamento</h2>
        <p className="page-subtitle">Come si guadagnano (e perdono) i punti</p>
      </div>

      {/* Intestazione oratorio */}
      <div className="reg-oratorio-banner">
        <div className="reg-oratorio-icon">✝️</div>
        <div>
          <div className="reg-oratorio-nome">Oratorio San Carlo Acutis</div>
          <div className="reg-oratorio-luogo">Rotonda</div>
        </div>
        <div className="reg-oratorio-anno">Estate 2026</div>
      </div>

      {/* Come funziona */}
      <div className="reg-intro-card">
        <p>Ogni personaggio della tua squadra riceve ogni sera un <strong>voto base</strong> dalla staff (come una pagella!) e può guadagnare o perdere punti extra tramite <strong>bonus e malus</strong> per episodi speciali della giornata.</p>
        <p style={{marginTop: 10}}>Il punteggio della tua squadra è la <strong>somma dei punteggi di tutti e 6 i tuoi personaggi</strong>.</p>
      </div>

      {/* Pillole statistiche */}
      <div className="reg-stats">
        <div className="reg-stat green">
          <span className="reg-stat-num">+{maxBonus}</span>
          <span className="reg-stat-label">massimo bonus singolo</span>
        </div>
        <div className="reg-stat purple">
          <span className="reg-stat-num">{voci.filter(v=>v.tipo==='bonus').length}</span>
          <span className="reg-stat-label">tipi di bonus</span>
        </div>
        <div className="reg-stat red">
          <span className="reg-stat-num">{voci.filter(v=>v.tipo==='malus').length}</span>
          <span className="reg-stat-label">tipi di malus</span>
        </div>
        <div className="reg-stat orange">
          <span className="reg-stat-num">{maxMalus}</span>
          <span className="reg-stat-label">massimo malus singolo</span>
        </div>
      </div>

      {/* Filtro categorie */}
      {categorie.length > 1 && (
        <div className="giorni-filter" style={{ marginBottom: 24 }}>
          <button className={`giorno-btn ${categoriaAttiva === null ? 'active' : ''}`} onClick={() => setCategoriaAttiva(null)}>Tutte</button>
          {categorie.map(cat => (
            <button key={cat} className={`giorno-btn ${categoriaAttiva === cat ? 'active' : ''}`} onClick={() => setCategoriaAttiva(cat)}>{cat}</button>
          ))}
        </div>
      )}

      {/* Bonus */}
      {bonus.length > 0 && (
        <section className="section">
          <h3 className="section-title">✅ Bonus — Come guadagnare punti</h3>
          <div className="reg-list">
            {bonus.map((v, i) => <RegVoce key={i} voce={v} />)}
          </div>
        </section>
      )}

      {/* Malus */}
      {malus.length > 0 && (
        <section className="section">
          <h3 className="section-title">❌ Malus — Come perdere punti</h3>
          <div className="reg-list">
            {malus.map((v, i) => <RegVoce key={i} voce={v} />)}
          </div>
        </section>
      )}

      {/* Nota finale */}
      <div className="reg-nota">
        <span>💡</span>
        <p>I bonus e malus vengono assegnati dalla staff a fine giornata. La staff ha sempre l'ultima parola e può aggiungere eventi speciali non presenti in questo elenco.</p>
      </div>

      {/* Footer oratorio */}
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
        {voce.categoria && <span className="reg-voce-cat">{voce.categoria}</span>}
      </div>
      <span className={`reg-voce-punti ${isBonus ? 'pos' : 'neg'}`}>{voce.punti}</span>
    </div>
  );
}
