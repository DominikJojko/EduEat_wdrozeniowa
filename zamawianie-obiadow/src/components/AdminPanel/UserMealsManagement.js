import React, { useState, useEffect } from 'react';
import './UserMealsManagement.css';

function UserMealsManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  // Pobieranie listy użytkowników
  useEffect(() => {
    fetch('http://localhost:5000/api/all-users')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Błąd podczas pobierania użytkowników:', error));
  }, []);

  // Funkcja do obsługi wyszukiwania
  const handleSearch = () => {
    fetch(`http://localhost:5000/api/search-users?term=${searchTerm}`)
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Błąd podczas wyszukiwania użytkowników:', error));
  };

  // Funkcja do pobierania zamówień wybranego użytkownika
  const fetchUserOrders = (userId) => {
    fetch(`http://localhost:5000/api/user-orders/${userId}`)
      .then(response => response.json())
      .then(data => {
        setUserOrders(data);
        setSelectedUser(users.find(user => user.id === userId));
      })
      .catch(error => console.error('Błąd podczas pobierania zamówień użytkownika:', error));
  };

  // Funkcja do anulowania zamówienia użytkownika
  const handleCancelOrder = (orderId) => {
    fetch(`http://localhost:5000/api/admin/cancel-user-order/${orderId}`, { method: 'DELETE' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Błąd podczas anulowania zamówienia');
        }
        // Aktualizuj listę zamówień po anulowaniu
        setUserOrders(userOrders.filter(order => order.id !== orderId));
        alert('Zamówienie zostało anulowane');
      })
      .catch(error => alert(error.message));
  };

  return (
    <div className="user-meals-management-container">
      <h1>Zarządzanie obiadami użytkowników</h1>
      <div className="search-section">
        <input
          type="text"
          placeholder="Wpisz imię, nazwisko lub login"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>Szukaj</button>
      </div>
      <div className="users-list">
        <h2>Lista użytkowników</h2>
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.imie} {user.nazwisko} ({user.login})
              <button onClick={() => fetchUserOrders(user.id)}>Zarządzaj obiadami</button>
            </li>
          ))}
        </ul>
      </div>
      {selectedUser && (
        <div className="user-orders">
          <h2>Zamówienia użytkownika: {selectedUser.imie} {selectedUser.nazwisko}</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {userOrders.map(order => (
                <tr key={order.id}>
                  <td>{new Date(order.date).toLocaleDateString('pl-PL')}</td>
                  <td>
                    <button onClick={() => handleCancelOrder(order.id)}>Anuluj zamówienie</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserMealsManagement;
