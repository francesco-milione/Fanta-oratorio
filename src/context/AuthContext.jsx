import React, { createContext, useContext, useState } from 'react';
import { useData } from './DataContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fanta_utente');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const { giocatori, utenti, loading } = useData();

  const buildUtente = (utenteBase, giocatoriList) => {
    // Cerca se questo utente ha già una squadra in giocatori.csv (stesso codice)
    const team = giocatoriList.find(
      g => g.codice?.trim().toUpperCase() === utenteBase.codice?.trim().toUpperCase()
    );
    if (team) {
      return { ...utenteBase, ...team, hasTeam: true };
    }
    return { ...utenteBase, hasTeam: false };
  };

  const login = (codice) => {
    const cod = codice.trim().toUpperCase();

    // Admin
    if (cod === 'ADMIN2026') {
      const admin = { codice: 'ADMIN2026', isAdmin: true, nome_squadra: 'Admin' };
      setUtente(admin);
      sessionStorage.setItem('fanta_utente', JSON.stringify(admin));
      return { ok: true };
    }

    // Controlla utenti.csv (login personale con password pre-assegnata)
    const utenteFound = utenti.find(u => u.codice?.trim().toUpperCase() === cod);
    if (utenteFound) {
      const u = buildUtente(utenteFound, giocatori);
      setUtente(u);
      sessionStorage.setItem('fanta_utente', JSON.stringify(u));
      return { ok: true };
    }

    // Fallback: controlla giocatori.csv direttamente (compatibilità vecchi codici squadra)
    const teamFound = giocatori.find(g => g.codice?.trim().toUpperCase() === cod);
    if (teamFound) {
      const u = { ...teamFound, hasTeam: true };
      setUtente(u);
      sessionStorage.setItem('fanta_utente', JSON.stringify(u));
      return { ok: true };
    }

    return { ok: false, errore: 'Codice non riconosciuto. Controlla il tuo codice e riprova.' };
  };

  const logout = () => {
    setUtente(null);
    sessionStorage.removeItem('fanta_utente');
  };

  // Aggiorna utente quando i CSV cambiano (es. admin aggiunge la squadra)
  React.useEffect(() => {
    if (!utente || utente.isAdmin) return;
    if (giocatori.length === 0 && utenti.length === 0) return;

    const utenteBase = utenti.find(u => u.codice === utente.codice);
    if (utenteBase) {
      const aggiornato = buildUtente(utenteBase, giocatori);
      setUtente(aggiornato);
      sessionStorage.setItem('fanta_utente', JSON.stringify(aggiornato));
    } else {
      // fallback per codici legacy
      const team = giocatori.find(g => g.codice === utente.codice);
      if (team) {
        const aggiornato = { ...utente, ...team, hasTeam: true };
        setUtente(aggiornato);
        sessionStorage.setItem('fanta_utente', JSON.stringify(aggiornato));
      }
    }
  }, [giocatori, utenti]); // eslint-disable-line

  return (
    <AuthContext.Provider value={{ utente, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
