import React, { createContext, useContext, useState } from 'react';
import { useData } from './DataContext';
import { supabase } from '../supabaseClient';
import { hashPassword, isHash } from '../utils/crypto';

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

  const login = async (username, password) => {
    const user = username.trim().toUpperCase();
    const pass = password.trim().toUpperCase();

    // Admin — nessun hashing
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

    const storedPassword = teamFound?.password?.trim() || null;

    if (!storedPassword) {
      // Password vuota/null = reset manuale → accetta solo username come password
      if (pass !== user) return { ok: false, errore: 'Password errata.' };
      // primoAccesso = true perché password è null in DB
    } else if (isHash(storedPassword)) {
      // Password hashata (formato corrente)
      const hashed = await hashPassword(pass);
      if (hashed !== storedPassword) return { ok: false, errore: 'Password errata.' };
    } else {
      // Password in chiaro (legacy) — confronta direttamente e migra silenziosamente
      if (pass !== storedPassword.toUpperCase()) return { ok: false, errore: 'Password errata.' };
      const hashed = await hashPassword(pass);
      await supabase.from('giocatori').update({ password: hashed }).eq('codice', user);
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

    const pwPlain = nuovaPassword ? nuovaPassword.trim().toUpperCase() : cod.trim().toUpperCase();
    const pwHash = await hashPassword(pwPlain);

    if (utente.hasTeam) {
      // Ha già una squadra → aggiorna subito Supabase con l'hash
      await supabase.from('giocatori').update({ password: pwHash }).eq('codice', cod);
    }
    // In sessione teniamo il testo in chiaro: serve per il display in Iscrizione
    // e verrà hashato al momento del salvataggio della squadra (se non c'è ancora).
    // L'hash è già su DB (se hasTeam) oppure verrà incluso nell'INSERT di Iscrizione.
    _salvaUtente({ ...utente, password: pwPlain, passwordHash: pwHash });
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
