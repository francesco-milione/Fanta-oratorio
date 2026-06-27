import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function LoginPage({ onIscrizione }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);
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
