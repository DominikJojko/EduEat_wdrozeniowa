import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './UpdateClass.css';

function UpdateClass() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Pobierz listę klas
    fetch('http://localhost:5000/api/classes')
      .then(response => response.json())
      .then(data => setClasses(data))
      .catch(error => console.error('Błąd podczas pobierania klas:', error));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClass) {
      setError('Wybierz klasę');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/update-class', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ classId: selectedClass })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas aktualizacji klasy');
      }

      alert('Klasa i status zostały zaktualizowane pomyślnie.');
      navigate('/order');

    } catch (error) {
      setError(error.message || 'Nie udało się zaktualizować klasy');
      console.error(error);
    }
  };

  if (!user) {
    return <div>Nie jesteś zalogowany</div>;
  }

  return (
    <div className="update-class-container">
      <h1>Wybierz nową klasę</h1>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">Wybierz klasę</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
        <button type="submit">Zatwierdź</button>
      </form>
    </div>
  );
}

export default UpdateClass;
