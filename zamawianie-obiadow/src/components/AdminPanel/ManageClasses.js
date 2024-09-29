import React, { useState, useEffect } from 'react';
import './ManageClasses.css';

function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [message, setMessage] = useState('');

  // Nowe stany dla usuwania obiadów
  const [selectedClassForDeletion, setSelectedClassForDeletion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deletionMessage, setDeletionMessage] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = () => {
    fetch('http://localhost:5000/api/classes')
      .then(response => response.json())
      .then(data => {
        // Sortowanie klas alfabetycznie po nazwie
        const sortedClasses = data.sort((a, b) => a.name.localeCompare(b.name));
        setClasses(sortedClasses);
      })
      .catch(error => console.error('Error fetching classes:', error));
  };

  const handleAddClass = () => {
    if (classes.some(cls => cls.name === newClassName.trim())) {
      setMessage('Klasa o tej nazwie już istnieje');
      return;
    }

    fetch('http://localhost:5000/api/classes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newClassName.trim() })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          fetchClasses();
          setNewClassName('');
          setMessage('Klasa dodana pomyślnie');
        } else {
          console.error('Error adding class:', data.message);
          setMessage('Błąd przy dodawaniu klasy');
        }
      })
      .catch(error => {
        console.error('Error adding class:', error);
        setMessage('Błąd przy dodawaniu klasy');
      });
  };

  const handleDeleteClass = (classId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę klasę?')) {
      return;
    }

    fetch(`http://localhost:5000/api/classes/${classId}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          fetchClasses();
          setMessage('Klasa usunięta pomyślnie');
        } else {
          console.error('Error deleting class:', data.message);
          setMessage('Błąd przy usuwaniu klasy');
        }
      })
      .catch(error => {
        console.error('Error deleting class:', error);
        setMessage('Błąd przy usuwaniu klasy');
      });
  };

  // Funkcja do usuwania obiadów dla klasy w przedziale dat
  const handleDeleteMeals = () => {
    if (!selectedClassForDeletion) {
      setDeletionMessage('Wybierz klasę');
      return;
    }
    if (!startDate || !endDate) {
      setDeletionMessage('Wybierz przedział dat');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setDeletionMessage('Data początkowa nie może być późniejsza niż końcowa');
      return;
    }

    // Potwierdzenie akcji
    if (!window.confirm('Czy na pewno chcesz usunąć obiady dla wybranej klasy w podanym przedziale dat?')) {
      return;
    }

    // Przygotowanie danych do wysłania
    const data = {
      classId: selectedClassForDeletion,
      startDate: startDate,
      endDate: endDate,
    };

    fetch('http://localhost:5000/api/delete-meals-for-class', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setDeletionMessage('Obiady zostały usunięte pomyślnie');
          // Resetowanie pól
          setSelectedClassForDeletion('');
          setStartDate('');
          setEndDate('');
        } else {
          console.error('Error deleting meals:', data.message);
          setDeletionMessage('Błąd przy usuwaniu obiadów');
        }
      })
      .catch(error => {
        console.error('Error deleting meals:', error);
        setDeletionMessage('Błąd przy usuwaniu obiadów');
      });
  };

  return (
    <div className="manage-classes-container">
      <h1>Zarządzaj klasami</h1>
      {message && <p className="message">{message}</p>}
      <div className="add-class">
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="Nazwa klasy"
        />
        <button onClick={handleAddClass}>Dodaj klasę</button>
      </div>
      <div className="class-list">
        <ul>
          {classes.map(cls => (
            <li key={cls.id}>
              <span>{cls.name}</span>
              <button onClick={() => handleDeleteClass(cls.id)}>Usuń</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Nowa sekcja do usuwania obiadów */}
      <div className="delete-meals-section">
        <h2>Usuń obiady dla klasy</h2>
        {deletionMessage && <p className="message">{deletionMessage}</p>}
        <div className="delete-meals-form">
          <select
            value={selectedClassForDeletion}
            onChange={(e) => setSelectedClassForDeletion(e.target.value)}
          >
            <option value="">Wybierz klasę</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Data początkowa"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Data końcowa"
          />
          <button onClick={handleDeleteMeals}>Usuń obiady</button>
        </div>
      </div>
    </div>
  );
}

export default ManageClasses;
