import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './AddUser.css';

function AddUser() {
  const { user: currentUser } = useContext(AuthContext);
  const [userData, setUserData] = useState({
    login: '',
    password: '',
    imie: '',
    nazwisko: '',
    klasa: '',
    role_id: ''
  });

  const [classes, setClasses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/classes')
      .then(response => response.json())
      .then(data => setClasses(data))
      .catch(error => console.error('Error fetching classes:', error));

    fetch('http://localhost:5000/api/roles')
      .then(response => response.json())
      .then(data => setRoles(data))
      .catch(error => console.error('Error fetching roles:', error));

    fetch('http://localhost:5000/api/users')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (password.length < minLength) {
      return 'Hasło musi mieć co najmniej 8 znaków';
    }
    if (!hasUpperCase) {
      return 'Hasło musi zawierać co najmniej jedną dużą literę';
    }
    if (!hasNumber) {
      return 'Hasło musi zawierać co najmniej jedną cyfrę';
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    // Sprawdzanie, czy wszystkie pola są wypełnione
    if (!userData.login) newErrors.login = 'Login jest wymagany';
    if (!userData.password) {
      newErrors.password = 'Hasło jest wymagane';
    } else {
      const passwordError = validatePassword(userData.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }
    if (!userData.imie) newErrors.imie = 'Imię jest wymagane';
    if (!userData.nazwisko) newErrors.nazwisko = 'Nazwisko jest wymagane';
    if (!userData.klasa) newErrors.klasa = 'Klasa jest wymagana';
    if (!userData.role_id) newErrors.role_id = 'Rola jest wymagana';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccess('');
      return;
    }

    fetch('http://localhost:5000/api/check-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ login: userData.login })
    })
    .then(response => response.json())
    .then(data => {
      if (data.exists) {
        setErrors({ login: 'Użytkownik o tym loginie już istnieje' });
      } else {
        fetch('http://localhost:5000/api/add-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          alert(data.message);
          setUserData({
            login: '',
            password: '',
            imie: '',
            nazwisko: '',
            klasa: '',
            role_id: ''
          });
          setErrors({});
          setSuccess('Użytkownik dodany pomyślnie');
          fetch('http://localhost:5000/api/users')
            .then(response => response.json())
            .then(data => setUsers(data))
            .catch(error => console.error('Error fetching users:', error));
        })
        .catch(error => {
          console.error('Error adding user:', error);
        });
      }
    })
    .catch(error => {
      console.error('Error checking user:', error);
    });
  };

  const handleMouseDown = () => {
    setShowPassword(true);
  };

  const handleMouseUp = () => {
    setShowPassword(false);
  };

  const handleDeleteUser = () => {
    fetch(`http://localhost:5000/api/delete-user/${selectedUser}`, {
      method: 'DELETE',
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Nie udało się usunąć użytkownika');
      }
      return response.json();
    })
    .then(data => {
      alert(data.message);
      setUsers(users.filter(user => user.id !== selectedUser));
      setSelectedUser('');
    })
    .catch(error => {
      console.error('Error deleting user:', error);
    });
  };

  return (
    <div className="add-user-container">
      <h1>Dodaj użytkownika</h1>
      {errors.general && <p className="error">{errors.general}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit} className="add-user-form">
        <div>
          <input
            type="text"
            name="login"
            value={userData.login}
            onChange={handleChange}
            placeholder="Login"
            required
          />
          {errors.login && <p className="error">{errors.login}</p>}
        </div>
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={userData.password}
            onChange={handleChange}
            placeholder="Hasło"
            required
          />
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            👁️
          </button>
          {errors.password && <p className="error">{errors.password}</p>}
        </div>
        <div>
          <input
            type="text"
            name="imie"
            value={userData.imie}
            onChange={handleChange}
            placeholder="Imię"
            required
          />
          {errors.imie && <p className="error">{errors.imie}</p>}
        </div>
        <div>
          <input
            type="text"
            name="nazwisko"
            value={userData.nazwisko}
            onChange={handleChange}
            placeholder="Nazwisko"
            required
          />
          {errors.nazwisko && <p className="error">{errors.nazwisko}</p>}
        </div>
        <div>
          <select name="klasa" value={userData.klasa} onChange={handleChange} required>
            <option value="">Wybierz klasę</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
          {errors.klasa && <p className="error">{errors.klasa}</p>}
        </div>
        <div>
          <select name="role_id" value={userData.role_id} onChange={handleChange} required>
            <option value="">Wybierz rolę</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          {errors.role_id && <p className="error">{errors.role_id}</p>}
        </div>
        <button type="submit">Dodaj użytkownika</button>
      </form>

      <h2>Usuń użytkownika</h2>
      <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
        <option value="">Wybierz użytkownika</option>
        {users.map(user => (
          user.id !== currentUser.id && <option key={user.id} value={user.id}>{`${user.nazwisko} ${user.imie}`}</option>
        ))}
      </select>
      <button onClick={handleDeleteUser}>Usuń użytkownika</button>
    </div>
  );
}

export default AddUser;
