import React, { useState } from 'react';
import './App.css';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import NavBar from './components/NavBar';
import MiaSquadra from './pages/MiaSquadra';
import Classifica from './pages/Classifica';
import Giornata from './pages/Giornata';
import Regolamento from './pages/Regolamento';
import Iscrizione from './pages/Iscrizione';
import Personaggi from './pages/Personaggi';
import AdminPage from './pages/AdminPage';
import ModaleCambioCodice from './components/ModaleCambioCodice';

// ─── Modifica abilitata solo prima di martedì 30 giugno 2026 alle 8:00 ───────
const DEADLINE_MODIFICA = new Date('2026-06-30T08:00:00');
const MODIFICA_SQUADRA_ABILITATA = new Date() < DEADLINE_MODIFICA;
// ─────────────────────────────────────────────────────────────────────────────

function AppContent({ vistaGlobale, setVistaGlobale }) {
  const { utente, primoAccesso } = useAuth();
  const [pagina, setPagina] = useState('squadra');
  const [modificandoSquadra, setModificandoSquadra] = useState(false);

  // Vista iscrizione pubblica (senza login)
  if (vistaGlobale === 'iscrizione') {
    return <Iscrizione onTornaLogin={() => setVistaGlobale(null)} />;
  }

  if (!utente) return <LoginPage onIscrizione={() => setVistaGlobale('iscrizione')} />;

  if (utente.isAdmin) return <AdminPage />;

  // Primo accesso: schermata dedicata prima di qualsiasi altra vista
  if (primoAccesso) return <ModaleCambioCodice />;

  // Utente loggato ma senza squadra → mostra il form di creazione
  if (utente.hasTeam === false) {
    return (
      <Iscrizione
        modalitaPostLogin
        utenteLoggato={utente}
        onTornaLogin={() => {}}
      />
    );
  }

  // Modalità modifica squadra
  if (modificandoSquadra) {
    return (
      <Iscrizione
        modalitaPostLogin
        modalitaModifica
        utenteLoggato={utente}
        onTornaLogin={() => {}}
        onTornaSquadra={() => setModificandoSquadra(false)}
      />
    );
  }

  return (
    <div>
      <NavBar pagina={pagina} setPagina={setPagina} onIscrizione={() => setVistaGlobale('iscrizione')} />
      {pagina === 'squadra'    && (
        <MiaSquadra
          onModifica={MODIFICA_SQUADRA_ABILITATA ? () => setModificandoSquadra(true) : null}
        />
      )}
      {pagina === 'classifica' && <Classifica />}
      {pagina === 'giornata'   && <Giornata />}
      {pagina === 'regolamento'&& <Regolamento />}
      {pagina === 'personaggi' && <Personaggi />}
      <footer className="app-footer">
        <span>⛪ Oratorio Parrocchiale San Carlo Acutis · Rotonda</span>
        <span className="app-footer-sep">·</span>
        <span>App creata da <b>Francesco Milione</b></span>
      </footer>
    </div>
  );
}

export default function App() {
  const [vistaGlobale, setVistaGlobale] = useState(null);

  return (
    <DataProvider>
      <AuthProvider>
        <AppContent vistaGlobale={vistaGlobale} setVistaGlobale={setVistaGlobale} />
      </AuthProvider>
    </DataProvider>
  );
}
