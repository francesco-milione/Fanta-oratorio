import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SQUADRE_ORATORIO, SQUADRE_LABEL } from '../context/DataContext';
import { supabase } from '../supabaseClient';

// ── Categorie regolamento ────────────────────────────────────────────────────
const CATEGORIE = ['Educatore', 'Animatore', 'Pre animatore', 'Amico di San Carlo', 'Squadra', 'Tutti'];

const CAT_MAP = {
  educatore:         'Educatore',
  animatore:         'Animatore',
  'pre animatore':   'Pre animatore',
  'amico san carlo': 'Amico di San Carlo',
};

// Dati predefiniti (da regolamento.csv) per seeding iniziale
const REGOLAMENTO_DEFAULT = [
  { tipo:'bonus', punti:3,  descrizione:'Ha inventato un gioco che ha funzionato davvero (miracolo!)', categoria:'Animatore', emoji:'🎯' },
  { tipo:'bonus', punti:2,  descrizione:'Ha fatto ridere tutto il gruppo con una battuta', categoria:'Animatore', emoji:'😎' },
  { tipo:'bonus', punti:2,  descrizione:'Sapeva tutte le parole delle canzoni dell\'animazione', categoria:'Animatore', emoji:'🎶' },
  { tipo:'bonus', punti:3,  descrizione:'Ha guidato il suo gruppo portandolo a destinazione senza perdersi', categoria:'Animatore', emoji:'🐑' },
  { tipo:'bonus', punti:2,  descrizione:'Ha risolto una lite senza perdere la testa', categoria:'Animatore', emoji:'🧩' },
  { tipo:'bonus', punti:1,  descrizione:'Ha improvvisato un\'attività in 5 minuti ed è venuta benissimo', categoria:'Animatore', emoji:'⚡' },
  { tipo:'bonus', punti:3,  descrizione:'Ha fatto entusiasmare anche il più brontolone del gruppo', categoria:'Animatore', emoji:'🏆' },
  { tipo:'bonus', punti:2,  descrizione:'Ha dimostrato doti atletiche durante i giochi', categoria:'Animatore', emoji:'💪' },
  { tipo:'malus', punti:-2, descrizione:'Ha perso di vista il suo gruppo per più di 5 minuti', categoria:'Animatore', emoji:'😵' },
  { tipo:'malus', punti:-1, descrizione:'Beccato a dormire durante un\'attività (con gli occhi aperti però)', categoria:'Animatore', emoji:'☕' },
  { tipo:'malus', punti:-2, descrizione:'Ha urlato così forte da spaventare tutti', categoria:'Animatore', emoji:'📢' },
  { tipo:'malus', punti:-3, descrizione:'Trovato a giocare al telefono invece di animare', categoria:'Animatore', emoji:'🎮' },
  { tipo:'malus', punti:-1, descrizione:'Ha sbagliato le regole del gioco che aveva inventato lui stesso', categoria:'Animatore', emoji:'🤦' },
  { tipo:'malus', punti:-2, descrizione:'Ha promesso una cosa che poi non ha potuto mantenere', categoria:'Animatore', emoji:'🤥' },
  { tipo:'malus', punti:-1, descrizione:'Ha perso il filo dell\'attività ed è finita nel caos totale', categoria:'Animatore', emoji:'🌪️' },
  { tipo:'malus', punti:-2, descrizione:'Ha litigato con qualcuno del gruppo (e il gruppo aveva ragione)', categoria:'Animatore', emoji:'👦' },
  { tipo:'bonus', punti:3,  descrizione:'Ha tenuto un discorso motivazionale che ha emozionato tutti', categoria:'Educatore', emoji:'📣' },
  { tipo:'bonus', punti:2,  descrizione:'Ha sopravvissuto all\'intera giornata senza caffè (leggendario)', categoria:'Educatore', emoji:'☕' },
  { tipo:'bonus', punti:3,  descrizione:'Ha mantenuto la calma in una situazione di caos totale', categoria:'Educatore', emoji:'🧘' },
  { tipo:'bonus', punti:2,  descrizione:'Ha convinto tutti a partecipare senza usare la voce da sergente', categoria:'Educatore', emoji:'🏅' },
  { tipo:'bonus', punti:1,  descrizione:'Ha ricordato il nome di tutti senza sbagliare', categoria:'Educatore', emoji:'🧠' },
  { tipo:'bonus', punti:3,  descrizione:'Ha risolto un problema complicato con una soluzione geniale', categoria:'Educatore', emoji:'💡' },
  { tipo:'bonus', punti:2,  descrizione:'Ha aiutato un animatore in difficoltà senza farlo sentire giudicato', categoria:'Educatore', emoji:'🤝' },
  { tipo:'bonus', punti:1,  descrizione:'Ha fatto una cosa spontanea e bella per il gruppo', categoria:'Educatore', emoji:'✨' },
  { tipo:'malus', punti:-2, descrizione:'Ha perso il fischietto (di nuovo… ancora… sempre)', categoria:'Educatore', emoji:'😩' },
  { tipo:'malus', punti:-1, descrizione:'Ha fatto svolgere un\'attività sotto la pioggia per errore di valutazione', categoria:'Educatore', emoji:'🌧️' },
  { tipo:'malus', punti:-2, descrizione:'Ha dimenticato il codice del magazzino (terza volta questa settimana)', categoria:'Educatore', emoji:'🔑' },
  { tipo:'malus', punti:-3, descrizione:'Trovato a dormire durante la preghiera (con la bocca aperta)', categoria:'Educatore', emoji:'😴' },
  { tipo:'malus', punti:-1, descrizione:'Ha risposto al telefono durante un momento importante', categoria:'Educatore', emoji:'📞' },
  { tipo:'malus', punti:-2, descrizione:'Ha detto "ai miei tempi all\'oratorio…" per più di due minuti', categoria:'Educatore', emoji:'📻' },
  { tipo:'malus', punti:-1, descrizione:'Ha perso la lista presenze (quella che aveva appena stampato)', categoria:'Educatore', emoji:'📋' },
  { tipo:'malus', punti:-2, descrizione:'Ha fatto una regola sul momento e poi se l\'è dimenticata', categoria:'Educatore', emoji:'🤷' },
  { tipo:'bonus', punti:3,  descrizione:'Ha fatto da ponte tra pre-animatori e animatori con grande maturità', categoria:'Pre animatore', emoji:'🌉' },
  { tipo:'bonus', punti:2,  descrizione:'Ha preso iniziativa senza aspettare che qualcuno glielo dicesse', categoria:'Pre animatore', emoji:'🚀' },
  { tipo:'bonus', punti:2,  descrizione:'Ha gestito un piccolo gruppetto in autonomia e ha funzionato', categoria:'Pre animatore', emoji:'🌟' },
  { tipo:'bonus', punti:3,  descrizione:'Ha dimostrato di essere pronto per diventare animatore l\'anno prossimo', categoria:'Pre animatore', emoji:'📈' },
  { tipo:'bonus', punti:1,  descrizione:'Ha aiutato un animatore in difficoltà senza essere chiesto', categoria:'Pre animatore', emoji:'🤗' },
  { tipo:'bonus', punti:2,  descrizione:'Ha animato una canzone con più energia di tutti', categoria:'Pre animatore', emoji:'🎵' },
  { tipo:'malus', punti:-2, descrizione:'Ha confuso il suo ruolo e si è messo a fare il bambino', categoria:'Pre animatore', emoji:'👶' },
  { tipo:'malus', punti:-1, descrizione:'Ha aspettato le istruzioni invece di prendere iniziativa', categoria:'Pre animatore', emoji:'⏳' },
  { tipo:'malus', punti:-2, descrizione:'Ha litigato con qualcuno davanti ai ragazzi', categoria:'Pre animatore', emoji:'🥊' },
  { tipo:'malus', punti:-1, descrizione:'Ha usato il telefono mentre doveva animare', categoria:'Pre animatore', emoji:'📱' },
  { tipo:'malus', punti:-3, descrizione:'È sparito durante un\'attività senza avvisare nessuno', categoria:'Pre animatore', emoji:'👻' },
  { tipo:'malus', punti:-2, descrizione:'Ha detto "non so cosa fare" per tutta la mattina', categoria:'Pre animatore', emoji:'🤷' },
  { tipo:'bonus', punti:3,  descrizione:'Ha coinvolto tutti i ragazzi con il suo entusiasmo contagioso', categoria:'Amico di San Carlo', emoji:'🔥' },
  { tipo:'bonus', punti:2,  descrizione:'Ha dato il buon esempio in un momento difficile', categoria:'Amico di San Carlo', emoji:'😇' },
  { tipo:'bonus', punti:3,  descrizione:'Ha fatto una testimonianza che ha toccato il cuore di tutti', categoria:'Amico di San Carlo', emoji:'💛' },
  { tipo:'bonus', punti:2,  descrizione:'Ha aiutato un ragazzo che era in difficoltà con grande discrezione', categoria:'Amico di San Carlo', emoji:'🕊️' },
  { tipo:'bonus', punti:1,  descrizione:'Ha partecipato alla preghiera con raccoglimento e autenticità', categoria:'Amico di San Carlo', emoji:'🙏' },
  { tipo:'bonus', punti:2,  descrizione:'Ha fatto da punto di riferimento per i più piccoli', categoria:'Amico di San Carlo', emoji:'⭐' },
  { tipo:'malus', punti:-2, descrizione:'Ha fatto tardi ad un momento importante senza avvisare', categoria:'Amico di San Carlo', emoji:'⏰' },
  { tipo:'malus', punti:-1, descrizione:'Ha usato il telefono durante un\'attività', categoria:'Amico di San Carlo', emoji:'📱' },
  { tipo:'malus', punti:-2, descrizione:'Ha deluso le aspettative in un momento chiave', categoria:'Amico di San Carlo', emoji:'😔' },
  { tipo:'malus', punti:-3, descrizione:'Ha fatto del gossip davanti ai ragazzi (che stavano tutti ad ascoltare)', categoria:'Amico di San Carlo', emoji:'🗣️' },
  { tipo:'malus', punti:-1, descrizione:'Ha brontolato per tutta la giornata senza motivo apparente', categoria:'Amico di San Carlo', emoji:'😒' },
  { tipo:'bonus', punti:5,  descrizione:'Ha vinto la sfida del giorno tra squadre', categoria:'Squadra', emoji:'🏆' },
  { tipo:'bonus', punti:3,  descrizione:'Ha vinto la gara di canto dell\'animazione', categoria:'Squadra', emoji:'🎤' },
  { tipo:'bonus', punti:2,  descrizione:'Migliore performance nella preghiera del mattino', categoria:'Squadra', emoji:'🙏' },
  { tipo:'bonus', punti:3,  descrizione:'Ha vinto il gioco a squadre del pomeriggio', categoria:'Squadra', emoji:'🎯' },
  { tipo:'bonus', punti:2,  descrizione:'Più ordinata e pulita al momento del pranzo', categoria:'Squadra', emoji:'🧹' },
  { tipo:'bonus', punti:1,  descrizione:'Prima ad essere pronta per l\'attività', categoria:'Squadra', emoji:'⚡' },
  { tipo:'malus', punti:-3, descrizione:'Ultima nella classifica del giorno', categoria:'Squadra', emoji:'😢' },
  { tipo:'malus', punti:-2, descrizione:'Ha perso la gara a squadre principale', categoria:'Squadra', emoji:'😤' },
  { tipo:'malus', punti:-1, descrizione:'La più disorganizzata durante un\'attività', categoria:'Squadra', emoji:'🌪️' },
  { tipo:'malus', punti:-2, descrizione:'Ha avuto il maggior numero di ritardatari della giornata', categoria:'Squadra', emoji:'⏰' },
  { tipo:'bonus', punti:3,  descrizione:'Ha trascinato tutto il gruppo con l\'entusiasmo quando nessuno aveva voglia', categoria:'Tutti', emoji:'🔥' },
  { tipo:'bonus', punti:2,  descrizione:'Ha fatto una battuta che ha fatto ridere pure il più brontolone del gruppo', categoria:'Tutti', emoji:'😆' },
  { tipo:'bonus', punti:3,  descrizione:'Ha difeso qualcuno che stava per fare brutta figura davanti a tutti', categoria:'Tutti', emoji:'🛡️' },
  { tipo:'bonus', punti:2,  descrizione:'Ha trovato qualcosa che qualcuno aveva perso senza aspettarsi ringraziamenti', categoria:'Tutti', emoji:'🔍' },
  { tipo:'bonus', punti:1,  descrizione:'Ha detto "grazie" spontaneamente senza che nessuno lo ricordasse', categoria:'Tutti', emoji:'🌟' },
  { tipo:'bonus', punti:2,  descrizione:'Ha fatto una cosa di cui nessuno si aspettava fosse capace — sorpresa dell\'anno', categoria:'Tutti', emoji:'🎩' },
  { tipo:'bonus', punti:1,  descrizione:'Ha aiutato qualcuno in silenzio senza farlo sembrare un favore', categoria:'Tutti', emoji:'🥷' },
  { tipo:'bonus', punti:2,  descrizione:'Ha ammesso di aver sbagliato davanti a tutti senza fare drammi', categoria:'Tutti', emoji:'🫡' },
  { tipo:'bonus', punti:3,  descrizione:'Ha improvvisato qualcosa di bellissimo che nessuno aveva previsto', categoria:'Tutti', emoji:'✨' },
  { tipo:'malus', punti:-1, descrizione:'Si è lamentato per 10 minuti invece di trovare una soluzione', categoria:'Tutti', emoji:'🫧' },
  { tipo:'malus', punti:-3, descrizione:'🏆 Cretino del Giorno — ha fatto una cosa così senza senso che nemmeno lui sa spiegare perché', categoria:'Tutti', emoji:'🤡' },
  { tipo:'malus', punti:-1, descrizione:'Ha sbagliato il nome di qualcuno e ha continuato a sbagliarlo per tutta la giornata', categoria:'Tutti', emoji:'🙃' },
  { tipo:'malus', punti:-2, descrizione:'Ha usato il telefono pensando che nessuno lo vedesse (sbagliato)', categoria:'Tutti', emoji:'📱' },
  { tipo:'malus', punti:-1, descrizione:'Ha sbadigliato durante un momento importante in modo così vistoso da diventare il momento', categoria:'Tutti', emoji:'😪' },
  { tipo:'malus', punti:-2, descrizione:'Ha cambiato idea su tutto almeno tre volte nello stesso pomeriggio', categoria:'Tutti', emoji:'🔄' },
  { tipo:'malus', punti:-2, descrizione:'Ha rotto qualcosa e ha detto "non ero io" (c\'erano testimoni)', categoria:'Tutti', emoji:'💥' },
  { tipo:'malus', punti:-1, descrizione:'Ha fatto tardi e ha dato la colpa al traffico — eravate a piedi', categoria:'Tutti', emoji:'🚶' },
  { tipo:'malus', punti:-3, descrizione:'Ha fatto una gaffe imbarazzante davanti a tutti e l\'ha peggiorata cercando di rimediare', categoria:'Tutti', emoji:'🙈' },
  { tipo:'malus', punti:-2, descrizione:'Ha discusso per 5 minuti una cosa irrilevante con una serietà imbarazzante', categoria:'Tutti', emoji:'📜' },
];

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

// ── localStorage per voti ─────────────────────────────────────────────────────
function loadVotiState() {
  try { return JSON.parse(localStorage.getItem('fa_voti_v1') || '{}'); } catch { return {}; }
}
function saveVotiState(s) { localStorage.setItem('fa_voti_v1', JSON.stringify(s)); }

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);
  return { toast, show };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { logout } = useAuth();
  const { personaggi, utenti, reload } = useData();
  const [tab, setTab] = useState('giornata');
  const { toast, show: showToast } = useToast();

  const TABS = [
    { key: 'giornata',    label: '⭐ Giornata' },
    { key: 'regolamento', label: '📋 Regolamento' },
    { key: 'voti',        label: '📊 Voti' },
    { key: 'capitano',    label: '🎖️ Capitano' },
    { key: 'extra',       label: '🎁 Extra' },
  ];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <span style={S.logo}>🏆 Admin – Fanta Oratorio</span>
        <button style={S.logoutBtn} onClick={logout}>Esci</button>
      </div>

      <div style={S.container}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key}
              style={{ ...S.tab, ...(tab === t.key ? S.tabActive : {}) }}
              onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'giornata'    && <GiornataTab    personaggi={personaggi} showToast={showToast} />}
        {tab === 'regolamento' && <RegolamentoTab showToast={showToast} />}
        {tab === 'voti'        && <VotiTab        showToast={showToast} />}
        {tab === 'capitano'    && <CapitanoTab    showToast={showToast} reload={reload} />}
        {tab === 'extra'       && <ExtraTab       personaggi={personaggi} utenti={utenti} showToast={showToast} reload={reload} />}
      </div>

      {toast && (
        <div style={{ ...S.toast, background: toast.type === 'err' ? '#ef4444' : '#22c55e' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: GIORNATA (inserimento live bonus/malus, salvato su Supabase)
// ─────────────────────────────────────────────────────────────────────────────
function GiornataTab({ personaggi, showToast }) {
  const [giornata, setGiornata]       = useState('');
  const [nuovaG, setNuovaG]           = useState('');
  const [entries, setEntries]         = useState([]);
  const [regolamento, setRegolamento] = useState([]);
  const [personaggioId, setPersonaggioId] = useState('');
  const [loading, setLoading]         = useState(false);
  const [dbError, setDbError]         = useState(null);

  // ── Carica regolamento da Supabase ──
  useEffect(() => {
    supabase.from('regolamento').select('*').order('categoria').order('tipo').order('punti', { ascending: false })
      .then(({ data, error }) => {
        if (error) { setDbError('regolamento'); return; }
        setRegolamento(data || []);
      });
  }, []);

  // ── Carica entries della giornata selezionata ──
  const fetchEntries = useCallback(async (g) => {
    if (!g) { setEntries([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('bonus_malus_live')
      .select('*')
      .eq('giorno', g)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) { setDbError('bonus_malus_live'); return; }
    setEntries(data || []);
  }, []);

  useEffect(() => { fetchEntries(giornata); }, [giornata, fetchEntries]);

  // ── Preset per il personaggio selezionato ──
  const personaggio = personaggi.find(p => p.id === personaggioId);
  const catPersonaggio = personaggio ? CAT_MAP[personaggio.ruolo] : null;
  const presets = catPersonaggio
    ? regolamento.filter(r => r.categoria === catPersonaggio)
    : [];

  // ── Aggiungi preset ──
  async function aggiungiPreset(preset) {
    if (!giornata || !personaggioId) return;
    const { error } = await supabase.from('bonus_malus_live').insert({
      giorno: parseInt(giornata),
      id_personaggio: personaggioId,
      punti: preset.punti,
      descrizione: preset.descrizione,
      tipo: preset.tipo,
    });
    if (error) { showToast('Errore salvataggio', 'err'); return; }
    showToast(`${preset.tipo === 'bonus' ? 'Bonus' : 'Malus'} aggiunto!`);
    fetchEntries(giornata);
  }

  // ── Aggiungi personalizzato ──
  const [showCustom, setShowCustom]   = useState(false);
  const [custTipo, setCustTipo]       = useState('bonus');
  const [custPunti, setCustPunti]     = useState('');
  const [custDesc, setCustDesc]       = useState('');

  // ── Assegna in blocco (multi-personaggio) ──
  const [bulkShow, setBulkShow]       = useState(false);
  const [bulkTipo, setBulkTipo]       = useState('bonus');
  const [bulkPunti, setBulkPunti]     = useState('');
  const [bulkDesc, setBulkDesc]       = useState('');
  const [bulkIds, setBulkIds]         = useState([]);
  const [bulkSearch, setBulkSearch]   = useState('');

  async function aggiungiCustom() {
    const punti = parseFloat(custPunti);
    if (!personaggioId || !punti || punti <= 0 || !custDesc.trim()) return;
    const puntiFinali = custTipo === 'malus' ? -Math.abs(punti) : Math.abs(punti);
    const { error } = await supabase.from('bonus_malus_live').insert({
      giorno: parseInt(giornata),
      id_personaggio: personaggioId,
      punti: puntiFinali,
      descrizione: custDesc.trim(),
      tipo: custTipo,
    });
    if (error) { showToast('Errore salvataggio', 'err'); return; }
    showToast('Aggiunto!');
    setCustPunti(''); setCustDesc(''); setShowCustom(false);
    fetchEntries(giornata);
  }

  // ── Elimina entry ──
  async function eliminaEntry(id) {
    const { error } = await supabase.from('bonus_malus_live').delete().eq('id', id);
    if (error) { showToast('Errore eliminazione', 'err'); return; }
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  // ── Assegna in blocco ──
  async function assegnaMultiplo() {
    const punti = parseFloat(bulkPunti);
    if (!bulkIds.length || !punti || punti <= 0 || !bulkDesc.trim()) {
      showToast('Compila tutti i campi e seleziona almeno un personaggio', 'err'); return;
    }
    const puntiFinali = bulkTipo === 'malus' ? -Math.abs(punti) : Math.abs(punti);
    const rows = bulkIds.map(id => ({
      giorno: parseInt(giornata),
      id_personaggio: id,
      punti: puntiFinali,
      descrizione: bulkDesc.trim(),
      tipo: bulkTipo,
    }));
    const { error } = await supabase.from('bonus_malus_live').insert(rows);
    if (error) { showToast('Errore salvataggio', 'err'); return; }
    showToast(`${bulkTipo === 'bonus' ? 'Bonus' : 'Malus'} assegnato a ${bulkIds.length} personaggi!`);
    setBulkIds([]); setBulkPunti(''); setBulkDesc(''); setBulkShow(false);
    fetchEntries(giornata);
  }

  function toggleBulkId(id) {
    setBulkIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // ── Download CSV giornata ──
  function buildGiornataRows() {
    const rows = [['id_personaggio', 'giorno', 'punti', 'descrizione', 'tipo']];
    entries.forEach(e => {
      const segno = e.tipo === 'bonus' ? '+' : '';
      rows.push([e.id_personaggio, e.giorno, `${segno}${e.punti}`, e.descrizione, e.tipo]);
    });
    return rows;
  }

  function downloadGiornata() {
    if (!entries.length) { showToast('Nessun dato da scaricare', 'err'); return; }
    downloadCSV(`bonus_malus_g${giornata}.csv`, buildGiornataRows());
    showToast(`bonus_malus_g${giornata}.csv scaricato`);
  }

  function copyGiornata() {
    if (!entries.length) { showToast('Nessun dato da copiare', 'err'); return; }
    const csv = buildGiornataRows().map(r => r.map(csvEscape).join(',')).join('\n');
    navigator.clipboard.writeText(csv).then(() => showToast('Copiato negli appunti!'));
  }

  // ── Elenco giornate esistenti (da entries salvate) ──
  const [giornateEsistenti, setGiornateEsistenti] = useState([]);
  useEffect(() => {
    supabase.from('bonus_malus_live').select('giorno')
      .then(({ data }) => {
        if (!data) return;
        const set = [...new Set(data.map(r => r.giorno))].sort((a, b) => a - b);
        setGiornateEsistenti(set);
      });
  }, [entries]);

  if (dbError) return <SetupPanel missingTable={dbError} />;

  const nBonus = entries.filter(e => e.tipo === 'bonus').length;
  const nMalus = entries.filter(e => e.tipo === 'malus').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Selettore giornata */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={S.label}>📅 Giornata:</span>
          <select style={S.select} value={giornata} onChange={e => setGiornata(e.target.value)}>
            <option value="">-- Seleziona --</option>
            {giornateEsistenti.map(g => <option key={g} value={g}>Giornata {g}</option>)}
          </select>
          <span style={{ color: '#475569', fontSize: 13 }}>oppure nuova:</span>
          <input
            type="number" min="1" max="99" placeholder="es. 3"
            value={nuovaG} onChange={e => setNuovaG(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && nuovaG) { setGiornata(nuovaG); setNuovaG(''); } }}
            style={{ ...S.select, width: 80 }}
          />
          <button style={S.btnPrimary} onClick={() => { if (nuovaG) { setGiornata(nuovaG); setNuovaG(''); } }}>
            + Apri
          </button>
          {giornata && (
            <button style={{ ...S.btnOutline, marginLeft: 'auto' }}
              onClick={() => fetchEntries(giornata)} title="Aggiorna">
              🔄 Aggiorna
            </button>
          )}
        </div>
      </div>

      {!giornata ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <h2 style={{ color: '#94a3b8' }}>Seleziona o crea una giornata</h2>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={S.statsRow}>
            <StatCard label="Bonus" value={nBonus} sub="inseriti" color="#4ade80" />
            <StatCard label="Malus" value={nMalus} sub="inseriti" color="#f87171" />
            <StatCard label="Totale" value={entries.length} sub="voci" color="#f59e0b" />
          </div>

          {/* Inserimento */}
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Inserisci bonus / malus</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Scegli personaggio */}
              <div>
                <div style={{ ...S.label, marginBottom: 6 }}>Personaggio</div>
                <select
                  style={{ ...S.select, width: '100%', maxWidth: 420 }}
                  value={personaggioId}
                  onChange={e => { setPersonaggioId(e.target.value); setShowCustom(false); }}
                >
                  <option value="">-- Seleziona personaggio --</option>
                  {[
                    { ruolo: 'educatore',         label: 'Educatori' },
                    { ruolo: 'pre animatore',      label: 'Pre-animatori' },
                    { ruolo: 'animatore',          label: 'Animatori' },
                    { ruolo: 'amico san carlo',    label: 'Amici di San Carlo' },
                  ].map(({ ruolo, label }) => (
                    <optgroup key={ruolo} label={label}>
                      {personaggi.filter(p => p.ruolo === ruolo).map(p => (
                        <option key={p.id} value={p.id}>[{p.id}] {p.nome}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Preset */}
              {personaggioId && presets.length > 0 && (
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 12 }}>
                  <div style={{ ...S.label, marginBottom: 8 }}>
                    Preset – {catPersonaggio}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {['bonus', 'malus'].map(tipo => (
                      <React.Fragment key={tipo}>
                        {presets.filter(r => r.tipo === tipo).length > 0 && (
                          <div style={{
                            padding: '4px 0 2px',
                            color: tipo === 'bonus' ? '#4ade80' : '#f87171',
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          }}>
                            {tipo}
                          </div>
                        )}
                        {presets.filter(r => r.tipo === tipo).map(r => (
                          <PresetRow key={r.id} preset={r} onAdd={() => aggiungiPreset(r)} />
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom */}
              {personaggioId && (
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 12 }}>
                  {!showCustom ? (
                    <button style={S.btnOutline} onClick={() => setShowCustom(true)}>
                      ✏️ Aggiungi personalizzato
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 440 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['bonus', 'malus'].map(t => (
                          <button key={t} onClick={() => setCustTipo(t)} style={{
                            ...S.filterBtn,
                            ...(custTipo === t
                              ? t === 'bonus'
                                ? { borderColor: '#22c55e', background: '#22c55e22', color: '#4ade80' }
                                : { borderColor: '#ef4444', background: '#ef444422', color: '#f87171' }
                              : {})
                          }}>
                            {t === 'bonus' ? '+ Bonus' : '− Malus'}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" min="0.5" max="20" step="0.5" placeholder="Punti"
                          value={custPunti} onChange={e => setCustPunti(e.target.value)}
                          style={{ ...S.select, width: 90 }} />
                        <input type="text" placeholder="Descrizione"
                          value={custDesc} onChange={e => setCustDesc(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && aggiungiCustom()}
                          style={{ ...S.select, flex: 1 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={S.btnPrimary} onClick={aggiungiCustom}>Aggiungi</button>
                        <button style={S.btnOutline} onClick={() => setShowCustom(false)}>Annulla</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Assegna in blocco */}
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>👥 Assegna a più personaggi</span>
              <button style={{ ...S.btnOutline, fontSize: 13, padding: '5px 12px' }}
                onClick={() => { setBulkShow(v => !v); setBulkIds([]); setBulkSearch(''); }}>
                {bulkShow ? '✕ Chiudi' : '+ Apri'}
              </button>
            </div>
            {bulkShow && (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Tipo + Punti + Descrizione */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['bonus', 'malus'].map(t => (
                      <button key={t} onClick={() => setBulkTipo(t)} style={{
                        ...S.filterBtn,
                        ...(bulkTipo === t
                          ? t === 'bonus'
                            ? { borderColor: '#22c55e', background: '#22c55e22', color: '#4ade80' }
                            : { borderColor: '#ef4444', background: '#ef444422', color: '#f87171' }
                          : {})
                      }}>
                        {t === 'bonus' ? '+ Bonus' : '− Malus'}
                      </button>
                    ))}
                  </div>
                  <input type="number" min="0.5" max="20" step="0.5" placeholder="Punti"
                    value={bulkPunti} onChange={e => setBulkPunti(e.target.value)}
                    style={{ ...S.select, width: 90 }} />
                  <input type="text" placeholder="Descrizione"
                    value={bulkDesc} onChange={e => setBulkDesc(e.target.value)}
                    style={{ ...S.select, flex: 1, minWidth: 180 }} />
                </div>
                {/* Multi-select personaggi */}
                <div>
                  <div style={{ ...S.label, marginBottom: 6 }}>
                    Personaggi
                    {bulkIds.length > 0 && (
                      <span style={{ marginLeft: 8, color: '#f59e0b', fontWeight: 700 }}>
                        {bulkIds.length} selezionati
                      </span>
                    )}
                  </div>
                  <input type="text" placeholder="🔍 Cerca nome o ID..."
                    value={bulkSearch} onChange={e => setBulkSearch(e.target.value)}
                    style={{ ...S.select, width: '100%', marginBottom: 6 }} />
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <button style={{ ...S.filterBtn, fontSize: 12, padding: '3px 10px' }}
                      onClick={() => setBulkIds(
                        personaggi
                          .filter(p => {
                            const q = bulkSearch.toLowerCase();
                            return !q || p.nome.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                          })
                          .map(p => p.id)
                      )}>
                      Seleziona tutti visibili
                    </button>
                    <button style={{ ...S.filterBtn, fontSize: 12, padding: '3px 10px' }}
                      onClick={() => setBulkIds([])}>
                      Deseleziona tutti
                    </button>
                  </div>
                  <div style={{
                    border: '1px solid #334155', borderRadius: 8,
                    maxHeight: 220, overflowY: 'auto', background: '#0f172a',
                  }}>
                    {personaggi
                      .filter(p => {
                        const q = bulkSearch.toLowerCase();
                        return !q || p.nome.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                      })
                      .map(p => (
                        <label key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 12px', cursor: 'pointer', fontSize: 13,
                          borderBottom: '1px solid #1e293b',
                          background: bulkIds.includes(p.id) ? '#1e3a2a' : 'transparent',
                        }}>
                          <input type="checkbox"
                            checked={bulkIds.includes(p.id)}
                            onChange={() => toggleBulkId(p.id)}
                            style={{ accentColor: '#f59e0b' }} />
                          <span style={{ flex: 1 }}>{p.nome}</span>
                          <span style={{ color: '#475569', fontSize: 11 }}>{p.id}</span>
                        </label>
                      ))
                    }
                  </div>
                </div>
                <div>
                  <button style={S.btnPrimary} onClick={assegnaMultiplo}>
                    Assegna a {bulkIds.length || '...'} personaggi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista inseriti */}
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                Inseriti – Giornata {giornata} ({entries.length})
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.btnGreen} onClick={downloadGiornata}>⬇ Scarica CSV</button>
                <button style={{ ...S.btnOutline, fontSize: 13 }} onClick={copyGiornata}>📋 Copia</button>
              </div>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Caricamento...</div>
            ) : entries.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
                Nessun bonus/malus inserito per questa giornata
              </div>
            ) : (
              entries.map(e => {
                const p = personaggi.find(x => x.id === e.id_personaggio);
                const isBonus = e.tipo === 'bonus';
                return (
                  <div key={e.id} style={S.bonusItem}>
                    <span style={{
                      ...S.bonusBadge,
                      ...(isBonus
                        ? { background: '#16a34a22', color: '#4ade80', borderColor: '#16a34a44' }
                        : { background: '#dc262622', color: '#f87171', borderColor: '#dc262644' })
                    }}>
                      {isBonus ? '+' : ''}{e.punti}
                    </span>
                    <span style={{ fontWeight: 600, minWidth: 140, fontSize: 14 }}>
                      {p ? p.nome : e.id_personaggio}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: 13, flex: 1 }}>{e.descrizione}</span>
                    <button style={S.btnDanger} onClick={() => eliminaEntry(e.id)}>✕</button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: REGOLAMENTO (CRUD preset su Supabase)
// ─────────────────────────────────────────────────────────────────────────────
function RegolamentoTab({ showToast }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [dbError, setDbError]       = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [editData, setEditData]     = useState({});
  const [addingCat, setAddingCat]   = useState(null);
  const [newItem, setNewItem]       = useState({ tipo: 'bonus', punti: '', descrizione: '', emoji: '' });
  const [openCat, setOpenCat]       = useState({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('regolamento').select('*')
      .order('categoria').order('tipo').order('punti', { ascending: false });
    setLoading(false);
    if (error) { setDbError(true); return; }
    setItems(data || []);
    // apri tutte le categorie di default
    if (data) {
      const cats = [...new Set(data.map(r => r.categoria))];
      const state = {};
      cats.forEach(c => { state[c] = true; });
      setOpenCat(state);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Seed con dati default
  async function seedDefault() {
    if (!window.confirm('Importare tutti i preset predefiniti? Verranno aggiunti quelli mancanti.')) return;
    const { error } = await supabase.from('regolamento').insert(REGOLAMENTO_DEFAULT);
    if (error) { showToast('Errore importazione: ' + error.message, 'err'); return; }
    showToast('Preset importati!');
    fetchItems();
  }

  // Elimina
  async function elimina(id) {
    if (!window.confirm('Eliminare questo preset?')) return;
    const { error } = await supabase.from('regolamento').delete().eq('id', id);
    if (error) { showToast('Errore', 'err'); return; }
    setItems(prev => prev.filter(x => x.id !== id));
    showToast('Eliminato');
  }

  // Inizia modifica
  function startEdit(item) {
    setEditingId(item.id);
    setEditData({ ...item });
  }

  // Salva modifica
  async function saveEdit() {
    const { error } = await supabase.from('regolamento').update({
      tipo: editData.tipo,
      punti: parseFloat(editData.punti),
      descrizione: editData.descrizione,
      emoji: editData.emoji || '',
      categoria: editData.categoria,
    }).eq('id', editingId);
    if (error) { showToast('Errore salvataggio', 'err'); return; }
    showToast('Salvato!');
    setEditingId(null);
    fetchItems();
  }

  // Aggiungi nuovo
  async function aggiungiNuovo(categoria) {
    const punti = parseFloat(newItem.punti);
    if (!newItem.descrizione.trim() || !punti) { showToast('Compila tutti i campi', 'err'); return; }
    const puntiFinali = newItem.tipo === 'malus' ? -Math.abs(punti) : Math.abs(punti);
    const { error } = await supabase.from('regolamento').insert({
      tipo: newItem.tipo,
      punti: puntiFinali,
      descrizione: newItem.descrizione.trim(),
      emoji: newItem.emoji || '',
      categoria,
    });
    if (error) { showToast('Errore', 'err'); return; }
    showToast('Aggiunto!');
    setAddingCat(null);
    setNewItem({ tipo: 'bonus', punti: '', descrizione: '', emoji: '' });
    fetchItems();
  }

  if (dbError) return <SetupPanel missingTable="regolamento" />;

  const byCategory = {};
  CATEGORIE.forEach(c => { byCategory[c] = items.filter(i => i.categoria === c); });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header azioni */}
      <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ flex: 1, color: '#94a3b8', fontSize: 14 }}>
          {loading ? 'Caricamento...' : `${items.length} preset nel regolamento`}
        </span>
        {items.length === 0 && !loading && (
          <button style={S.btnPrimary} onClick={seedDefault}>
            📥 Importa preset predefiniti
          </button>
        )}
        {items.length > 0 && (
          <button style={S.btnOutline} onClick={seedDefault}>
            + Importa predefiniti
          </button>
        )}
      </div>

      {/* Sezioni per categoria */}
      {CATEGORIE.map(cat => {
        const catItems = byCategory[cat] || [];
        const isOpen = openCat[cat] !== false;
        return (
          <div key={cat} style={S.sectionCard}>
            {/* Header categoria */}
            <div
              style={{ ...S.sectionHeader, cursor: 'pointer' }}
              onClick={() => setOpenCat(prev => ({ ...prev, [cat]: !isOpen }))}
            >
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                {isOpen ? '▾' : '▸'} {cat}
                <span style={{ marginLeft: 8, color: '#64748b', fontWeight: 400, fontSize: 13 }}>
                  ({catItems.length})
                </span>
              </span>
              <button
                style={{ ...S.btnOutline, fontSize: 12, padding: '4px 12px' }}
                onClick={e => { e.stopPropagation(); setAddingCat(cat); setNewItem({ tipo: 'bonus', punti: '', descrizione: '', emoji: '' }); }}
              >
                + Aggiungi
              </button>
            </div>

            {isOpen && (
              <>
                {/* Form nuovo */}
                {addingCat === cat && (
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['bonus', 'malus'].map(t => (
                          <button key={t} onClick={() => setNewItem(p => ({ ...p, tipo: t }))} style={{
                            ...S.filterBtn, fontSize: 12, padding: '4px 10px',
                            ...(newItem.tipo === t
                              ? t === 'bonus'
                                ? { borderColor: '#22c55e', background: '#22c55e22', color: '#4ade80' }
                                : { borderColor: '#ef4444', background: '#ef444422', color: '#f87171' }
                              : {})
                          }}>
                            {t === 'bonus' ? '+ Bonus' : '− Malus'}
                          </button>
                        ))}
                      </div>
                      <input type="text" placeholder="Emoji" value={newItem.emoji}
                        onChange={e => setNewItem(p => ({ ...p, emoji: e.target.value }))}
                        style={{ ...S.select, width: 60 }} />
                      <input type="number" placeholder="Punti" value={newItem.punti}
                        onChange={e => setNewItem(p => ({ ...p, punti: e.target.value }))}
                        style={{ ...S.select, width: 80 }} />
                      <input type="text" placeholder="Descrizione" value={newItem.descrizione}
                        onChange={e => setNewItem(p => ({ ...p, descrizione: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && aggiungiNuovo(cat)}
                        style={{ ...S.select, flex: 1, minWidth: 200 }} />
                      <button style={S.btnPrimary} onClick={() => aggiungiNuovo(cat)}>Salva</button>
                      <button style={S.btnOutline} onClick={() => setAddingCat(null)}>✕</button>
                    </div>
                  </div>
                )}

                {/* Lista item */}
                {catItems.length === 0 && addingCat !== cat ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                    Nessun preset. Clicca "+ Aggiungi" per inserirne uno.
                  </div>
                ) : (
                  <>
                    {['bonus', 'malus'].map(tipo => {
                      const filtered = catItems.filter(i => i.tipo === tipo);
                      if (!filtered.length) return null;
                      return (
                        <React.Fragment key={tipo}>
                          <div style={{
                            padding: '6px 16px 2px',
                            color: tipo === 'bonus' ? '#4ade80' : '#f87171',
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            background: '#0f172a44',
                          }}>
                            {tipo}
                          </div>
                          {filtered.map(item => (
                            <div key={item.id}>
                              {editingId === item.id ? (
                                // Row di modifica
                                <div style={{ padding: '10px 16px', borderBottom: '1px solid #0f172a', background: '#162032' }}>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      {['bonus', 'malus'].map(t => (
                                        <button key={t} onClick={() => setEditData(p => ({ ...p, tipo: t }))} style={{
                                          ...S.filterBtn, fontSize: 11, padding: '3px 8px',
                                          ...(editData.tipo === t
                                            ? t === 'bonus'
                                              ? { borderColor: '#22c55e', background: '#22c55e22', color: '#4ade80' }
                                              : { borderColor: '#ef4444', background: '#ef444422', color: '#f87171' }
                                            : {})
                                        }}>
                                          {t === 'bonus' ? '+' : '−'}
                                        </button>
                                      ))}
                                    </div>
                                    <input type="text" value={editData.emoji || ''}
                                      onChange={e => setEditData(p => ({ ...p, emoji: e.target.value }))}
                                      style={{ ...S.select, width: 55, fontSize: 12 }} />
                                    <input type="number" value={Math.abs(editData.punti || 0)}
                                      onChange={e => setEditData(p => ({ ...p, punti: e.target.value }))}
                                      style={{ ...S.select, width: 75, fontSize: 12 }} />
                                    <input type="text" value={editData.descrizione || ''}
                                      onChange={e => setEditData(p => ({ ...p, descrizione: e.target.value }))}
                                      onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                      style={{ ...S.select, flex: 1, minWidth: 180, fontSize: 12 }} />
                                    <button style={{ ...S.btnPrimary, fontSize: 12, padding: '5px 12px' }} onClick={saveEdit}>✓ Salva</button>
                                    <button style={{ ...S.btnOutline, fontSize: 12, padding: '5px 10px' }} onClick={() => setEditingId(null)}>✕</button>
                                  </div>
                                </div>
                              ) : (
                                // Row normale
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '10px 16px', borderBottom: '1px solid #0f172a',
                                  transition: 'background 0.15s',
                                }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#162032'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>
                                    {item.emoji || '·'}
                                  </span>
                                  <span style={{
                                    minWidth: 40, textAlign: 'center', fontWeight: 700, fontSize: 13,
                                    color: item.tipo === 'bonus' ? '#4ade80' : '#f87171',
                                  }}>
                                    {item.punti > 0 ? '+' : ''}{item.punti}
                                  </span>
                                  <span style={{ flex: 1, fontSize: 13, color: '#cbd5e1' }}>
                                    {item.descrizione}
                                  </span>
                                  <button
                                    style={{ ...S.btnOutline, fontSize: 11, padding: '3px 10px' }}
                                    onClick={() => startEdit(item)}
                                  >
                                    ✏️ Modifica
                                  </button>
                                  <button
                                    style={{ ...S.btnDanger, fontSize: 11 }}
                                    onClick={() => elimina(item.id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: VOTI (localStorage, solo admin)
// ─────────────────────────────────────────────────────────────────────────────
function VotiTab({ showToast }) {
  const [votiState, setVotiState] = useState(loadVotiState);
  const [giornata, setGiornata]   = useState('');
  const [nuovaG, setNuovaG]       = useState('');

  const persist = useCallback((s) => { setVotiState(s); saveVotiState(s); }, []);

  const giornateList = Object.keys(votiState).map(Number).sort((a, b) => a - b);
  const voti = giornata ? (votiState[giornata] || {}) : {};

  function creaGiornata() {
    const n = parseInt(nuovaG);
    if (!n || n < 1 || n > 99) { showToast('Numero non valido (1-99)', 'err'); return; }
    const s = { ...votiState };
    if (!s[n]) s[n] = {};
    persist(s);
    setGiornata(n);
    setNuovaG('');
    showToast(`Giornata ${n} pronta`);
  }

  function setVoto(id, val) {
    const s = { ...votiState };
    if (!s[giornata]) s[giornata] = {};
    if (val === '' || isNaN(parseFloat(val))) delete s[giornata][id];
    else s[giornata][id] = parseFloat(val);
    persist(s);
  }

  function resetVoti() {
    if (!window.confirm('Cancellare tutti i voti di questa giornata?')) return;
    const s = { ...votiState, [giornata]: {} };
    persist(s);
    showToast('Voti eliminati');
  }

  function buildVotazioniRows() {
    const rows = [['id_squadra', 'giorno', 'voto_base']];
    Object.entries(voti).forEach(([id, v]) => rows.push([id, giornata, v]));
    return rows;
  }

  function exportVotazioni() {
    if (!giornata || !Object.keys(voti).length) { showToast('Nessun voto da esportare', 'err'); return; }
    downloadCSV(`votazioni_g${giornata}.csv`, buildVotazioniRows());
    showToast(`votazioni_g${giornata}.csv scaricato`);
  }

  function copyVotazioni() {
    if (!giornata || !Object.keys(voti).length) { showToast('Nessun voto da copiare', 'err'); return; }
    const csv = buildVotazioniRows().map(r => r.map(csvEscape).join(',')).join('\n');
    navigator.clipboard.writeText(csv).then(() => showToast('Voti copiati negli appunti!'));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <h2 style={{ color: '#94a3b8' }}>Seleziona o crea una giornata</h2>
        </div>
      ) : (
        <>
          <div style={S.sectionCard}>
            <div style={S.sectionHeader}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Voto Base Squadre – Giornata {giornata}</span>
              <button style={{ ...S.btnOutline, color: '#f87171', borderColor: '#f87171' }} onClick={resetVoti}>Reset</button>
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
                      key={`${giornata}-${sq}`}
                      onBlur={e => setVoto(sq, e.target.value)}
                      style={{
                        ...S.votoInput, width: 100,
                        borderColor: v !== undefined ? info.colore + '88' : '#334155',
                        background: v !== undefined ? info.colore + '11' : '#0f172a',
                        color: info.colore, fontSize: 18, fontWeight: 700,
                      }}
                    />
                    {v !== undefined && <span style={{ color: '#64748b', fontSize: 13 }}>punti assegnati</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, fontWeight: 700 }}>📥 Esporta voti – Giornata {giornata}</div>
            <button style={S.btnGreen} onClick={exportVotazioni}>⬇ Scarica votazioni.csv</button>
            <button style={{ ...S.btnOutline, fontSize: 13 }} onClick={copyVotazioni}>📋 Copia</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: CAPITANO (flag globale + giorno del raddoppio punti, su Supabase)
// ─────────────────────────────────────────────────────────────────────────────
function CapitanoTab({ showToast, reload }) {
  const [impostazioni, setImpostazioni] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [dbError, setDbError]           = useState(false);
  const [giornoInput, setGiornoInput]   = useState('');
  const [salvando, setSalvando]         = useState(false);

  const fetchImpostazioni = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('impostazioni').select('*').eq('id', 1).maybeSingle();
    setLoading(false);
    if (error) { setDbError(true); return; }
    setImpostazioni(data || { id: 1, capitano_attivo: false, giorno_capitano: null });
    setGiornoInput(data?.giorno_capitano ?? '');
  }, []);

  useEffect(() => { fetchImpostazioni(); }, [fetchImpostazioni]);

  async function toggleAttivo() {
    if (!impostazioni) return;
    setSalvando(true);
    const nuovoValore = !impostazioni.capitano_attivo;
    const { error } = await supabase.from('impostazioni')
      .update({ capitano_attivo: nuovoValore }).eq('id', 1);
    setSalvando(false);
    if (error) { showToast('Errore salvataggio', 'err'); return; }
    setImpostazioni(prev => ({ ...prev, capitano_attivo: nuovoValore }));
    showToast(nuovoValore ? 'Bottone "Imposta capitano" ATTIVATO per tutti' : 'Bottone "Imposta capitano" disattivato');
    reload?.();
  }

  async function salvaGiorno() {
    const n = giornoInput === '' ? null : parseInt(giornoInput, 10);
    if (giornoInput !== '' && (!n || n < 1 || n > 99)) { showToast('Numero giorno non valido (1-99)', 'err'); return; }
    setSalvando(true);
    const { error } = await supabase.from('impostazioni')
      .update({ giorno_capitano: n }).eq('id', 1);
    setSalvando(false);
    if (error) { showToast('Errore salvataggio', 'err'); return; }
    setImpostazioni(prev => ({ ...prev, giorno_capitano: n }));
    showToast(n ? `Giorno del raddoppio impostato: Giornata ${n}` : 'Giorno del raddoppio rimosso');
    reload?.();
  }

  if (dbError) return <SetupPanel missingTable="impostazioni" />;
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Caricamento...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={S.sectionCard}>
        <div style={S.sectionHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>🎖️ Scelta del capitano</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>
            Quando questo flag è <strong style={{ color: '#e2e8f0' }}>attivo</strong>, ogni squadra vede
            il bottone "Imposta capitano" e può scegliere (e cambiare idea) liberamente il proprio capitano.
            Disattivalo quando vuoi bloccare la scelta.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              style={{
                ...S.btnPrimary,
                background: impostazioni?.capitano_attivo ? '#22c55e' : '#334155',
                color: impostazioni?.capitano_attivo ? '#0f172a' : '#94a3b8',
              }}
              disabled={salvando}
              onClick={toggleAttivo}
            >
              {impostazioni?.capitano_attivo ? '✅ Attivo — clicca per disattivare' : '⭕ Disattivato — clicca per attivare'}
            </button>
          </div>
        </div>
      </div>

      <div style={S.sectionCard}>
        <div style={S.sectionHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>📅 Giorno del raddoppio punti</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>
            Il capitano di ogni squadra prende il <strong style={{ color: '#e2e8f0' }}>doppio dei punti</strong> guadagnati
            (bonus/malus) solo in questa giornata. Lascia vuoto per non applicare ancora nessun raddoppio.
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={S.label}>Giornata:</span>
            <input
              type="number" min="1" max="99" placeholder="es. 5"
              value={giornoInput} onChange={e => setGiornoInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvaGiorno()}
              style={{ ...S.select, width: 100 }}
            />
            <button style={S.btnPrimary} disabled={salvando} onClick={salvaGiorno}>Salva</button>
            {impostazioni?.giorno_capitano != null && (
              <span style={{ color: '#4ade80', fontSize: 13 }}>
                ✓ Attualmente impostato: Giornata {impostazioni.giorno_capitano}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: EXTRA (flag globale + scadenza + assegnazione del "giocatore extra")
// ─────────────────────────────────────────────────────────────────────────────
function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ExtraTab({ personaggi, utenti, showToast, reload }) {
  const [impostazioni, setImpostazioni] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [dbError, setDbError]           = useState(false);
  const [deadlineInput, setDeadlineInput] = useState('');
  const [giornoDaInput, setGiornoDaInput] = useState('');
  const [salvando, setSalvando]         = useState(false);
  const [giocatoriList, setGiocatoriList] = useState([]);
  const [loadingGiocatori, setLoadingGiocatori] = useState(true);
  const [assegnando, setAssegnando]     = useState(false);
  const [cerca, setCerca]               = useState('');

  const fetchImpostazioni = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('impostazioni').select('*').eq('id', 1).maybeSingle();
    setLoading(false);
    if (error) { setDbError(true); return; }
    const row = data || { id: 1, extra_attivo: false, extra_deadline: null, extra_giorno_da: null };
    setImpostazioni(row);
    setDeadlineInput(row.extra_deadline ? toLocalInputValue(row.extra_deadline) : '');
    setGiornoDaInput(row.extra_giorno_da ?? '');
  }, []);

  const fetchGiocatori = useCallback(async () => {
    setLoadingGiocatori(true);
    const { data, error } = await supabase.from('giocatori').select('*').order('created_at', { ascending: true });
    setLoadingGiocatori(false);
    if (!error) setGiocatoriList(data || []);
  }, []);

  useEffect(() => { fetchImpostazioni(); fetchGiocatori(); }, [fetchImpostazioni, fetchGiocatori]);

  async function toggleAttivo() {
    if (!impostazioni) return;
    setSalvando(true);
    const nuovoValore = !impostazioni.extra_attivo;
    const { error } = await supabase.from('impostazioni').update({ extra_attivo: nuovoValore }).eq('id', 1);
    setSalvando(false);
    if (error) { showToast('Errore salvataggio', 'err'); return; }
    setImpostazioni(prev => ({ ...prev, extra_attivo: nuovoValore }));
    showToast(nuovoValore ? 'Scelta "Giocatore extra" ATTIVATA per tutti' : 'Scelta "Giocatore extra" disattivata');
    reload?.();
  }

  async function salvaDeadline(iso) {
    setSalvando(true);
    const { error } = await supabase.from('impostazioni').update({ extra_deadline: iso }).eq('id', 1);
    setSalvando(false);
    if (error) { showToast('Errore salvataggio', 'err'); return; }
    setImpostazioni(prev => ({ ...prev, extra_deadline: iso }));
    showToast(iso ? `Chiusura impostata: ${new Date(iso).toLocaleString('it-IT')}` : 'Chiusura rimossa');
    reload?.();
  }

  function impostaDomaniAlleSedici() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(16, 0, 0, 0);
    setDeadlineInput(toLocalInputValue(d.toISOString()));
    salvaDeadline(d.toISOString());
  }

  async function salvaGiornoDa() {
    const n = giornoDaInput === '' ? null : parseInt(giornoDaInput, 10);
    if (giornoDaInput !== '' && (!n || n < 1 || n > 99)) { showToast('Numero giornata non valido (1-99)', 'err'); return; }
    setSalvando(true);
    const { error } = await supabase.from('impostazioni').update({ extra_giorno_da: n }).eq('id', 1);
    setSalvando(false);
    if (error) { showToast('Errore salvataggio', 'err'); return; }
    setImpostazioni(prev => ({ ...prev, extra_giorno_da: n }));
    showToast(n ? `I punti del giocatore extra contano dalla Giornata ${n}` : 'Nessun limite di giornata impostato');
    reload?.();
  }

  // Assegna un giocatore extra casuale a tutte le squadre che non hanno ancora
  // scelto, evitando solo: il proprio personaggio e chi è già nella propria
  // formazione titolare (non c'è esclusività tra squadre diverse).
  async function assegnaMancanti() {
    if (assegnando) return;
    setAssegnando(true);
    const { data: freschi, error: errG } = await supabase.from('giocatori').select('*');
    if (errG) { setAssegnando(false); showToast('Errore lettura squadre', 'err'); return; }

    const mancanti = (freschi || []).filter(g => !g.giocatore_extra);
    if (mancanti.length === 0) {
      setAssegnando(false);
      showToast('Tutte le squadre hanno già un giocatore extra');
      return;
    }

    const daAggiornare = [];
    for (const g of mancanti) {
      const utenteBase = utenti.find(u => u.codice?.trim().toUpperCase() === g.codice?.trim().toUpperCase());
      const idSelf = utenteBase?.id_personaggio;
      const propri = new Set([g.educatore, g.animatore1, g.animatore2, g['pre animatore'], g['amico san carlo']].filter(Boolean));
      const pool = personaggi.filter(p => p.id !== idSelf && !propri.has(p.id));
      if (pool.length === 0) continue;
      const scelto = pool[Math.floor(Math.random() * pool.length)];
      daAggiornare.push({ codice: g.codice, giocatore_extra: scelto.id });
    }

    let errori = 0;
    for (const u of daAggiornare) {
      const { error } = await supabase.from('giocatori').update({ giocatore_extra: u.giocatore_extra }).eq('codice', u.codice);
      if (error) errori++;
    }
    setAssegnando(false);
    if (daAggiornare.length === 0) {
      showToast('Nessun personaggio libero da assegnare', 'err');
    } else if (errori > 0) {
      showToast(`Assegnati ${daAggiornare.length - errori}/${daAggiornare.length}, ${errori} errori`, 'err');
    } else {
      showToast(`Giocatore extra assegnato a ${daAggiornare.length} squadre!`);
    }
    fetchGiocatori();
    reload?.();
  }

  if (dbError) return <SetupPanel missingTable="impostazioni" />;
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Caricamento...</div>;

  const cercaLower = cerca.toLowerCase();
  const listaFiltrata = giocatoriList.filter(g =>
    !cercaLower ||
    g['nome-squadra']?.toLowerCase().includes(cercaLower) ||
    g.proprietario?.toLowerCase().includes(cercaLower) ||
    g.codice?.toLowerCase().includes(cercaLower)
  );
  const nSenzaScelta = giocatoriList.filter(g => !g.giocatore_extra).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={S.sectionCard}>
        <div style={S.sectionHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>🎁 Scelta del giocatore extra</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>
            Quando questo flag è <strong style={{ color: '#e2e8f0' }}>attivo</strong>, ogni squadra vede
            il bottone per scegliere un personaggio in più tra tutti (tranne se stesso e chi ha già
            nella propria formazione titolare). Più squadre possono scegliere lo stesso personaggio,
            non c'è esclusività. Disattivalo quando vuoi bloccare la scelta.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              style={{
                ...S.btnPrimary,
                background: impostazioni?.extra_attivo ? '#22c55e' : '#334155',
                color: impostazioni?.extra_attivo ? '#0f172a' : '#94a3b8',
              }}
              disabled={salvando}
              onClick={toggleAttivo}
            >
              {impostazioni?.extra_attivo ? '✅ Attivo — clicca per disattivare' : '⭕ Disattivato — clicca per attivare'}
            </button>
          </div>
        </div>
      </div>

      <div style={S.sectionCard}>
        <div style={S.sectionHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>⏰ Chiusura della scelta</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>
            Dopo questa data/ora, chi non ha ancora scelto riceve automaticamente un giocatore extra
            casuale (al primo caricamento dell'app), oppure puoi assegnarlo subito qui sotto.
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={S.label}>Chiusura:</span>
            <input
              type="datetime-local"
              value={deadlineInput}
              onChange={e => setDeadlineInput(e.target.value)}
              style={{ ...S.select, width: 220 }}
            />
            <button
              style={S.btnPrimary}
              disabled={salvando || !deadlineInput}
              onClick={() => salvaDeadline(new Date(deadlineInput).toISOString())}
            >
              Salva
            </button>
            <button style={S.btnOutline} disabled={salvando} onClick={impostaDomaniAlleSedici}>
              Imposta domani alle 16:00
            </button>
            {impostazioni?.extra_deadline && (
              <span style={{ color: '#4ade80', fontSize: 13 }}>
                ✓ Attuale: {new Date(impostazioni.extra_deadline).toLocaleString('it-IT')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={S.sectionCard}>
        <div style={S.sectionHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>📅 Giornata da cui contano i punti</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>
            I bonus/malus del giocatore extra si sommano al punteggio solo a partire da questa
            giornata (quelle precedenti non contano, anche se il personaggio le aveva già giocate
            in altri ruoli). Lascia vuoto per contare tutto lo storico.
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={S.label}>Giornata:</span>
            <input
              type="number" min="1" max="99" placeholder="es. 8"
              value={giornoDaInput} onChange={e => setGiornoDaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvaGiornoDa()}
              style={{ ...S.select, width: 100 }}
            />
            <button style={S.btnPrimary} disabled={salvando} onClick={salvaGiornoDa}>Salva</button>
            {impostazioni?.extra_giorno_da != null && (
              <span style={{ color: '#4ade80', fontSize: 13 }}>
                ✓ Attualmente impostato: dalla Giornata {impostazioni.extra_giorno_da}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={S.sectionCard}>
        <div style={S.sectionHeader}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            🎲 Assegnazione manuale ({nSenzaScelta} squadre senza scelta)
          </span>
          <button style={S.btnGreen} disabled={assegnando || nSenzaScelta === 0} onClick={assegnaMancanti}>
            {assegnando ? '⏳ Assegno...' : `Assegna a chi non ha scelto`}
          </button>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <input
            type="text" placeholder="🔍 Cerca squadra, proprietario o codice…"
            value={cerca} onChange={e => setCerca(e.target.value)}
            style={{ ...S.select, width: '100%', marginBottom: 10 }}
          />
          {loadingGiocatori ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#475569' }}>Caricamento...</div>
          ) : listaFiltrata.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#475569' }}>Nessuna squadra trovata</div>
          ) : (
            listaFiltrata.map(g => {
              const p = g.giocatore_extra ? personaggi.find(x => x.id === g.giocatore_extra) : null;
              return (
                <div key={g.codice} style={S.bonusItem}>
                  <span style={{ fontWeight: 600, minWidth: 160, fontSize: 14 }}>{g['nome-squadra']}</span>
                  <span style={{ color: '#94a3b8', fontSize: 13, minWidth: 120 }}>{g.proprietario}</span>
                  <span style={{ flex: 1, fontSize: 13, color: g.giocatore_extra ? '#4ade80' : '#f87171' }}>
                    {g.giocatore_extra ? `✓ ${p?.nome || g.giocatore_extra}` : '— nessuna scelta'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pannello setup Supabase (tabelle mancanti)
// ─────────────────────────────────────────────────────────────────────────────
function SetupPanel({ missingTable }) {
  const [copied, setCopied] = useState(false);
  const sql = `-- Esegui questo SQL nell'editor SQL di Supabase

CREATE TABLE IF NOT EXISTS regolamento (
  id        BIGSERIAL PRIMARY KEY,
  tipo      TEXT NOT NULL CHECK (tipo IN ('bonus','malus')),
  punti     NUMERIC NOT NULL,
  descrizione TEXT NOT NULL,
  categoria TEXT NOT NULL,
  emoji     TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bonus_malus_live (
  id            BIGSERIAL PRIMARY KEY,
  giorno        INTEGER NOT NULL,
  id_personaggio TEXT NOT NULL,
  punti         NUMERIC NOT NULL,
  descrizione   TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('bonus','malus')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Funzionalità "Capitano": colonna su giocatori + tabella impostazioni globali
ALTER TABLE giocatori ADD COLUMN IF NOT EXISTS capitano TEXT;

CREATE TABLE IF NOT EXISTS impostazioni (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  capitano_attivo  BOOLEAN NOT NULL DEFAULT FALSE,
  giorno_capitano  INTEGER,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT impostazioni_singleton CHECK (id = 1)
);

INSERT INTO impostazioni (id, capitano_attivo, giorno_capitano)
VALUES (1, FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- Funzionalità "Giocatore extra": colonna su giocatori + impostazioni globali
ALTER TABLE giocatori    ADD COLUMN IF NOT EXISTS giocatore_extra TEXT;
ALTER TABLE impostazioni ADD COLUMN IF NOT EXISTS extra_attivo    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE impostazioni ADD COLUMN IF NOT EXISTS extra_deadline  TIMESTAMPTZ;
ALTER TABLE impostazioni ADD COLUMN IF NOT EXISTS extra_giorno_da INTEGER;

-- Disabilita RLS (o configura le policy che preferisci)
ALTER TABLE regolamento       DISABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_malus_live  DISABLE ROW LEVEL SECURITY;
ALTER TABLE impostazioni      DISABLE ROW LEVEL SECURITY;`;

  function copySql() {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ ...S.sectionCard, padding: 28 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
        Configurazione Supabase necessaria
      </div>
      <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
        La tabella <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>{missingTable}</code> non esiste ancora.
        Vai su <strong>Supabase → SQL Editor</strong> e incolla questo SQL:
      </div>
      <pre style={{
        background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
        padding: 16, fontSize: 12, color: '#94a3b8', overflowX: 'auto',
        lineHeight: 1.6, marginBottom: 16,
      }}>
        {sql}
      </pre>
      <button style={S.btnPrimary} onClick={copySql}>
        {copied ? '✓ Copiato!' : '📋 Copia SQL'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componenti piccoli
// ─────────────────────────────────────────────────────────────────────────────
function PresetRow({ preset, onAdd }) {
  const isBonus = preset.tipo === 'bonus';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 0', borderBottom: '1px solid #0f172a55',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#162032'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>{preset.emoji || '·'}</span>
      <span style={{
        minWidth: 38, textAlign: 'center', fontWeight: 700, fontSize: 13,
        color: isBonus ? '#4ade80' : '#f87171',
      }}>
        {preset.punti > 0 ? '+' : ''}{preset.punti}
      </span>
      <span style={{ flex: 1, fontSize: 13, color: '#cbd5e1' }}>{preset.descrizione}</span>
      <button style={{
        padding: '4px 12px', borderRadius: 6, border: 'none',
        background: isBonus ? '#16a34a' : '#dc2626',
        color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer',
      }} onClick={onAdd}>
        + Aggiungi
      </button>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={S.statCard}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stili
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  page:        { minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: "'Segoe UI', sans-serif" },
  header:      { background: '#1e293b', borderBottom: '1px solid #334155', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:        { fontSize: 18, fontWeight: 700, color: '#f59e0b' },
  logoutBtn:   { padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 },
  container:   { maxWidth: 1000, margin: '0 auto', padding: 24 },
  card:        { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '18px 20px', marginBottom: 0 },
  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 },
  statCard:    { background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '14px 18px' },
  sectionCard: { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' },
  sectionHeader: { padding: '14px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  tab:         { padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#94a3b8', border: '1px solid transparent', background: 'transparent' },
  tabActive:   { background: '#f59e0b', color: '#0f172a', borderColor: '#f59e0b' },
  select:      { padding: '8px 12px', borderRadius: 8, border: '2px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 14, outline: 'none' },
  label:       { color: '#94a3b8', fontSize: 13, fontWeight: 600 },
  votoInput:   { width: 80, padding: '6px 10px', borderRadius: 6, border: '2px solid', background: '#0f172a', color: '#e2e8f0', fontSize: 14, textAlign: 'center', outline: 'none' },
  bonusItem:   { display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #162032', gap: 10 },
  bonusBadge:  { minWidth: 48, textAlign: 'center', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 13, border: '1px solid' },
  btnPrimary:  { padding: '8px 18px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  btnGreen:    { padding: '8px 18px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#0f172a', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  btnOutline:  { padding: '8px 18px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#e2e8f0', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  btnDanger:   { padding: '4px 12px', borderRadius: 6, border: 'none', background: '#ef4444', color: 'white', fontSize: 12, cursor: 'pointer' },
  filterBtn:   { padding: '5px 14px', borderRadius: 20, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13 },
  emptyState:  { textAlign: 'center', padding: '80px 20px' },
  toast:       { position: 'fixed', bottom: 24, right: 24, color: '#0f172a', padding: '12px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, zIndex: 2000 },
};
