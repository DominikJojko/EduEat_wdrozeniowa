import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role_id !== 3) {
    return <div>Dostęp ograniczony. Strona dostępna tylko dla administratorów.</div>;
  }

  return (
    <div className="admin-panel-container">
      <h1 style={{ fontSize: '45px' }}>PANEL ADMINISTRACYJNY</h1>
      <div className="admin-panel-buttons">
              <button onClick={() => navigate('/admin-panel/obiady')}>OBIADY</button>
              <button onClick={() => navigate('/admin-panel/uzytkownicy')}>UŻYTKOWNICY</button>
      </div>
    </div>
  );
}

export default AdminPanel;
