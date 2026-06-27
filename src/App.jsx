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

function AppContent({ vistaGlobale, setVistaGlobale }) {
  const { utente } = useAuth();
  const [pagina, setPagina] = useState('squadra');

  // Vista iscrizione pubblica (senza login)
  if (vistaGlobale === 'iscrizione') {
    return <Iscrizione onTornaLogin={() => setVistaGlobale(null)} />;
  }

  if (!utente) return <LoginPage onIscrizione={() => setVistaGlobale('iscrizione')} />;

  if (utente.isAdmin) return <AdminPage />;

  // Utente loggato ma senza squadra → mostra il form di creazione
  if (utente.hasTeam === false) {
    return (
      <Iscrizione
        modalitaPostLogin
        utenteLoggato={utente}
        onTornaLogin={() => {}} // non necessario in questa modalità
      />
    );
  }

  return (
    <div>
      <NavBar pagina={pagina} setPagina={setPagina} onIscrizione={() => setVistaGlobale('iscrizione')} />
      {pagina === 'squadra'    && <MiaSquadra />}
      {pagina === 'classifica' && <Classifica />}
      {pagina === 'giornata'   && <Giornata />}
      {pagina === 'regolamento'&& <Regolamento />}
      {pagina === 'personaggi' && <Personaggi />}
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
