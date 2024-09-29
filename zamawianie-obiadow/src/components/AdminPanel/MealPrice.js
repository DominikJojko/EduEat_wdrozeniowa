import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MealPrice.css';

function MealPrice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [price, setPrice] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    // Pobieranie aktualnej ceny obiadu z serwera
    const fetchPrice = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/price');
        if (!response.ok) {
          throw new Error('Nie udało się pobrać ceny obiadu');
        }
        const data = await response.json();
        setPrice(data.amount);
      } catch (error) {
        console.error('Błąd:', error.message);
      }
    };

    fetchPrice();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
    setNewPrice(price); // Ustawienie wartości pola edycji na aktualną cenę
  };

  const handleSaveClick = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/price', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: newPrice }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się zaktualizować ceny obiadu');
      }

      setPrice(newPrice);
      setIsEditing(false);
    } catch (error) {
      console.error('Błąd:', error.message);
    }
  };

  if (!user || user.role_id !== 3) {
    return <div>Dostęp ograniczony. Strona dostępna tylko dla administratorów.</div>;
  }

  return (
    <div className="meal-price-container">
      <h1 style={{ fontSize: '45px' }}>Cena Obiadu</h1>
      {isEditing ? (
        <div>
          <input
            type="number"
            step="0.01"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          <button onClick={handleSaveClick}>Zapisz</button>
          <button onClick={() => setIsEditing(false)}>Anuluj</button>
        </div>
      ) : (
        <div>
          <p>Aktualna cena obiadu: {price} PLN</p>
          <button onClick={handleEditClick}>Edytuj cenę</button>
        </div>
      )}
    </div>
  );
}

export default MealPrice;
