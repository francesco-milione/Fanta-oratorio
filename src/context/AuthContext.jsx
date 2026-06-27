import React, { createContext, useContext, useState } from 'react';
import { useData } from './DataContext';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fanta_utente');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const { giocatori, utenti, loading } = useData();

  // primo accesso = loggato, non admin, password non ancora impostata
  // (vale sia per chi non ha ancora la squadra, sia per chi ce l'ha ma non ha mai cambiato)
  const primoAccesso = !!(utente && !utente.isAdmin && !utente.password);

  const buildUtente = (utenteBase, giocatoriList) => {
    const team = giocatoriList.find(
      g => g.codice?.trim().toUpperCase() === utenteBase.codice?.trim().toUpperCase()
    );
    if (team) return { ...utenteBase, ...team, hasTeam: true };
    return { ...utenteBase, hasTeam: false };
  };

  const _salvaUtente = (u) => {
    setUtente(u);
    sessionStorage.setItem('fanta_utente', JSON.stringify(u));
  };

  const login = (username, password) => {
    const user = username.trim().toUpperCase();
    const pass = password.trim().toUpperCase();

    // Admin
    if (user === 'ADMIN2026') {
      if (pass !== 'ADMIN2026') return { ok: false, errore: 'Password errata.' };
      const admin = { codice: 'ADMIN2026', isAdmin: true, nome_squadra: 'Admin' };
      _salvaUtente(admin);
      return { ok: true };
    }

    // Trova l'utente per username (codice)
    const utenteFound = utenti.find(u => u.codice?.trim().toUpperCase() === user);
    const teamFound = giocatori.find(g => g.codice?.trim().toUpperCase() === user);

    if (!utenteFound && !teamFound) {
      return { ok: false, errore: 'Username non riconosciuto.' };
    }

    // Controlla password: usa giocatori.password se impostata, altrimenti il codice
    const passwordAttesa = teamFound?.password?.trim().toUpperCase() || user;
    if (pass !== passwordAttesa) {
      return { ok: false, errore: 'Password errata.' };
    }

    const u = utenteFound
      ? buildUtente(utenteFound, giocatori)
      : { ...teamFound, hasTeam: true };
    _salvaUtente(u);
    return { ok: true };
  };

  const logout = () => {
    setUtente(null);
    sessionStorage.removeItem('fanta_utente');
  };

  // Chiamata dal modal primo accesso.
  // nuovaPassword = stringa → cambia, null → usa il codice come password
  const completaPrimoAccesso = async (nuovaPassword) => {
    const cod = utente?.codice;
    if (!cod) return;

    const pw = nuovaPassword ? nuovaPassword.trim().toUpperCase() : cod.trim().toUpperCase();

    if (utente.hasTeam) {
      // Ha già una squadra → aggiorna subito Supabase
      await supabase.from('giocatori').update({ password: pw }).eq('codice', cod);
    }
    // In entrambi i casi aggiorna la sessione.
    // Se non ha ancora la squadra, la password verrà inclusa nell'INSERT di Iscrizione.
    _salvaUtente({ ...utente, password: pw });
  };

  // Aggiorna utente quando i dati cambiano
  React.useEffect(() => {
    if (!utente || utente.isAdmin) return;
    if (giocatori.length === 0 && utenti.length === 0) return;

    const utenteBase = utenti.find(u => u.codice === utente.codice);
    if (utenteBase) {
      const aggiornato = buildUtente(utenteBase, giocatori);
      // preserva la password in sessione se non è ancora su DB
      _salvaUtente({ ...aggiornato, password: aggiornato.password || utente.password });
    } else {
      const team = giocatori.find(g => g.codice === utente.codice);
      if (team) _salvaUtente({ ...utente, ...team, hasTeam: true });
    }
  }, [giocatori, utenti]); // eslint-disable-line

  return (
    <AuthContext.Provider value={{ utente, login, logout, loading, primoAccesso, completaPrimoAccesso }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
