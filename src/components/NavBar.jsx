import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function NavBar({ pagina, setPagina }) {
  const { utente, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>⛪</span>
        <span className="brand-text">Fanta<b>Oratorio</b></span>
      </div>

      <div className="navbar-tabs">
        <button className={`nav-tab ${pagina === 'squadra' ? 'active' : ''}`} onClick={() => setPagina('squadra')}>
          <span>🏅</span><span>Squadra</span>
        </button>
        <button className={`nav-tab ${pagina === 'classifica' ? 'active' : ''}`} onClick={() => setPagina('classifica')}>
          <span>🏆</span><span>Classifica</span>
        </button>
        <button className={`nav-tab ${pagina === 'giornata' ? 'active' : ''}`} onClick={() => setPagina('giornata')}>
          <span>📅</span><span>Giornata</span>
        </button>
        <button className={`nav-tab ${pagina === 'regolamento' ? 'active' : ''}`} onClick={() => setPagina('regolamento')}>
          <span>📋</span><span>Regole</span>
        </button>
      </div>

      <div className="navbar-user">
        <span className="user-label">{utente?.proprietario}</span>
        <button className="btn-logout" onClick={logout} title="Esci">↩</button>
      </div>
    </nav>
  );
}
