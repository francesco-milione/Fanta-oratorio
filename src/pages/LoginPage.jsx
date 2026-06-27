import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function LoginPage() {
  const [codice, setCodice] = useState('');
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { loading: dataLoading, error: dataError } = useData();

  const handleSubmit = () => {
    if (!codice.trim()) { setErrore('Inserisci il tuo codice.'); return; }
    setLoading(true);
    setErrore('');
    setTimeout(() => {
      const res = login(codice);
      if (!res.ok) setErrore(res.errore);
      setLoading(false);
    }, 400);
  };

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
              <label htmlFor="codice">Il tuo codice segreto</label>
              <input
                id="codice"
                type="text"
                value={codice}
                onChange={e => { setCodice(e.target.value.toUpperCase()); setErrore(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="es. ALFA2026"
                maxLength={12}
                autoFocus
                autoComplete="off"
              />
              <p className="input-hint">Il codice ti è stato consegnato a voce</p>
            </div>

            {errore && <div className="alert alert-error">{errore}</div>}

            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <><div className="spinner-sm" /> Accesso…</> : '🏆 Entra nella tua squadra'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
