import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ModaleCambioCodice() {
  const { utente, completaPrimoAccesso, logout } = useAuth();
  const [fase, setFase] = useState('riepilogo'); // 'riepilogo' | 'cambia'
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [errore, setErrore] = useState('');
  const [salvando, setSalvando] = useState(false);

  const username = utente?.codice || '';
  const passwordDefault = username; // al primo accesso coincidono
  const nome = utente?.nome || '';

  const handleConferma = async () => {
    const pw = nuovaPassword.trim().toUpperCase();
    if (pw.length < 4) { setErrore('La password deve avere almeno 4 caratteri.'); return; }
    if (pw === username) { setErrore("La nuova password coincide con l'username. Scegli qualcosa di diverso."); return; }
    setSalvando(true);
    await completaPrimoAccesso(pw);
    setSalvando(false);
  };

  const handleTieni = async () => {
    setSalvando(true);
    await completaPrimoAccesso(null); // tiene username come password
    setSalvando(false);
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
        </div>

        {fase === 'riepilogo' && (
          <>
            <h2 style={{ margin: '0 0 4px', fontSize: 19 }}>
              Benvenuto{nome ? `, ${nome}` : ''}! 👋
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>
              Ricordati le tue credenziali di accesso:
            </p>

            <div style={{ background: 'var(--bg-subtle, #f3f4f6)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Username</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 22, letterSpacing: 3, color: 'var(--primary, #6c63ff)', marginTop: 2 }}>
                  {username}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Password</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 22, letterSpacing: 3, color: 'var(--primary, #6c63ff)', marginTop: 2 }}>
                  {passwordDefault}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Per ora coincide con l'username
                </p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              Vuoi impostare una password personalizzata più facile da ricordare?
            </p>

            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <button className="btn-primary" onClick={() => setFase('cambia')} style={{ width: '100%' }}>
                ✏️ Sì, cambio la password
              </button>
              <button className="btn-ghost" onClick={handleTieni} disabled={salvando} style={{ width: '100%', fontSize: 14 }}>
                {salvando ? '⏳…' : 'Continua con questa password'}
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              <button className="btn-ghost" onClick={logout} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                🚪 Esci
              </button>
            </div>
          </>
        )}

        {fase === 'cambia' && (
          <>
            <h2 style={{ margin: '0 0 4px', fontSize: 19 }}>Scegli la tua password</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 8px' }}>
              Il tuo username rimane <strong style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{username}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>
              Solo lettere e numeri, minimo 4 caratteri.
            </p>

            <div className="input-group" style={{ marginBottom: 8 }}>
              <label>Nuova password</label>
              <input
                type="text"
                value={nuovaPassword}
                onChange={e => {
                  setNuovaPassword(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20));
                  setErrore('');
                }}
                onKeyDown={e => e.key === 'Enter' && !salvando && handleConferma()}
                placeholder="es. ESTATE2026"
                maxLength={20}
                autoFocus
                style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2, textAlign: 'center', fontSize: 18 }}
              />
            </div>

            {errore && <div className="alert alert-error" style={{ marginBottom: 12, fontSize: 13 }}>{errore}</div>}

            <div style={{ display: 'flex', gap: 10, flexDirection: 'column', marginTop: 8 }}>
              <button
                className="btn-primary"
                onClick={handleConferma}
                disabled={nuovaPassword.trim().length < 4 || salvando}
                style={{ width: '100%' }}
              >
                {salvando ? '⏳ Salvataggio…' : '✅ Conferma'}
              </button>
              <button
                className="btn-ghost"
                onClick={() => { setFase('riepilogo'); setNuovaPassword(''); setErrore(''); }}
                disabled={salvando}
                style={{ width: '100%', fontSize: 14 }}
              >
                ← Indietro
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
