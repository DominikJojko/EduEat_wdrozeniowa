import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ManageUsers.css';

function ManageUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filters, setFilters] = useState({
    classId: '',
    roleId: '',
    statusId: ''
  });

  // Dodajemy stan form do przechowywania danych formularza użytkownika
  const [form, setForm] = useState({
    imie: '',
    nazwisko: '',
    klasa: '',
    login: '',
    password: '',
    role_id: '',
    status_id: '',
    balance: '',
    note: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchClasses();
    fetchRoles();
    fetchStatuses();
  }, [search, filters]);

  const fetchUsers = async () => {
    const query = new URLSearchParams({
      search,
      classId: filters.classId,
      roleId: filters.roleId,
      statusId: filters.statusId
    }).toString();

    try {
      const response = await fetch(`http://localhost:5000/api/users-manage?${query}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Błąd podczas pobierania użytkowników:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/classes');
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Błąd podczas pobierania klas:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Błąd podczas pobierania ról:', error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/statuses');
      const data = await response.json();
      console.log('Statuses:', data); // Dodaj to, aby sprawdzić, jakie dane są zwracane
      setStatuses(data);
    } catch (error) {
      console.error('Błąd podczas pobierania statusów:', error);
    }
  };
  

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setForm({
      imie: user.imie,
      nazwisko: user.nazwisko,
      klasa: user.class_id,
      login: user.login,
      password: '', // Pozostaw puste, aby użytkownik mógł zdecydować, czy chce zmienić hasło
      role_id: user.role_id,
      status_id: user.status_id,
      balance: user.balance,
      note: user.note
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value
    }));
  };

  const getStatusName = (statusId) => {
    switch (statusId) {
      case 1:
        return 'Nieaktywny';
      case 2:
        return 'Aktywny';
      case 3:
        return 'Wakacje';
      case 4:
        return 'Zablokowany';
      default:
        return 'Nieznany';
    }
  };  

  const handleSave = async () => {
    try {
      await fetch(`http://localhost:5000/api/users-manage/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });
      alert('Dane użytkownika zaktualizowane pomyślnie.');
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Błąd podczas zapisywania danych użytkownika:', error);
    }
  };

  if (!user || user.role_id !== 3) {
    return <div>Dostęp ograniczony. Strona dostępna tylko dla administratorów.</div>;
  }

  return (
    <div className="manage-users-container">
      <h1>Zarządzanie użytkownikami</h1>
      <input
        type="text"
        placeholder="Wyszukaj użytkownika..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="filters">
        <select name="classId" value={filters.classId} onChange={handleFilterChange}>
          <option value="">Wybierz klasę</option>
          {classes.map((klasa) => (
            <option key={klasa.id} value={klasa.id}>
              {klasa.name}
            </option>
          ))}
        </select>
        <select name="roleId" value={filters.roleId} onChange={handleFilterChange}>
          <option value="">Wybierz rolę</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <select name="statusId" value={filters.statusId} onChange={handleFilterChange}>
          <option value="">Wybierz status</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </div>
      <ul className="users-list">
        {users.map((u) => (
          <li key={u.id} onClick={() => handleUserSelect(u)}>
            {u.imie} {u.nazwisko} ({u.login}) - Status: {getStatusName(u.status_id)}
          </li>
        ))}
      </ul>

      {selectedUser && (
        <div className="user-edit-form">
          <h2>Edytuj użytkownika</h2>

          {/* Formularz edycji użytkownika */}
          <div className="form-group">
            <label htmlFor="imie">Imię:</label>
            <input
              type="text"
              name="imie"
              id="imie"
              value={form.imie}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="nazwisko">Nazwisko:</label>
            <input
              type="text"
              name="nazwisko"
              id="nazwisko"
              value={form.nazwisko}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="klasa">Klasa:</label>
            <select
              name="klasa"
              id="klasa"
              value={form.klasa}
              onChange={handleFormChange}
            >
              <option value="">Wybierz klasę</option>
              {classes.map((klasa) => (
                <option key={klasa.id} value={klasa.id}>
                  {klasa.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="login">Login:</label>
            <input
              type="text"
              name="login"
              id="login"
              value={form.login}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Nowe hasło: POZOSTAW PUSTE JEŚLI NIE CHCESZ ZMIENIAĆ!!!</label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Pozostaw puste, jeśli nie chcesz zmieniać"
              value={form.password}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role_id">Rola:</label>
            <select
              name="role_id"
              id="role_id"
              value={form.role_id}
              onChange={handleFormChange}
            >
              <option value="1">Użytkownik</option>
              <option value="2">Moderator/Księgowa</option>
              <option value="3">Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status_id">Status:</label>
            <select
              name="status_id"
              id="status_id"
              value={form.status_id}
              onChange={handleFormChange}
            >
              <option value="1">Nieaktywny</option>
              <option value="2">Aktywny</option>
              <option value="3">Wakacje</option>
              <option value="4">Zablokowany</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="balance">Saldo:</label>
            <input
              type="number"
              name="balance"
              id="balance"
              value={form.balance}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="note">Opis salda:</label>
            <textarea
              name="note"
              id="note"
              value={form.note}
              onChange={handleFormChange}
            ></textarea>
          </div>

          <button onClick={handleSave}>Zapisz</button>
          <button onClick={() => setSelectedUser(null)}>Anuluj</button>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
