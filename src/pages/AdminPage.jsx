import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SQUADRE_ORATORIO, SQUADRE_LABEL } from '../context/DataContext';

// ── helpers localStorage ──────────────────────────────────────────────────────
function loadAdminState() {
  try { return JSON.parse(localStorage.getItem('fa_admin_v2') || '{}'); } catch { return {}; }
}
function saveAdminState(s) {
  localStorage.setItem('fa_admin_v2', JSON.stringify(s));
}
function getGiornata(state, g) {
  if (!state[g]) state[g] = { voti: {}, bonusMalus: [] };
  return state[g];
}

// ── CSV helpers ───────────────────────────────────────────────────────────────
function csvEscape(v) {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
}
function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);
  return { toast, show };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { logout } = useAuth();
  const { personaggi } = useData();

  const [adminState, setAdminState] = useState(loadAdminState);
  const [giornata, setGiornata]     = useState('');
  const [nuovaG, setNuovaG]         = useState('');
  const [tab, setTab]               = useState('voti');
  const [filtroRuolo, setFiltroRuolo] = useState('tutti');
  const [regolamento, setRegolamento] = useState([]);
  const { toast, show: showToast }  = useToast();

  // carica regolamento.csv
  useEffect(() => {
    const base = process.env.PUBLIC_URL || '';
    fetch(`${base}/data/regolamento.csv?t=${Date.now()}`)
      .then(r => r.text())
      .then(text => {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim());
          const obj = {};
          headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
          return obj;
        });
        setRegolamento(rows);
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((newState) => {
    setAdminState(newState);
    saveAdminState(newState);
  }, []);

  const giornateList = Object.keys(adminState).map(Number).sort((a, b) => a - b);
  const datiG = giornata ? getGiornata({ ...adminState }, giornata) : null;

  function creaGiornata() {
    const n = parseInt(nuovaG);
    if (!n || n < 1 || n > 99) { showToast('Numero non valido (1-99)', 'err'); return; }
    if (adminState[n]) { showToast(`Giornata ${n} già esistente`, 'err'); return; }
    const s = { ...adminState };
    s[n] = { voti: {}, bonusMalus: [] };
    persist(s);
    setGiornata(n);
    setNuovaG('');
    showToast(`Giornata ${n} creata!`);
  }

  function setVoto(id, val) {
    const s = { ...adminState };
    const g = getGiornata(s, giornata);
    if (val === '' || val === null || isNaN(parseFloat(val))) delete g.voti[id];
    else g.voti[id] = parseFloat(val);
    persist(s);
  }

  function autofill() {
    const s = { ...adminState };
    const g = getGiornata(s, giornata);
    SQUADRE_ORATORIO.forEach(sq => { if (g.voti[sq] === undefined) g.voti[sq] = 6.0; });
    persist(s);
    showToast('Voti mancanti impostati a 6.0');
  }

  function resetVoti() {
    if (!window.confirm('Cancellare tutti i voti di questa giornata?')) return;
    const s = { ...adminState };
    s[giornata] = { ...s[giornata], voti: {} };
    persist(s);
    showToast('Voti eliminati');
  }

  function aggiungiBonus(item) {
    const s = { ...adminState };
    const g = getGiornata(s, giornata);
    g.bonusMalus = [...g.bonusMalus, item];
    persist(s);
    showToast(`${item.tipo === 'bonus' ? 'Bonus' : 'Malus'} aggiunto!`);
  }

  function rimuoviBonus(idx) {
    const s = { ...adminState };
    const g = getGiornata(s, giornata);
    g.bonusMalus = g.bonusMalus.filter((_, i) => i !== idx);
    persist(s);
  }

  function exportVotazioni() {
    if (!datiG) return;
    const rows = [['id_squadra', 'giorno', 'voto_base']];
    Object.entries(datiG.voti).forEach(([id, v]) => rows.push([id, giornata, v]));
    if (rows.length === 1) { showToast('Nessun voto da esportare', 'err'); return; }
    downloadCSV(`votazioni_g${giornata}.csv`, rows);
    showToast(`votazioni_g${giornata}.csv scaricato`);
  }

  function exportBonusMalus() {
    if (!datiG) return;
    const rows = [['id_personaggio', 'giorno', 'punti', 'descrizione', 'tipo']];
    datiG.bonusMalus.forEach(b => {
      const segno = b.tipo === 'bonus' ? '+' : '-';
      rows.push([b.id, giornata, `${segno}${Math.abs(b.punti)}`, b.desc, b.tipo]);
    });
    if (rows.length === 1) { showToast('Nessun bonus/malus da esportare', 'err'); return; }
    downloadCSV(`bonus_malus_g${giornata}.csv`, rows);
    showToast(`bonus_malus_g${giornata}.csv scaricato`);
  }

  const nVoti   = datiG ? Object.keys(datiG.voti).length : 0;
  const nBonus  = datiG ? datiG.bonusMalus.filter(b => b.tipo === 'bonus').length : 0;
  const nMalus  = datiG ? datiG.bonusMalus.filter(b => b.tipo === 'malus').length : 0;

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.header}>
        <span style={S.logo}>🏆 Admin – Fanta Oratorio</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {giornata && <span style={S.headerInfo}>Giornata {giornata}</span>}
          <button style={S.logoutBtn} onClick={logout}>Esci</button>
        </div>
      </div>

      <div style={S.container}>
        {/* GIORNATA BAR */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={S.label}>📅 Giornata:</span>
            <select style={S.select} value={giornata} onChange={e => setGiornata(parseInt(e.target.value) || '')}>
              <option value="">-- Seleziona --</option>
              {giornateList.map(g => <option key={g} value={g}>Giornata {g}</option>)}
            </select>
            <span style={{ color: '#475569', fontSize: 13 }}>oppure crea:</span>
            <input
              type="number" min="1" max="99" placeholder="es. 3"
              value={nuovaG} onChange={e => setNuovaG(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && creaGiornata()}
              style={{ ...S.select, width: 80 }}
            />
            <button style={S.btnPrimary} onClick={creaGiornata}>+ Crea</button>
          </div>
        </div>

        {!giornata ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <h2 style={{ color: '#94a3b8' }}>Seleziona o crea una giornata</h2>
          </div>
        ) : (
          <>
            {/* STATS */}
            <div style={S.statsRow}>
              <StatCard label="Voti inseriti" value={nVoti} sub="su 4 squadre" color="#f59e0b" />
              <StatCard label="Bonus" value={nBonus} sub="assegnati" color="#4ade80" />
              <StatCard label="Malus" value={nMalus} sub="assegnati" color="#f87171" />
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {['voti', 'bonus'].map(t => (
                <button key={t} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}
                  onClick={() => setTab(t)}>
                  {t === 'voti' ? '📊 Voti' : '⭐ Bonus / Malus'}
                </button>
              ))}
            </div>

            {tab === 'voti' && (
              <VotiTab
                voti={datiG.voti}
                onSetVoto={setVoto}
                onReset={resetVoti}
              />
            )}
            {tab === 'bonus' && (
              <BonusMalusTab
                personaggi={personaggi}
                bonusMalus={datiG.bonusMalus}
                regolamento={regolamento}
                onAggiungi={aggiungiBonus}
                onRimuovi={rimuoviBonus}
              />
            )}

            {/* EXPORT */}
            <div style={{ ...S.card, marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>📥 Esporta CSV – Giornata {giornata}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>File pronti da caricare sul sito</div>
              </div>
              <button style={S.btnGreen} onClick={exportVotazioni}>⬇ votazioni.csv</button>
              <button style={S.btnOutline} onClick={exportBonusMalus}>⬇ bonus_malus.csv</button>
              <button style={S.btnOutline} onClick={() => { exportVotazioni(); setTimeout(exportBonusMalus, 300); }}>
                ⬇ Entrambi
              </button>
            </div>
          </>
        )}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          ...S.toast,
          background: toast.type === 'err' ? '#ef4444' : '#22c55e',
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

// ─── VotiTab ─────────────────────────────────────────────────────────────────
// Il voto base viene assegnato alla squadra oratorio (leoni/gechi/aquile/squali),
// non ai singoli personaggi.
function VotiTab({ voti, onSetVoto, onReset }) {
  return (
    <div style={S.sectionCard}>
      <div style={S.sectionHeader}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Voto Base Squadre</span>
        <button style={{ ...S.btnOutline, color: '#f87171', borderColor: '#f87171' }} onClick={onReset}>Reset</button>
      </div>
      <div style={{ padding: '8px 0' }}>
        {SQUADRE_ORATORIO.map(sq => {
          const info = SQUADRE_LABEL[sq];
          const v = voti[sq];
          return (
            <div key={sq} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px', borderBottom: '1px solid #1a2133',
            }}>
              <span style={{ fontSize: 28 }}>{info.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: 17, color: info.colore, minWidth: 80 }}>
                {info.label}
              </span>
              <input
                type="number" min="0" max="10" step="0.5"
                defaultValue={v ?? ''}
                placeholder="—"
                onBlur={e => onSetVoto(sq, e.target.value)}
                style={{
                  ...S.votoInput,
                  width: 100,
                  borderColor: v !== undefined ? info.colore + '88' : '#334155',
                  background: v !== undefined ? info.colore + '11' : '#0f172a',
                  color: info.colore,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              />
              {v !== undefined && (
                <span style={{ color: '#64748b', fontSize: 13 }}>punti assegnati</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BonusMalusTab ────────────────────────────────────────────────────────────
function BonusMalusTab({ personaggi, bonusMalus, regolamento, onAggiungi, onRimuovi }) {
  const [personaggioId, setPersonaggioId] = useState('');
  const [customPunti, setCustomPunti]     = useState('');
  const [customDesc, setCustomDesc]       = useState('');
  const [customTipo, setCustomTipo]       = useState('bonus');
  const [modalOpen, setModalOpen]         = useState(false);

  const personaggio = personaggi.find(p => p.id === personaggioId);

  // Mappa ruolo CSV → categoria regolamento
  const catMap = {
    educatore: 'Educatore',
    animatore: 'Animatore',
    'pre animatore': 'Pre animatore',
    'amico san carlo': 'Amico di San Carlo',
  };
  const presets = personaggio
    ? regolamento.filter(r => r.categoria === catMap[personaggio.ruolo])
    : [];

  function handlePreset(preset) {
    const tipo = preset.tipo;
    const punti = Math.abs(parseFloat(preset.punti));
    onAggiungi({ id: personaggioId, punti, desc: preset.descrizione, tipo });
  }

  function handleCustom() {
    const punti = parseFloat(customPunti);
    if (!personaggioId) return;
    if (!punti || punti <= 0) return;
    if (!customDesc.trim()) return;
    onAggiungi({ id: personaggioId, punti, desc: customDesc.trim(), tipo: customTipo });
    setCustomPunti(''); setCustomDesc('');
    setModalOpen(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Selezione personaggio */}
      <div style={S.sectionCard}>
        <div style={S.sectionHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>1 — Scegli personaggio</span>
        </div>
        <div style={{ padding: 16 }}>
          <select
            style={{ ...S.select, width: '100%', maxWidth: 400 }}
            value={personaggioId}
            onChange={e => setPersonaggioId(e.target.value)}
          >
            <option value="">-- Seleziona personaggio --</option>
            {[
              { ruolo: 'educatore', label: 'Educatori' },
              { ruolo: 'pre animatore', label: 'Pre-animatori' },
              { ruolo: 'animatore', label: 'Animatori' },
              { ruolo: 'amico san carlo', label: 'Amici di San Carlo' },
            ].map(({ ruolo, label }) => (
              <optgroup key={ruolo} label={label}>
                {personaggi.filter(p => p.ruolo === ruolo).map(p => (
                  <option key={p.id} value={p.id}>[{p.id}] {p.nome}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* PRESET dal regolamento */}
        {personaggioId && (
          <div style={{ borderTop: '1px solid #1e293b' }}>
            <div style={{ padding: '12px 16px 4px', color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              2 — Seleziona dal regolamento ({catMap[personaggio?.ruolo] || ''})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {presets.filter(r => r.tipo === 'bonus').length > 0 && (
                <div style={{ padding: '8px 16px 4px', color: '#4ade80', fontSize: 11, fontWeight: 700 }}>BONUS</div>
              )}
              {presets.filter(r => r.tipo === 'bonus').map((r, i) => (
                <PresetRow key={i} preset={r} onAdd={() => handlePreset(r)} />
              ))}
              {presets.filter(r => r.tipo === 'malus').length > 0 && (
                <div style={{ padding: '8px 16px 4px', color: '#f87171', fontSize: 11, fontWeight: 700 }}>MALUS</div>
              )}
              {presets.filter(r => r.tipo === 'malus').map((r, i) => (
                <PresetRow key={i} preset={r} onAdd={() => handlePreset(r)} />
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
              <button style={S.btnOutline} onClick={() => setModalOpen(true)}>
                ✏️ Aggiungi personalizzato
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal custom */}
      {modalOpen && (
        <div style={S.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={S.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Bonus / Malus personalizzato</div>
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>Tipo</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {['bonus', 'malus'].map(t => (
                  <button key={t} onClick={() => setCustomTipo(t)}
                    style={{
                      ...S.filterBtn,
                      ...(customTipo === t
                        ? t === 'bonus'
                          ? { borderColor: '#22c55e', background: '#22c55e22', color: '#4ade80' }
                          : { borderColor: '#ef4444', background: '#ef444422', color: '#f87171' }
                        : {})
                    }}>
                    {t === 'bonus' ? '+ Bonus' : '− Malus'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>Punti</div>
              <input type="number" min="0.5" max="10" step="0.5" placeholder="es. 2"
                value={customPunti} onChange={e => setCustomPunti(e.target.value)}
                style={{ ...S.select, width: 100, marginTop: 6 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={S.label}>Descrizione</div>
              <input type="text" placeholder="Motivo del bonus/malus"
                value={customDesc} onChange={e => setCustomDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustom()}
                style={{ ...S.select, width: '100%', marginTop: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={S.btnPrimary} onClick={handleCustom}>Aggiungi</button>
              <button style={S.btnOutline} onClick={() => setModalOpen(false)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista bonus/malus inseriti */}
      <div style={S.sectionCard}>
        <div style={S.sectionHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Bonus / Malus inseriti ({bonusMalus.length})</span>
        </div>
        {bonusMalus.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Nessuno ancora</div>
        ) : (
          bonusMalus.map((b, i) => {
            const p = personaggi.find(x => x.id === b.id);
            return (
              <div key={i} style={S.bonusItem}>
                <span style={{
                  ...S.bonusBadge,
                  ...(b.tipo === 'bonus'
                    ? { background: '#16a34a22', color: '#4ade80', borderColor: '#16a34a44' }
                    : { background: '#dc262622', color: '#f87171', borderColor: '#dc262644' })
                }}>
                  {b.tipo === 'bonus' ? '+' : '-'}{b.punti}
                </span>
                <span style={{ fontWeight: 600, minWidth: 160, fontSize: 14 }}>{p ? p.nome : b.id}</span>
                <span style={{ color: '#94a3b8', fontSize: 13, flex: 1 }}>{b.desc}</span>
                <button style={S.btnDanger} onClick={() => onRimuovi(i)}>✕</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── PresetRow ────────────────────────────────────────────────────────────────
function PresetRow({ preset, onAdd }) {
  const isBonus = preset.tipo === 'bonus';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderBottom: '1px solid #0f172a',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#162032'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>{preset.emoji}</span>
      <span style={{
        minWidth: 40, textAlign: 'center', fontWeight: 700, fontSize: 13,
        color: isBonus ? '#4ade80' : '#f87171'
      }}>
        {preset.punti}
      </span>
      <span style={{ flex: 1, fontSize: 13, color: '#cbd5e1' }}>{preset.descrizione}</span>
      <button
        style={{
          padding: '4px 14px', borderRadius: 6, border: 'none',
          background: isBonus ? '#16a34a' : '#dc2626',
          color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        onClick={onAdd}
      >
        + Aggiungi
      </button>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={S.statCard}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ─── RuoloBadge ──────────────────────────────────────────────────────────────
function RuoloBadge({ ruolo }) {
  const styles = {
    educatore:         { background: '#7c3aed22', color: '#a78bfa', border: '1px solid #7c3aed44' },
    animatore:         { background: '#0369a122', color: '#38bdf8', border: '1px solid #0369a144' },
    'pre animatore':   { background: '#05966922', color: '#34d399', border: '1px solid #05966944' },
    'amico san carlo': { background: '#ec489922', color: '#f472b6', border: '1px solid #ec489944' },
  };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
      fontSize: 11, fontWeight: 600, ...styles[ruolo],
    }}>
      {ruolo}
    </span>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:       { minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: "'Segoe UI', sans-serif" },
  header:     { background: '#1e293b', borderBottom: '1px solid #334155', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:       { fontSize: 18, fontWeight: 700, color: '#f59e0b' },
  headerInfo: { color: '#94a3b8', fontSize: 13 },
  logoutBtn:  { padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 },
  container:  { maxWidth: 1000, margin: '0 auto', padding: 24 },
  card:       { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '18px 20px', marginBottom: 16 },
  statsRow:   { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 },
  statCard:   { background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '14px 18px' },
  sectionCard:{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden', marginBottom: 0 },
  sectionHeader: { padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  tab:        { padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#94a3b8', border: '1px solid transparent', background: 'transparent' },
  tabActive:  { background: '#f59e0b', color: '#0f172a', borderColor: '#f59e0b' },
  select:     { padding: '8px 12px', borderRadius: 8, border: '2px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 14, outline: 'none' },
  label:      { color: '#94a3b8', fontSize: 13, fontWeight: 600 },
  th:         { padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #334155' },
  td:         { padding: '9px 14px', fontSize: 14 },
  votoInput:  { width: 80, padding: '6px 10px', borderRadius: 6, border: '2px solid', background: '#0f172a', color: '#e2e8f0', fontSize: 14, textAlign: 'center', outline: 'none' },
  bonusItem:  { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #162032', gap: 10 },
  bonusBadge: { minWidth: 48, textAlign: 'center', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 13, border: '1px solid' },
  btnPrimary: { padding: '8px 18px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  btnGreen:   { padding: '8px 18px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  btnOutline: { padding: '8px 18px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#e2e8f0', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnDanger:  { padding: '4px 12px', borderRadius: 6, border: 'none', background: '#ef4444', color: 'white', fontSize: 12, cursor: 'pointer' },
  filterBtn:  { padding: '4px 12px', borderRadius: 20, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 },
  filterBtnActive: { background: '#334155', color: '#e2e8f0' },
  emptyState: { textAlign: 'center', padding: '80px 20px' },
  modalOverlay: { position: 'fixed', inset: 0, background: '#00000099', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalCard:  { background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw' },
  toast:      { position: 'fixed', bottom: 24, right: 24, color: '#0f172a', padding: '12px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, zIndex: 2000 },
};
