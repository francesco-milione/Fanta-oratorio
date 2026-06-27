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

  const { giocatori, loading } = useData();

  const login = (codice) => {
    const found = giocatori.find(g => g.codice?.trim().toUpperCase() === codice.trim().toUpperCase());
    if (found) {
      setUtente(found);
      sessionStorage.setItem('fanta_utente', JSON.stringify(found));
      return { ok: true };
    }
    return { ok: false, errore: 'Codice non riconosciuto. Controlla il tuo codice e riprova.' };
  };

  const logout = () => {
    setUtente(null);
    sessionStorage.removeItem('fanta_utente');
  };

  // Aggiorna utente se i dati CSV cambiano
  React.useEffect(() => {
    if (utente && giocatori.length > 0) {
      const aggiornato = giocatori.find(g => g.codice === utente.codice);
      if (aggiornato) setUtente(aggiornato);
    }
  }, [giocatori]); // eslint-disable-line

  return (
    <AuthContext.Provider value={{ utente, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
