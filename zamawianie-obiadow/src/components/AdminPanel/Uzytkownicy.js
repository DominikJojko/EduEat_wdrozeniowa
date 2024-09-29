import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Uzytkownicy() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role_id !== 3) {
    return <div>Dostęp ograniczony. Strona dostępna tylko dla administratorów.</div>;
  }

  return (
    <div className="admin-panel-container">
      <h1 style={{ fontSize: '45px' }}>UŻYTKOWNICY</h1>
      <div className="admin-panel-buttons">
        Tutaj zedytujesz wszystkie informacje dotyczące danego użytkownika
        <button onClick={() => navigate('/admin-panel/manage-users')}>Zarządzanie użytkownikami</button>
        ----------------------------------------------------------------
        Tutaj ręcznie dodasz użytkownika do systemu
        <button onClick={() => navigate('/admin-panel/add-user')}>Dodaj i usuń użytkownika</button>
        ----------------------------------------------------------------
        Tutaj dodasz i usuniesz klasy szkoły
        <button onClick={() => navigate('/admin-panel/manage-classes')}>Edycja klas</button>
        ----------------------------------------------------------------
        Tutaj zmienisz status dla każdego użytkownika w systemie
        <button onClick={() => navigate('/admin-panel/end-of-year')}>Zakończenie roku</button>
        ----------------------------------------------------------------
        Tutaj wyświetlisz wszystkich użytkowników i zarządzisz ich obiadami
        <button onClick={() => navigate('/admin-panel/user-meals')}>Zarządzanie obiadami użytkowników</button>
      </div>
    </div>
  );
}

export default Uzytkownicy;
