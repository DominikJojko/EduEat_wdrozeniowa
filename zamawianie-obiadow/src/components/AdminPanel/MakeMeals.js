import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './MakeMeals.css';

function MakeMeals() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [meals, setMeals] = useState([]);
  const [displayedMeals, setDisplayedMeals] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMeals();
  }, []);

  useEffect(() => {
    filterMealsByMonth();
  }, [meals, currentMonth, currentYear]);

  const fetchMeals = () => {
    fetch('http://localhost:5000/api/meals')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sortedMeals = data.map(meal => new Date(meal.date)).sort((a, b) => a - b);
          setMeals(sortedMeals);
        } else {
          setMeals([]);
        }
      })
      .catch(error => console.error('Error fetching meals:', error));
  };

  const filterMealsByMonth = () => {
    const filtered = meals.filter(meal => 
      meal.getMonth() === currentMonth && meal.getFullYear() === currentYear
    );
    setDisplayedMeals(filtered);
  };

  const handleCreateMeals = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const existingMeal = meals.some(meal => start <= meal && meal <= end);
    if (existingMeal) {
      setError('Obiady w podanym zakresie dat już istnieją.');
      return;
    }

    fetch('http://localhost:5000/api/create-meals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ startDate, endDate })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          fetchMeals();
          setStartDate('');
          setEndDate('');
          setError('');
        } else {
          setError(data.message);
        }
      })
      .catch(error => console.error('Error creating meals:', error));
  };

  const handleDeleteMeal = (date) => {
    const formattedDate = date.toLocaleDateString('en-CA');
    console.log(`Deleting meal for date: ${formattedDate}`);

    fetch('http://localhost:5000/api/delete-meal', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date: formattedDate })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          fetchMeals();
        } else {
          console.error('Error deleting meal:', data.message);
          setError(data.message);
        }
      })
      .catch(error => console.error('Error deleting meal:', error));
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="make-meals-container">
      <h1>Zarządzaj obiadami</h1>
      {error && <p className="error">{error}</p>}
      <div className="create-meals">
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
        <button onClick={handleCreateMeals}>Utwórz obiady</button>
      </div>
      <div className="meals-calendar">
        <h2>Przyszłe obiady</h2>
        <Calendar
          onClickDay={(date) => {
            if (meals.some(mealDate => mealDate.toDateString() === date.toDateString())) {
              if (window.confirm(`Czy na pewno chcesz usunąć obiad na ${date.toDateString()}?`)) {
                handleDeleteMeal(date);
              }
            }
          }}
          tileClassName={({ date, view }) => {
            if (view === 'month' && meals.some(mealDate => mealDate.toDateString() === date.toDateString())) {
              return 'meal-date';
            }
          }}
        />
      </div>
      <p></p>
      <h2>Lista obiadów</h2>
      <div className="pagination">
        <button onClick={handlePreviousMonth}>Poprzedni miesiąc</button>
        <span>{new Date(currentYear, currentMonth).toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}</span>
        <button onClick={handleNextMonth}>Następny miesiąc</button>
      </div>
      <table className="meals-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Usuń</th>
          </tr>
        </thead>
        <tbody>
          {displayedMeals.map((meal, index) => (
            <tr key={index}>
              <td>{meal.toLocaleDateString('pl-PL')}</td>
              <td>
                <button onClick={() => handleDeleteMeal(meal)}>Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MakeMeals;
