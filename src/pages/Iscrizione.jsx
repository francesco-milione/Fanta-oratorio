import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

// Genera un codice squadra casuale tipo "ABC12"
function generaCodice() {
  const lettere = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const cifre = '0123456789';
  let cod = '';
  for (let i = 0; i < 3; i++) cod += lettere[Math.floor(Math.random() * lettere.length)];
  for (let i = 0; i < 2; i++) cod += cifre[Math.floor(Math.random() * cifre.length)];
  return cod;
}

function RigaPersonaggio({ p, selezionato, onClick, disabled, punteggio }) {
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

function SezioneRuolo({ titolo, emoji, personaggi, selezionati, onToggle, max, punteggi, cerca }) {
  const filtrati = personaggi.filter(p =>
    p.nome.toLowerCase().includes(cerca.toLowerCase()) ||
    p.id.toLowerCase().includes(cerca.toLowerCase())
  );

  return (
    <div className="iscrizione-sezione">
      <div className="iscrizione-sezione-header">
        <span>{emoji} {titolo}</span>
        <span className="iscrizione-sezione-count">{selezionati.length}/{max}</span>
      </div>
      <div className="iscrizione-cards">
        {filtrati.length === 0 && (
          <p className="iscrizione-empty">Nessun risultato per "{cerca}"</p>
        )}
        {filtrati.map(p => {
          const sel = selezionati.includes(p.id);
          const pieno = selezionati.length >= max && !sel;
          return (
            <RigaPersonaggio
              key={p.id}
              p={p}
              selezionato={sel}
              disabled={pieno}
              onClick={() => onToggle(p.id)}
              punteggio={punteggi[p.id]}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function Iscrizione({ onTornaLogin }) {
  const { personaggi, loading, error, getPersonaggioScore } = useData();

  const [nomeSquadra, setNomeSquadra] = useState('');
  const [proprietario, setProprietario] = useState('');
  const [codice, setCodice] = useState(() => generaCodice());
  const [educatore, setEducatore] = useState(null);
  const [animatori, setAnimatori] = useState([]);
  const [bambini, setBambini] = useState([]);
  const [cerca, setCerca] = useState('');
  const [copiato, setCopiato] = useState(false);

  const educatori = useMemo(() => personaggi.filter(p => p.ruolo === 'educatore'), [personaggi]);
  const animatoriList = useMemo(() => personaggi.filter(p => p.ruolo === 'animatore'), [personaggi]);
  const bambiniList = useMemo(() => personaggi.filter(p => p.ruolo === 'bambino'), [personaggi]);

  // Calcola punteggi per tutti
  const punteggi = useMemo(() => {
    const map = {};
    personaggi.forEach(p => {
      map[p.id] = getPersonaggioScore(p.id).totale;
    });
    return map;
  }, [personaggi, getPersonaggioScore]);

  const toggleEducatore = (id) => {
    setEducatore(prev => prev === id ? null : id);
  };
  const toggleAnimatore = (id) => {
    setAnimatori(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };
  const toggleBambino = (id) => {
    setBambini(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const completo = educatore && animatori.length === 2 && bambini.length === 3 && nomeSquadra.trim() && proprietario.trim();

  const rigaCSV = completo
    ? `${codice},${nomeSquadra.trim()},${proprietario.trim()},${educatore},${animatori[0]},${animatori[1]},${bambini[0]},${bambini[1]},${bambini[2]}`
    : '';

  const copiaRiga = () => {
    navigator.clipboard.writeText(rigaCSV).then(() => {
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    });
  };

  const reset = () => {
    setNomeSquadra('');
    setProprietario('');
    setCodice(generaCodice());
    setEducatore(null);
    setAnimatori([]);
    setBambini([]);
    setCerca('');
    setCopiato(false);
  };

  if (loading) return (
    <div className="iscrizione-page">
      <div className="login-loading"><div className="spinner" /><span>Caricamento…</span></div>
    </div>
  );
  if (error) return (
    <div className="iscrizione-page">
      <div className="alert alert-error">⚠️ {error}</div>
    </div>
  );

  return (
    <div className="iscrizione-page">
      <div className="iscrizione-header">
        <div className="iscrizione-header-top">
          <div>
            <span className="logo-icon" style={{ fontSize: 28 }}>⛪</span>
            <span style={{ fontWeight: 700, fontSize: 20, marginLeft: 8 }}>
              Fanta<b>Oratorio</b>
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>— Iscrizione Squadra</span>
          </div>
          <button className="btn-secondary btn-sm" onClick={onTornaLogin}>
            🔐 Accedi
          </button>
        </div>
        <p className="iscrizione-intro">
          Scegli il tuo educatore, 2 animatori e 3 bambini. Poi copia la riga e consegnala all'admin!
        </p>
      </div>

      <div className="iscrizione-body">
        {/* Dati squadra */}
        <div className="iscrizione-form-box">
          <h3>📝 La tua squadra</h3>
          <div className="iscrizione-form-row">
            <div className="input-group" style={{ flex: 1 }}>
              <label>Nome squadra</label>
              <input
                type="text"
                value={nomeSquadra}
                onChange={e => setNomeSquadra(e.target.value)}
                placeholder="es. Gli Invincibili"
                maxLength={30}
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Il tuo nome</label>
              <input
                type="text"
                value={proprietario}
                onChange={e => setProprietario(e.target.value)}
                placeholder="es. Alberto R."
                maxLength={30}
              />
            </div>
          </div>
          <div className="iscrizione-codice-row">
            <div className="input-group" style={{ flex: 1 }}>
              <label>Codice di accesso (generato automaticamente)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={codice}
                  onChange={e => setCodice(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  placeholder="es. ABC12"
                  maxLength={8}
                  style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}
                />
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setCodice(generaCodice())}
                  title="Rigenera codice"
                >🔄</button>
              </div>
              <p className="input-hint">Lo userai per accedere all'app. Tienilo da parte!</p>
            </div>
          </div>
        </div>

        {/* Ricerca globale */}
        <div className="iscrizione-cerca-box">
          <input
            type="text"
            value={cerca}
            onChange={e => setCerca(e.target.value)}
            placeholder="🔍 Cerca per nome o codice…"
            className="iscrizione-cerca"
          />
          {cerca && (
            <button className="btn-ghost btn-sm" onClick={() => setCerca('')}>✕</button>
          )}
        </div>

        {/* Selezione personaggi */}
        <div className="iscrizione-ruoli">
          <SezioneRuolo
            titolo="Educatori" emoji="👨‍🏫"
            personaggi={educatori}
            selezionati={educatore ? [educatore] : []}
            onToggle={toggleEducatore}
            max={1}
            punteggi={punteggi}
            cerca={cerca}
          />
          <SezioneRuolo
            titolo="Animatori" emoji="🎭"
            personaggi={animatoriList}
            selezionati={animatori}
            onToggle={toggleAnimatore}
            max={2}
            punteggi={punteggi}
            cerca={cerca}
          />
          <SezioneRuolo
            titolo="Bambini" emoji="⭐"
            personaggi={bambiniList}
            selezionati={bambini}
            onToggle={toggleBambino}
            max={3}
            punteggi={punteggi}
            cerca={cerca}
          />
        </div>

        {/* Riepilogo e riga CSV */}
        <div className="iscrizione-risultato">
          <h3>📋 Riepilogo squadra</h3>

          {/* Stato selezioni */}
          <div className="iscrizione-stato-row">
            <span className={`iscrizione-stato-badge ${educatore ? 'ok' : 'mancante'}`}>
              {educatore ? `✓ ${personaggi.find(p => p.id === educatore)?.nome}` : '— Educatore mancante'}
            </span>
            {[0, 1].map(i => (
              <span key={i} className={`iscrizione-stato-badge ${animatori[i] ? 'ok' : 'mancante'}`}>
                {animatori[i] ? `✓ ${personaggi.find(p => p.id === animatori[i])?.nome}` : `— Animatore ${i + 1} mancante`}
              </span>
            ))}
            {[0, 1, 2].map(i => (
              <span key={i} className={`iscrizione-stato-badge ${bambini[i] ? 'ok' : 'mancante'}`}>
                {bambini[i] ? `✓ ${personaggi.find(p => p.id === bambini[i])?.nome}` : `— Bambino ${i + 1} mancante`}
              </span>
            ))}
          </div>

          {completo ? (
            <div className="iscrizione-csv-box">
              <p className="iscrizione-csv-label">Riga da copiare e inviare all'admin:</p>
              <div className="iscrizione-csv-riga">
                <code>{rigaCSV}</code>
                <button
                  className={`btn-primary btn-sm ${copiato ? 'btn-success' : ''}`}
                  onClick={copiaRiga}
                >
                  {copiato ? '✓ Copiato!' : '📋 Copia'}
                </button>
              </div>
              <p className="iscrizione-csv-hint">
                Ricorda: il tuo codice di accesso è <strong>{codice}</strong>. Salvalo!
              </p>
              <button className="btn-ghost btn-sm" onClick={reset} style={{ marginTop: 8 }}>
                🔄 Ricomincia
              </button>
            </div>
          ) : (
            <p className="iscrizione-avviso">
              {!nomeSquadra.trim() || !proprietario.trim()
                ? '⬆️ Inserisci nome squadra e il tuo nome per continuare.'
                : 'Seleziona tutti i personaggi richiesti per generare la riga.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
