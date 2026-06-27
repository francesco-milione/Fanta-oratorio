import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function LoginPage({ onIscrizione }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);
  const [dimenticato, setDimenticato] = useState(false);
  const { login } = useAuth();
  const { loading: dataLoading, error: dataError } = useData();

  const handleSubmit = () => {
    if (!username.trim()) { setErrore('Inserisci il tuo username.'); return; }
    if (!password.trim()) { setErrore('Inserisci la tua password.'); return; }
    setLoading(true);
    setErrore('');
    setTimeout(() => {
      const res = login(username, password);
      if (!res.ok) setErrore(res.errore);
      setLoading(false);
    }, 400);
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">⛪</span>
          <h1>Fanta<span>Oratorio</span></h1>
          <p className="login-oratorio">San Carlo Acutis · Rotonda</p>
          <p className="login-subtitle">Il gioco dell'estate!</p>
        </div>

        {dataLoading && (
          <div className="login-loading">
            <div className="spinner" />
            <span>Caricamento dati…</span>
          </div>
        )}

        {dataError && (
          <div className="alert alert-error">
            ⚠️ Errore nel caricamento dati. Ricarica la pagina.
          </div>
        )}

        {!dataLoading && !dataError && (
          <>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value.toUpperCase()); setErrore(''); }}
                onKeyDown={handleKey}
                placeholder="es. ALFA2026"
                maxLength={12}
                autoFocus
                autoComplete="username"
              />
              <p className="input-hint">Il codice che ti è stato consegnato</p>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value.toUpperCase()); setErrore(''); }}
                onKeyDown={handleKey}
                placeholder="••••••••"
                maxLength={20}
                autoComplete="current-password"
              />
              <p className="input-hint">Al primo accesso coincide con il tuo username</p>
            </div>

            {errore && <div className="alert alert-error">{errore}</div>}

            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <><div className="spinner-sm" /> Accesso…</> : '🏆 Entra nella tua squadra'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 12 }}>
              {!dimenticato ? (
                <button
                  className="btn-ghost"
                  style={{ fontSize: 13, color: 'var(--text-muted)' }}
                  onClick={() => setDimenticato(true)}
                >
                  Hai dimenticato la password?
                </button>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--bg-subtle, #f3f4f6)', borderRadius: 10 }}>
                  🙏 <em>«Chiedete e vi sarà dato»</em> — Mt 7,7<br />
                  <span style={{ fontSize: 12 }}>Chiedi a chi gestisce il gioco!</span>
                </div>
              )}
            </div>

            <div className="login-divider"><span>oppure</span></div>

            {/* <button className="btn-secondary" onClick={onIscrizione}>
              📝 Crea la tua squadra
            </button> */}
          </>
        )}
      </div>
    </div>
  );
}
