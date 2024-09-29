import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import './OrderForm.css';

function OrderForm() {
  const { user, role_id } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mealDescriptions, setMealDescriptions] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    console.log("Zalogowany użytkownik:", user);
  }, [user]);

  useEffect(() => {
    const fetchMealDescriptions = async () => {
      try {
        const response = await fetch('http://localhost:5000/meal-descriptions');
        if (!response.ok) {
          throw new Error('Nie udało się pobrać opisów obiadów');
        }
        const meals = await response.json();
        const today = new Date();
        const now = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 14); // obiady na 14 dni do przodu

        const filteredMeals = meals.filter(meal => {
          const mealDate = new Date(meal.date);

          // Ustawienie godziny 8:30 rano na dzień posiłku
          mealDate.setHours(8, 30, 0, 0);

          // Sprawdzenie, czy data posiłku jest dzisiejsza i obecny czas jest przed 8:30
          return mealDate >= now && mealDate <= maxDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sortowanie rosnące po dacie

        setMealDescriptions(filteredMeals);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchMealDescriptions();
  }, []);

  const fetchUserOrders = async () => {
    if (!user) return;

    try {
      const response = await fetch(`http://localhost:5000/api/user-orders/${user.id}`);
      if (!response.ok) {
        throw new Error('Nie udało się pobrać zamówień użytkownika');
      }
      const orders = await response.json();
      setUserOrders(orders);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, [user]);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pl-PL', options);
  };

  const handleOrderSubmit = async (meal) => {
    const now = new Date();
    const mealDate = new Date(meal.date);

    // Ustawienie godziny 8:30 rano na dzień zamówienia
    const cutoffTime = new Date(mealDate);
    cutoffTime.setHours(8, 30, 0, 0);  // Ustawienie godziny 8:30 rano

    // Sprawdzenie, czy obecny czas jest przed 8:30 rano danego dnia
    if (now > cutoffTime) {
      alert(`Możliwość zamówienia obiadu na dzień ${formatDate(meal.date)} już minęła.`);
      return;
    }

    const orderDateLocal = mealDate.toISOString().split('T')[0]; // Pobranie daty w formacie YYYY-MM-DD

    // Sprawdzanie, czy zamówienie już istnieje
    if (userOrders.some(order => order.date === orderDateLocal)) {
      alert(`Zamówienie na dzień ${formatDate(orderDateLocal)} już istnieje.`);
      return;
    }

    console.log("Próba wysyłania zamówienia dla dania o ID:", meal.id, "dla użytkownika o ID:", user.id, "na dzień:", orderDateLocal);
    try {
      const response = await fetch('http://localhost:5000/api/add-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: user.id, mealId: meal.id })
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        alert(`Zamówiłeś obiad na dzień ${new Date(meal.date).toLocaleDateString()}`);
        fetchUserOrders(); // Pobranie zamówień użytkownika po dodaniu nowego zamówienia
      } else if (response.status === 409) {
        const data = await response.json();
        console.log('Conflict error message:', data.error);
        alert(data.error);
      } else {
        throw new Error('Błąd podczas wysyłania zamówienia');
      }
    } catch (error) {
      alert("Błąd podczas wysyłania zamówienia: " + error.message);
      console.error("Błąd podczas wysyłania zamówienia:", error);
    }
  };

  const handleDateRangeOrderSubmit = async () => {
    if (!startDate || !endDate) {
      setError('Wybierz zarówno datę początkową, jak i końcową.');
      return;
    }
  
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    if (start > end) {
      setError('Data początkowa nie może być późniejsza niż data końcowa.');
      return;
    }
  
    const confirmation = window.confirm(`Czy na pewno chcesz zamówić obiady w przedziale od ${formatDate(startDate)} do ${formatDate(endDate)}?`);
    if (!confirmation) return;
  
    try {
      // Pobranie opisów obiadów dla wybranego przedziału
      console.log(`Fetching meals between ${startDate} and ${endDate}`);
      const response = await fetch(`http://localhost:5000/meal-descriptions?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Nie udało się pobrać opisów obiadów dla wybranego przedziału');
      }
      const mealsInRange = await response.json();
      
      // Mapowanie posiłków po dacie dla szybkiego dostępu
      const mealsMap = new Map();
      mealsInRange.forEach(meal => {
        mealsMap.set(meal.date, meal); // meal.date jest teraz 'YYYY-MM-DD'
      });
  
      // Aktualizacja zamówień użytkownika
      await fetchUserOrders();
  
      const daysArray = [];
      for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        if (day.getDay() !== 0 && day.getDay() !== 6) { // pomijanie sobót i niedziel
          const dateStr = day.toISOString().split('T')[0];
          daysArray.push(dateStr);
        }
      }
  
      for (let date of daysArray) {
        const meal = mealsMap.get(date);
        if (!meal) {
          console.log(`Brak obiadu na dzień ${formatDate(date)}.`);
          continue;
        }
        if (userOrders.some(order => order.date === date)) {
          console.log(`Zamówienie na dzień ${formatDate(date)} już istnieje.`);
          continue;
        }
  
        try {
          const response = await fetch('http://localhost:5000/api/add-order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: user.id, mealId: meal.id }) // Usunięcie orderDate
          });
  
          if (response.ok) {
            console.log(`Zamówienie na dzień ${formatDate(date)} zostało złożone.`);
            // Opcjonalnie, możesz dodać zamówienie do stanu userOrders bez ponownego pobierania wszystkich zamówień
          } else if (response.status === 409) {
            const data = await response.json();
            console.log('Conflict error message:', data.error);
            alert(`Zamówienie na dzień ${formatDate(date)} już istnieje.`);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Błąd podczas wysyłania zamówienia');
          }
        } catch (error) {
          console.error(`Błąd przy zamawianiu obiadu na dzień ${formatDate(date)}:`, error);
          alert(`Błąd przy zamawianiu obiadu na dzień ${formatDate(date)}: ${error.message}`);
        }
      }
      alert(`Zamówiłeś obiady w przedziale od ${formatDate(startDate)} do ${formatDate(endDate)}.`);
      fetchUserOrders(); // Pobranie zamówień użytkownika po dodaniu nowych zamówień
    } catch (error) {
      alert("Błąd podczas wysyłania zamówienia: " + error.message);
      console.error("Błąd podczas wysyłania zamówienia:", error);
    }
  };
  

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role_id === 3) {
    return <Navigate to="/" />;
  }

  return (
    <div className="order-form-container">
      <h1>Zamówienie Obiadu</h1>

      {/* Zamówienia długoterminowe */}
      <div className="long-term-order">
        <h2>Zamówienia długoterminowe</h2>
        <div className="date-range-order">
          <label>
            Wybierz datę początkową:
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            Wybierz datę końcową:
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <button onClick={handleDateRangeOrderSubmit}>Zamów obiady w wybranym przedziale</button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '15px', marginBottom: '20px' }}>
        <a href="https://drive.google.com/drive/folders/1R8WudsYKQGNi601iG7Ig_mNXDspAENQ_?usp=sharing" target="_blank" rel="noopener noreferrer">
          <button style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer' }}>Menu</button>
        </a>
      </div>

      <table className="meals-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Zamów</th>
          </tr>
        </thead>
        <tbody>
          {mealDescriptions.map((meal) => {
            const mealDateStr = meal.date; // 'YYYY-MM-DD'
            const isOrdered = userOrders.some(order => order.date === mealDateStr);

            return (
              <tr key={meal.id}>
                <td>{formatDate(meal.date)}</td>
                <td>
                  {isOrdered ? (
                    <button className="already-ordered-button" disabled>Już zamówiony</button>
                  ) : (
                    <button onClick={() => handleOrderSubmit(meal)}>Zamów ten obiad</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default OrderForm;
