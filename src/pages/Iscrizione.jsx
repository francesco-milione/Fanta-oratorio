import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SQUADRE_ORATORIO, SQUADRE_LABEL } from '../context/DataContext';
import { supabase } from '../supabaseClient';
import { hashPassword, isHash } from '../utils/crypto';

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
    if (p.id === idEscluso) return false;
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
// modalitaModifica  = true → modifica squadra esistente (pre-fill + UPDATE)
export default function Iscrizione({ onTornaLogin, modalitaPostLogin = false, utenteLoggato = null, modalitaModifica = false, onTornaSquadra = null }) {
  const { personaggi, loading, error, reload } = useData();
  const { logout } = useAuth();

  const [nomeSquadra, setNomeSquadra] = useState(modalitaModifica ? (utenteLoggato?.['nome-squadra'] || '') : '');
  const [proprietario] = useState(modalitaPostLogin ? (utenteLoggato?.nome || '') : '');
  const [codice] = useState(modalitaPostLogin ? (utenteLoggato?.codice || generaCodice()) : generaCodice());
  const [codiceLibero, setCodiceLibero] = useState(!modalitaPostLogin ? generaCodice() : '');
  const [nomeLibero, setNomeLibero] = useState('');
  const [educatore, setEducatore] = useState(modalitaModifica ? (utenteLoggato?.educatore || null) : null);
  const [animatori, setAnimatori] = useState(modalitaModifica ? [utenteLoggato?.animatore1, utenteLoggato?.animatore2].filter(Boolean) : []);
  const [preAnimatore, setPreAnimatore] = useState(modalitaModifica ? (utenteLoggato?.['pre animatore'] || null) : null);
  const [amicoSanCarlo, setAmicoSanCarlo] = useState(modalitaModifica ? (utenteLoggato?.['amico san carlo'] || null) : null);
  const [squadraOratorio, setSquadraOratorio] = useState(modalitaModifica ? (utenteLoggato?.['squadra-oratorio'] || null) : null);
  const [cerca, setCerca] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [salvato, setSalvato] = useState(false);
  const [erroreSubmit, setErroreSubmit] = useState(null);

  // ID del personaggio dell'utente loggato (da escludere dalla selezione)
  const idSelf = modalitaPostLogin ? utenteLoggato?.id_personaggio : null;

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

  const salvaSquadra = async () => {
    if (!completo || salvando) return;
    setSalvando(true);
    setErroreSubmit(null);

    // passwordHash = già calcolato da completaPrimoAccesso (modalitaPostLogin).
    // Fallback: isHash() per password legacy già hashate in sessione, oppure hasha il codice (iscrizione libera).
    const pwSessioneHash = utenteLoggato?.passwordHash;
    const pwSessionePlain = utenteLoggato?.password;
    const pwToSave = pwSessioneHash
      ? pwSessioneHash
      : pwSessionePlain && isHash(pwSessionePlain)
        ? pwSessionePlain
        : await hashPassword((pwSessionePlain || codiceFinale).trim().toUpperCase());

    const riga = {
      'codice':           codiceFinale.trim().toUpperCase(),
      'password':         pwToSave,
      'nome-squadra':     nomeSquadra.trim(),
      'proprietario':     nomeFinale.trim(),
      'educatore':        educatore,
      'animatore1':       animatori[0],
      'animatore2':       animatori[1],
      'pre animatore':    preAnimatore,
      'amico san carlo':  amicoSanCarlo,
      'squadra-oratorio': squadraOratorio,
    };

    let sbError;
    if (modalitaModifica) {
      ({ error: sbError } = await supabase
        .from('giocatori')
        .update(riga)
        .eq('codice', codiceFinale.trim().toUpperCase()));
    } else {
      ({ error: sbError } = await supabase.from('giocatori').insert(riga));
    }

    if (sbError) {
      if (sbError.code === '23505') {
        setErroreSubmit('Questo codice è già stato usato per creare una squadra.');
      } else {
        setErroreSubmit(`Errore: ${sbError.message}`);
      }
      setSalvando(false);
      return;
    }

    setSalvato(true);
    setSalvando(false);
    // Ricarica i dati → AuthContext aggiorna l'utente
    await reload();
    // In modalità modifica torna automaticamente alla pagina squadra
    if (modalitaModifica) {
      onTornaSquadra?.();
    }
  };

  const reset = () => {
    setNomeSquadra('');
    if (!modalitaPostLogin) { setNomeLibero(''); setCodiceLibero(generaCodice()); }
    setEducatore(null); setAnimatori([]); setPreAnimatore(null);
    setAmicoSanCarlo(null); setSquadraOratorio(null); setCerca('');
    setSalvato(false); setErroreSubmit(null);
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
          <div className="iscrizione-brand">
            <span style={{ fontSize: 26 }}>⛪</span>
            <span className="iscrizione-brand-text">Fanta<b>Oratorio</b></span>
            <span className="iscrizione-brand-chip">
              {modalitaModifica ? '✏️ Modifica' : modalitaPostLogin ? '🏆 Crea squadra' : '📝 Iscrizione'}
            </span>
          </div>
          {modalitaModifica ? (
            <button className="btn-outline-white" onClick={onTornaSquadra}>← Torna</button>
          ) : modalitaPostLogin ? (
            <button className="btn-outline-white" onClick={logout}>🚪 Esci</button>
          ) : (
            <button className="btn-outline-white" onClick={onTornaLogin}>🔐 Accedi</button>
          )}
        </div>

        {modalitaModifica ? (
          <p className="iscrizione-intro">
            Modifica la formazione di <strong>{utenteLoggato?.['nome-squadra']}</strong>.
            Le modifiche sovrascrivono la squadra attuale.
          </p>
        ) : modalitaPostLogin ? (
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
                disabled={salvato}
              />
            </div>
            {!modalitaPostLogin && (
              <div className="input-group" style={{ flex: 1 }}>
                <label>Il tuo nome</label>
                <input
                  type="text" value={nomeLibero}
                  onChange={e => setNomeLibero(e.target.value)}
                  placeholder="es. Alberto R." maxLength={30}
                  disabled={salvato}
                />
              </div>
            )}
          </div>

          {modalitaPostLogin ? (
            <div className="iscrizione-codice-row">
              <div className="input-group">
                <label>Proprietario</label>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>
                  {proprietario}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <label>Username</label>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 3, fontSize: 20, color: 'var(--primary)' }}>
                      {codice}
                    </div>
                  </div>

                </div>
                <p className="input-hint">Usali sempre per entrare nell'app.</p>
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
                    disabled={salvato}
                  />
                  <button className="btn-secondary btn-sm" onClick={() => setCodiceLibero(generaCodice())} title="Rigenera" disabled={salvato}>🔄</button>
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
                <button key={sq} onClick={() => !salvato && setSquadraOratorio(sq)} style={{
                  padding: '12px 20px', borderRadius: 12,
                  border: `2px solid ${sel ? info.colore : 'var(--border)'}`,
                  background: sel ? info.colore + '22' : 'transparent',
                  color: sel ? info.colore : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 16, cursor: salvato ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                  opacity: salvato ? 0.7 : 1,
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
        {!salvato && (
          <div className="iscrizione-cerca-box">
            <input
              type="text" value={cerca}
              onChange={e => setCerca(e.target.value)}
              placeholder="🔍 Cerca per nome o codice…"
              className="iscrizione-cerca"
            />
            {cerca && <button className="btn-ghost btn-sm" onClick={() => setCerca('')}>✕</button>}
          </div>
        )}

        {/* Selezione — ordine: educatori → animatori → pre-animatori → amici */}
        {!salvato && (
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
        )}

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

          {salvato ? (
            <div className="iscrizione-csv-box" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h3 style={{ color: 'var(--primary)', marginBottom: 4 }}>Squadra salvata!</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                La tua squadra <strong>{nomeSquadra}</strong> è stata registrata.
                {!modalitaPostLogin && (
                  <> Il tuo codice è <strong style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{codiceFinale}</strong> — tienilo da parte!</>
                )}
              </p>
              {!modalitaPostLogin && (
                <button className="btn-ghost btn-sm" onClick={reset}>🔄 Registra un'altra squadra</button>
              )}
            </div>
          ) : erroreSubmit ? (
            <div className="iscrizione-csv-box">
              <div className="alert alert-error" style={{ marginBottom: 12 }}>⚠️ {erroreSubmit}</div>
              <button className="btn-ghost btn-sm" onClick={() => setErroreSubmit(null)}>Riprova</button>
            </div>
          ) : completo ? (
            <div className="iscrizione-csv-box">
              <button
                className="btn-primary"
                onClick={salvaSquadra}
                disabled={salvando}
                style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 8 }}
              >
                {salvando ? '⏳ Salvataggio…' : '✅ Conferma e salva squadra'}
              </button>
            </div>
          ) : (
            <p className="iscrizione-avviso">
              {!nomeSquadra.trim()
                ? '⬆️ Inserisci il nome della tua squadra per continuare.'
                : 'Seleziona tutti i personaggi e la squadra per confermare.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
