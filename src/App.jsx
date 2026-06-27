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

function AppContent({ vistaGlobale, setVistaGlobale }) {
  const { utente } = useAuth();
  const [pagina, setPagina] = useState('squadra');

  if (vistaGlobale === 'iscrizione') {
    return <Iscrizione onTornaLogin={() => setVistaGlobale(null)} />;
  }

  if (!utente) return <LoginPage onIscrizione={() => setVistaGlobale('iscrizione')} />;

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
