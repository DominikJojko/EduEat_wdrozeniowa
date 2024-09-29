import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Obiady() {
    const { user } = useAuth();
    const navigate = useNavigate();
  
    if (!user || user.role_id !== 3) {
      return <div>Dostęp ograniczony. Strona dostępna tylko dla administratorów.</div>;
    }
  
    return (
      <div className="admin-panel-container">
        <h1 style={{ fontSize: '45px' }}>OBIADY</h1>
        <div className="admin-panel-buttons">
          Tutaj ustalisz cenę obiadu
          <button onClick={() => navigate('/admin-panel/meal-price')}>Cena obiadu</button>
          ----------------------------------------------------------------
          Tutaj wygenerujesz listę zamówionych obiadów na wybrany zakres czasowy
          <button onClick={() => navigate('/admin-panel/list-orders')}>Generowanie listy zamówionych obiadów</button>
          ----------------------------------------------------------------
          Tutaj zmienisz kalendarz obiadów, czyli wybierzesz dni wolne w które obiady nie będa potrzebne
          <button onClick={() => navigate('/admin-panel/make-meals')}>Zarządzaj kalendarzem obiadów</button>
        </div>
      </div>
    );
  }
  
  export default Obiady;