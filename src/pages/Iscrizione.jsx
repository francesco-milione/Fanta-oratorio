import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SQUADRE_ORATORIO, SQUADRE_LABEL } from '../context/DataContext';

function generaCodice() {
  const lettere = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const cifre = '0123456789';
  let cod = '';
  for (let i = 0; i < 3; i++) cod += lettere[Math.floor(Math.random() * lettere.length)];
  for (let i = 0; i < 2; i++) cod += cifre[Math.floor(Math.random() * cifre.length)];
  return cod;
}

function RigaPersonaggio({ p, selezionato, onClick, disabled }) {
  return (
    <div
      className={`iscrizione-card ${selezionato ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onClick(p)}
    >
      <div className="iscrizione-card-info">
        <span className="iscrizione-card-nome">{p.nome}</span>
        <span className="iscrizione-card-id">{p.id}</span>
      </div>
      <div className="iscrizione-card-right">
        <span className="iscrizione-card-check">{selezionato ? '✓' : ''}</span>
      </div>
    </div>
  );
}

function SezioneRuolo({ titolo, emoji, personaggi, selezionati, onToggle, max, cerca, idEscluso }) {
  const filtrati = personaggi.filter(p => {
    if (p.id === idEscluso) return false; // auto-esclusione: non puoi mettere te stesso
    return (
      p.nome.toLowerCase().includes(cerca.toLowerCase()) ||
      p.id.toLowerCase().includes(cerca.toLowerCase())
    );
  });
  return (
    <div className="iscrizione-sezione">
      <div className="iscrizione-sezione-header">
        <span>{emoji} {titolo}</span>
        <span className="iscrizione-sezione-count">{selezionati.length}/{max}</span>
      </div>
      <div className="iscrizione-cards">
        {filtrati.length === 0 && <p className="iscrizione-empty">Nessun risultato per "{cerca}"</p>}
        {filtrati.map(p => {
          const sel = selezionati.includes(p.id);
          const pieno = selezionati.length >= max && !sel;
          return (
            <RigaPersonaggio key={p.id} p={p} selezionato={sel} disabled={pieno} onClick={() => onToggle(p.id)} />
          );
        })}
      </div>
    </div>
  );
}

// modalitaPostLogin = true → utente già loggato, conosce id_personaggio, non può mettersi in squadra
export default function Iscrizione({ onTornaLogin, modalitaPostLogin = false, utenteLoggato = null }) {
  const { personaggi, loading, error } = useData();
  const { logout } = useAuth();

  const [nomeSquadra, setNomeSquadra] = useState('');
  const [proprietario] = useState(modalitaPostLogin ? (utenteLoggato?.nome || '') : '');
  const [codice] = useState(modalitaPostLogin ? (utenteLoggato?.codice || generaCodice()) : generaCodice());
  const [codiceLibero, setCodiceLibero] = useState(!modalitaPostLogin ? generaCodice() : '');
  const [nomeLibero, setNomeLibero] = useState('');
  const [educatore, setEducatore] = useState(null);
  const [animatori, setAnimatori] = useState([]);
  const [preAnimatore, setPreAnimatore] = useState(null);
  const [amicoSanCarlo, setAmicoSanCarlo] = useState(null);
  const [squadraOratorio, setSquadraOratorio] = useState(null);
  const [cerca, setCerca] = useState('');
  const [copiato, setCopiato] = useState(false);

  // ID del personaggio dell'utente loggato (da escludere dalla selezione)
  const idSelf = modalitaPostLogin ? utenteLoggato?.id_personaggio : null;

  // In modalità libera (vecchia iscrizione pubblica), usa i campi liberi
  const nomeFinale = modalitaPostLogin ? proprietario : nomeLibero;
  const codiceFinale = modalitaPostLogin ? codice : codiceLibero;

  const educatori        = useMemo(() => personaggi.filter(p => p.ruolo === 'educatore'), [personaggi]);
  const animatoriList    = useMemo(() => personaggi.filter(p => p.ruolo === 'animatore'), [personaggi]);
  const preAnimatoriList = useMemo(() => personaggi.filter(p => p.ruolo === 'pre animatore'), [personaggi]);
  const amiciList        = useMemo(() => personaggi.filter(p => p.ruolo === 'amico san carlo'), [personaggi]);

  const toggleEducatore    = (id) => setEducatore(prev => prev === id ? null : id);
  const toggleAnimatore    = (id) => setAnimatori(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
  );
  const togglePreAnimatore  = (id) => setPreAnimatore(prev => prev === id ? null : id);
  const toggleAmico         = (id) => setAmicoSanCarlo(prev => prev === id ? null : id);

  const completo =
    educatore && animatori.length === 2 && preAnimatore && amicoSanCarlo &&
    squadraOratorio && nomeSquadra.trim() && nomeFinale.trim();

  // Ordine colonne CSV: codice, nome-squadra, proprietario, educatore, animatore1, animatore2, pre animatore, amico san carlo, squadra-oratorio
  const rigaCSV = completo
    ? `${codiceFinale},${nomeSquadra.trim()},${nomeFinale.trim()},${educatore},${animatori[0]},${animatori[1]},${preAnimatore},${amicoSanCarlo},${squadraOratorio}`
    : '';

  const copiaRiga = () => {
    navigator.clipboard.writeText(rigaCSV).then(() => {
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    });
  };

  const reset = () => {
    setNomeSquadra('');
    if (!modalitaPostLogin) { setNomeLibero(''); setCodiceLibero(generaCodice()); }
    setEducatore(null); setAnimatori([]); setPreAnimatore(null);
    setAmicoSanCarlo(null); setSquadraOratorio(null); setCerca(''); setCopiato(false);
  };

  if (loading) return (
    <div className="iscrizione-page">
      <div className="login-loading"><div className="spinner" /><span>Caricamento…</span></div>
    </div>
  );
  if (error) return (
    <div className="iscrizione-page"><div className="alert alert-error">⚠️ {error}</div></div>
  );

  return (
    <div className="iscrizione-page">
      <div className="iscrizione-header">
        <div className="iscrizione-header-top">
          <div>
            <span className="logo-icon" style={{ fontSize: 28 }}>⛪</span>
            <span style={{ fontWeight: 700, fontSize: 20, marginLeft: 8 }}>Fanta<b>Oratorio</b></span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
              — {modalitaPostLogin ? 'Crea la tua squadra' : 'Iscrizione'}
            </span>
          </div>
          {modalitaPostLogin ? (
            <button className="btn-secondary btn-sm" onClick={logout}>🚪 Esci</button>
          ) : (
            <button className="btn-secondary btn-sm" onClick={onTornaLogin}>🔐 Accedi</button>
          )}
        </div>

        {modalitaPostLogin ? (
          <p className="iscrizione-intro">
            Ciao <strong>{utenteLoggato?.nome}</strong>! Scegli la tua formazione:
            1 educatore · 2 animatori · 1 pre animatore · 1 amico di San Carlo · la squadra oratorio.
            <br />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ⚠️ Non puoi inserire te stesso nella formazione.
            </span>
          </p>
        ) : (
          <p className="iscrizione-intro">
            Scegli 1 educatore · 2 animatori · 1 pre animatore · 1 amico di San Carlo · la squadra oratorio
          </p>
        )}
      </div>

      <div className="iscrizione-body">
        {/* Dati squadra */}
        <div className="iscrizione-form-box">
          <h3>📝 La tua squadra</h3>
          <div className="iscrizione-form-row">
            <div className="input-group" style={{ flex: 1 }}>
              <label>Nome squadra</label>
              <input
                type="text" value={nomeSquadra}
                onChange={e => setNomeSquadra(e.target.value)}
                placeholder="es. Gli Invincibili" maxLength={30}
              />
            </div>
            {!modalitaPostLogin && (
              <div className="input-group" style={{ flex: 1 }}>
                <label>Il tuo nome</label>
                <input
                  type="text" value={nomeLibero}
                  onChange={e => setNomeLibero(e.target.value)}
                  placeholder="es. Alberto R." maxLength={30}
                />
              </div>
            )}
          </div>

          {modalitaPostLogin ? (
            <div className="iscrizione-codice-row">
              <div className="input-group">
                <label>Proprietario</label>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                  {proprietario}
                </div>
                <label style={{ marginTop: 12 }}>Il tuo codice di accesso</label>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 3, fontSize: 20, color: 'var(--primary)' }}>
                  {codice}
                </div>
                <p className="input-hint">Usalo sempre per entrare nell'app.</p>
              </div>
            </div>
          ) : (
            <div className="iscrizione-codice-row">
              <div className="input-group" style={{ flex: 1 }}>
                <label>Codice di accesso</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text" value={codiceLibero}
                    onChange={e => setCodiceLibero(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                    maxLength={8} style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}
                  />
                  <button className="btn-secondary btn-sm" onClick={() => setCodiceLibero(generaCodice())} title="Rigenera">🔄</button>
                </div>
                <p className="input-hint">Lo userai per accedere all'app. Tienilo da parte!</p>
              </div>
            </div>
          )}
        </div>

        {/* Squadra oratorio */}
        <div className="iscrizione-form-box">
          <h3>🏟️ Squadra Oratorio</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            I bonus/malus della squadra si aggiungono al tuo punteggio totale.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {SQUADRE_ORATORIO.map(sq => {
              const info = SQUADRE_LABEL[sq];
              const sel = squadraOratorio === sq;
              return (
                <button key={sq} onClick={() => setSquadraOratorio(sq)} style={{
                  padding: '12px 20px', borderRadius: 12,
                  border: `2px solid ${sel ? info.colore : 'var(--border)'}`,
                  background: sel ? info.colore + '22' : 'transparent',
                  color: sel ? info.colore : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 22 }}>{info.emoji}</span>
                  {info.label}
                  {sel && <span style={{ fontSize: 14 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ricerca */}
        <div className="iscrizione-cerca-box">
          <input
            type="text" value={cerca}
            onChange={e => setCerca(e.target.value)}
            placeholder="🔍 Cerca per nome o codice…"
            className="iscrizione-cerca"
          />
          {cerca && <button className="btn-ghost btn-sm" onClick={() => setCerca('')}>✕</button>}
        </div>

        {/* Selezione — ordine: educatori → animatori → pre-animatori → amici */}
        <div className="iscrizione-ruoli">
          <SezioneRuolo titolo="Educatori" emoji="👨‍🏫"
            personaggi={educatori} selezionati={educatore ? [educatore] : []}
            onToggle={toggleEducatore} max={1} cerca={cerca} idEscluso={idSelf} />
          <SezioneRuolo titolo="Animatori" emoji="🎭"
            personaggi={animatoriList} selezionati={animatori}
            onToggle={toggleAnimatore} max={2} cerca={cerca} idEscluso={idSelf} />
          <SezioneRuolo titolo="Pre-animatori" emoji="🌱"
            personaggi={preAnimatoriList} selezionati={preAnimatore ? [preAnimatore] : []}
            onToggle={togglePreAnimatore} max={1} cerca={cerca} idEscluso={idSelf} />
          <SezioneRuolo titolo="Amici di San Carlo" emoji="✝️"
            personaggi={amiciList} selezionati={amicoSanCarlo ? [amicoSanCarlo] : []}
            onToggle={toggleAmico} max={1} cerca={cerca} idEscluso={idSelf} />
        </div>

        {/* Riepilogo */}
        <div className="iscrizione-risultato">
          <h3>📋 Riepilogo</h3>
          <div className="iscrizione-stato-row">
            <span className={`iscrizione-stato-badge ${educatore ? 'ok' : 'mancante'}`}>
              {educatore ? `✓ ${personaggi.find(p => p.id === educatore)?.nome}` : '— Educatore mancante'}
            </span>
            {[0, 1].map(i => (
              <span key={i} className={`iscrizione-stato-badge ${animatori[i] ? 'ok' : 'mancante'}`}>
                {animatori[i] ? `✓ ${personaggi.find(p => p.id === animatori[i])?.nome}` : `— Animatore ${i + 1} mancante`}
              </span>
            ))}
            <span className={`iscrizione-stato-badge ${preAnimatore ? 'ok' : 'mancante'}`}>
              {preAnimatore ? `✓ ${personaggi.find(p => p.id === preAnimatore)?.nome}` : '— Pre animatore mancante'}
            </span>
            <span className={`iscrizione-stato-badge ${amicoSanCarlo ? 'ok' : 'mancante'}`}>
              {amicoSanCarlo ? `✓ ${personaggi.find(p => p.id === amicoSanCarlo)?.nome}` : '— Amico San Carlo mancante'}
            </span>
            <span className={`iscrizione-stato-badge ${squadraOratorio ? 'ok' : 'mancante'}`}>
              {squadraOratorio ? `${SQUADRE_LABEL[squadraOratorio].emoji} ${SQUADRE_LABEL[squadraOratorio].label}` : '— Squadra mancante'}
            </span>
          </div>

          {completo ? (
            <div className="iscrizione-csv-box">
              <p className="iscrizione-csv-label">Riga da copiare e inviare all'admin:</p>
              <div className="iscrizione-csv-riga">
                <code>{rigaCSV}</code>
                <button className={`btn-primary btn-sm ${copiato ? 'btn-success' : ''}`} onClick={copiaRiga}>
                  {copiato ? '✓ Copiato!' : '📋 Copia'}
                </button>
              </div>
              <p className="iscrizione-csv-hint">
                Il tuo codice di accesso è <strong>{codiceFinale}</strong>. Usalo sempre per entrare!
              </p>
              <button className="btn-ghost btn-sm" onClick={reset} style={{ marginTop: 8 }}>🔄 Ricomincia</button>
            </div>
          ) : (
            <p className="iscrizione-avviso">
              {!nomeSquadra.trim()
                ? '⬆️ Inserisci il nome della tua squadra per continuare.'
                : 'Seleziona tutti i personaggi e la squadra per generare la riga.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
