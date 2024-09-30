const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

// Middleware do weryfikacji roli admina
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send('Brak tokenu');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send('Nieprawidłowy token');
    }

    // Zakładamy, że rola admina ma ID równą 3
    if (decoded.role_id !== 3) {
      return res.status(403).send('Brak uprawnień administratora');
    }

    next();
  });
};



router.post('/register', (req, res) => {
  const { login, password, imie, nazwisko, klasa, role_id } = req.body;
  User.findByLogin(req.db, login, (err, user) => {
    if (err) return res.status(500).send('Błąd serwera');
    if (user) return res.status(409).send('Użytkownik już istnieje');

    User.create(req.db, login, password, imie, nazwisko, klasa, role_id, (err, result) => {
      if (err) return res.status(500).send('Błąd serwera');
      res.status(201).send('Użytkownik utworzony');
    });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  User.findByLogin(req.db, username, (err, user) => {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });
    if (!user) return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: 'Błąd serwera' });
      if (!isMatch) return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });

      let needClassUpdate = false;
      let message = '';

      switch (user.status_id) {
        case 1: // Nieaktywny
          return res.status(403).json({ error: 'Twoje konto jest nieaktywne, udaj się do księgowości i aktywuj swoje konto!' });
        case 2: // Aktywny
          break; // Kontynuujemy logowanie
        case 3: // Wakacje
          needClassUpdate = true;
          message = 'Rozpoczął się nowy rok szkolny, wybierz nową klasę';
          break;
        case 4: // Zablokowany
          return res.status(403).json({ error: 'Konto zablokowane. Udaj się do księgowości po więcej informacji.' });
        default:
          return res.status(500).json({ error: 'Błąd serwera, nieznany status użytkownika' });
      }

      // Generowanie tokena JWT
      const token = jwt.sign(
        { userId: user.id, username: user.login, role_id: user.role_id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({
        token,
        username: user.login,
        role_id: user.role_id,
        id: user.id,
        needClassUpdate,
        message
      });
    });
  });
});

router.get('/admin/some-action', verifyAdmin, (req, res) => {
  res.send('Akcja dostępna tylko dla admina');
});

router.get('/user/:userId/orders', (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT * FROM order_meals WHERE user_id = ?';
  req.db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).send('Błąd serwera');
    }
    res.json(results);
  });
});

router.get('/user/:userId/balance', (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT balance FROM user_balance WHERE user_id = ?';
  req.db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).send('Błąd serwera');
    }
    res.json(results);
  });
});

router.get('/meal-descriptions', (req, res) => {
  const query = 'SELECT * FROM meal_descriptions';
  req.db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send('Błąd serwera');
    }
    res.json(results);
  });
});

// Endpoint do pobierania ról
router.get('/roles', (req, res) => {
  const query = 'SELECT * FROM role';
  req.db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send('Błąd serwera');
    }
    res.json(results);
  });
});

router.post('/register', (req, res) => {
  const { login, password, imie, nazwisko, klasa, role_id } = req.body;
  const query = 'SELECT * FROM user WHERE login = ? AND imie = ? AND nazwisko = ? AND klasa = ? AND role_id = ?';
  
  req.db.query(query, [login, imie, nazwisko, klasa, role_id], (err, results) => {
    if (err) return res.status(500).send('Błąd serwera');
    if (results.length > 0) return res.status(409).send('Użytkownik o tych samych danych już istnieje');

    User.create(req.db, login, password, imie, nazwisko, klasa, role_id, (err, result) => {
      if (err) return res.status(500).send('Błąd serwera');
      res.status(201).send('Użytkownik utworzony');
    });
  });
});

module.exports = router;
