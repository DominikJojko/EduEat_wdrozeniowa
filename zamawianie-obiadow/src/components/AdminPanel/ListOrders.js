import React, { useState, useEffect } from 'react';
import './ListOrders.css';  // Dodajemy plik CSS

function ListOrders() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [orders, setOrders] = useState([]);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ class: '', user: '' });

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchOrders = () => {
    const queryParams = new URLSearchParams({
      start: dateRange.start,
      end: dateRange.end,
      class: filters.class,
      user: filters.user,
      page: 1,
      limit: 1000000 // lub inna duża liczba, aby pobrać wszystkie zamówienia
    }).toString();

    fetch(`http://localhost:5000/api/orders?${queryParams}`)
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data.orders)) {
          const sortedData = data.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
          setOrders(sortedData);
        } else {
          console.error('Expected data to be an array:', data);
        }
      })
      .catch(error => console.error('Error fetching orders:', error));
  };

  const generateReport = () => {
    fetch('http://localhost:5000/api/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start: dateRange.start,
        end: dateRange.end,
        format: 'XLSX'
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Nie udało się wygenerować raportu');
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${dateRange.start}_${dateRange.end}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(error => console.error('Error generating report:', error));
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/classes')
      .then(response => response.json())
      .then(data => setClasses(data))
      .catch(error => console.error('Error fetching classes:', error));

    fetch('http://localhost:5000/api/users')
      .then(response => response.json())
      .then(data => {
        const sortedUsers = data.sort((a, b) => a.nazwisko.localeCompare(b.nazwisko));
        setUsers(sortedUsers);
      })
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  return (
    <div className="container">
      <h1>Generowanie listy zamówionych obiadów</h1>
      <div className="input-container">
        <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} />
        <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} />

        <select name="class" value={filters.class} onChange={handleFilterChange}>
          <option value="">Wybierz klasę</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>

        <select name="user" value={filters.user} onChange={handleFilterChange}>
          <option value="">Wybierz użytkownika</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{`${user.nazwisko} ${user.imie}`}</option>
          ))}
        </select>
      </div>
      
      <div className="button-container">
        <button className="small-button" onClick={generateReport}>Generuj Raport</button>
        <button className="small-button" onClick={fetchOrders}>Pokaż zamówienia</button>
      </div>

      {orders.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Nazwisko</th>
              <th>Imię</th>
              <th>Klasa</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{new Date(order.date).toLocaleDateString()}</td>
                <td>{order.nazwisko}</td>
                <td>{order.imie}</td>
                <td>{order.klasa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ListOrders;
