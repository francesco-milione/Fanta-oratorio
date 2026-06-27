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

function AppContent() {
  const { utente } = useAuth();
  const [pagina, setPagina] = useState('squadra');

  if (!utente) return <LoginPage />;

  return (
    <div>
      <NavBar pagina={pagina} setPagina={setPagina} />
      {pagina === 'squadra'    && <MiaSquadra />}
      {pagina === 'classifica' && <Classifica />}
      {pagina === 'giornata'   && <Giornata />}
      {pagina === 'regolamento'&& <Regolamento />}
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DataProvider>
  );
}
