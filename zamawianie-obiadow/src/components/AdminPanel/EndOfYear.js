import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EndOfYear.css'

function EndOfYear() {
  const [status, setStatus] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Pobieranie statusów z API
    const fetchStatuses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/statuses');
        const data = await response.json();
        setStatuses(data);
      } catch (error) {
        console.error('Błąd podczas pobierania statusów:', error);
      }
    };

    fetchStatuses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!status) {
      setError('Wybierz status.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/end-of-year', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd przy aktualizacji statusów');
      }

      alert('Statusy zostały zaktualizowane.');
      navigate('/admin-panel/uzytkownicy');
    } catch (error) {
      setError(error.message || 'Błąd przy aktualizacji statusów.');
    }
  };

  return (
    <div className="end-of-year-page">
      <h1>Zakończenie roku</h1>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        <label htmlFor="status">Wybierz nowy status dla wszystkich użytkowników systemu:</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">-- Wybierz status --</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <br />
        <button type="submit">Zastosuj</button>
      </form>
    </div>
  );
}

export default EndOfYear;
