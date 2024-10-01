require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const excel = require('exceljs');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/all-users', (req, res) => {
  const query = 'SELECT id, login, imie, nazwisko FROM user';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Błąd podczas pobierania użytkowników:', err);
      return res.status(500).json({ error: 'Błąd serwera przy pobieraniu użytkowników' });
    }
    res.json(results);
  });
});

app.get('/api/search-users', (req, res) => {
  const term = `%${req.query.term}%`;
  const query = `
    SELECT id, login, imie, nazwisko 
    FROM user 
    WHERE login LIKE ? OR imie LIKE ? OR nazwisko LIKE ?
  `;
  db.query(query, [term, term, term], (err, results) => {
    if (err) {
      console.error('Błąd podczas wyszukiwania użytkowników:', err);
      return res.status(500).json({ error: 'Błąd serwera przy wyszukiwaniu użytkowników' });
    }
    res.json(results);
  });
});

app.get('/api/admin/user-orders/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT om.id, md.date 
    FROM order_meals om 
    JOIN meal_descriptions md ON om.meal_id = md.id 
    WHERE om.user_id = ? 
    ORDER BY md.date
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Błąd podczas pobierania zamówień użytkownika:', err);
      return res.status(500).json({ error: 'Błąd serwera przy pobieraniu zamówień' });
    }
    res.json(results);
  });
});

app.delete('/api/admin/cancel-user-order/:orderId', (req, res) => {
  const orderId = req.params.orderId;

  // Pobierz cenę obiadu
  const priceQuery = 'SELECT amount FROM price WHERE id = 1';
  db.query(priceQuery, (err, priceResult) => {
    if (err) {
      console.error('Błąd podczas pobierania ceny obiadu:', err);
      return res.status(500).json({ error: 'Błąd serwera przy pobieraniu ceny obiadu' });
    }

    const mealPrice = priceResult[0].amount;

    // Pobierz user_id z orderId
    const userQuery = 'SELECT user_id FROM order_meals WHERE id = ?';
    db.query(userQuery, [orderId], (err, userResult) => {
      if (err) {
        console.error('Błąd podczas pobierania użytkownika zamówienia:', err);
        return res.status(500).json({ error: 'Błąd serwera przy pobieraniu użytkownika zamówienia' });
      }

      if (userResult.length === 0) {
        return res.status(404).json({ error: 'Zamówienie nie istnieje' });
      }

      const userId = userResult[0].user_id;

      // Rozpoczęcie transakcji
      db.beginTransaction((err) => {
        if (err) {
          console.error('Błąd podczas rozpoczynania transakcji:', err);
          return res.status(500).json({ error: 'Błąd serwera przy rozpoczynaniu transakcji' });
        }

        // Usuń zamówienie
        const deleteOrderQuery = 'DELETE FROM order_meals WHERE id = ?';
        db.query(deleteOrderQuery, [orderId], (err, result) => {
          if (err) {
            console.error('Błąd podczas usuwania zamówienia:', err);
            return db.rollback(() => {
              res.status(500).json({ error: 'Błąd serwera przy usuwaniu zamówienia' });
            });
          }

          // Zaktualizuj saldo użytkownika
          const updateBalanceQuery = 'UPDATE user_balance SET balance = balance + ? WHERE user_id = ?';
          db.query(updateBalanceQuery, [mealPrice, userId], (err, result) => {
            if (err) {
              console.error('Błąd podczas aktualizacji salda użytkownika:', err);
              return db.rollback(() => {
                res.status(500).json({ error: 'Błąd serwera przy aktualizacji salda użytkownika' });
              });
            }

            // Zatwierdź transakcję
            db.commit((err) => {
              if (err) {
                console.error('Błąd podczas zatwierdzania transakcji:', err);
                return db.rollback(() => {
                  res.status(500).json({ error: 'Błąd serwera przy zatwierdzaniu transakcji' });
                });
              }

              res.json({ message: 'Zamówienie zostało anulowane, saldo użytkownika zaktualizowane' });
            });
          });
        });
      });
    });
  });
});

db.connect(err => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err);
    throw err;
  }
  console.log('Połączono z bazą danych MySQL');
});



const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes);

app.post('/api/add-user', (req, res) => {
  console.log('Received add-user request:', req.body);
  const { login, password, imie, nazwisko, klasa, role_id } = req.body;
  const saltRounds = 10;

  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Błąd hashowania hasła:', err);
      return res.status(500).json({ error: 'Błąd serwera przy hashowaniu hasła' });
    }

    const query = `INSERT INTO user (login, password, imie, nazwisko, role_id, class_id) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(query, [login, hashedPassword, imie, nazwisko, role_id, klasa], (err, result) => {
      if (err) {
        console.error('Błąd dodawania użytkownika:', err);
        return res.status(500).json({ error: 'Błąd serwera przy dodawaniu użytkownika' });
      }

      const userId = result.insertId;  // Pobranie ID nowo dodanego użytkownika

      // Dodanie salda dla nowego użytkownika
      const balanceQuery = `INSERT INTO user_balance (user_id, balance) VALUES (?, 0.00)`;
      db.query(balanceQuery, [userId], (err, balanceResult) => {
        if (err) {
          console.error('Błąd dodawania salda użytkownika:', err);
          return res.status(500).json({ error: 'Błąd serwera przy dodawaniu salda użytkownika' });
        }
        res.status(201).json({ message: 'Użytkownik dodany pomyślnie wraz z saldem' });
      });
    });
  });
});


app.post('/api/check-user', (req, res) => {
  const { login } = req.body;

  const query = 'SELECT * FROM user WHERE login = ?';
  db.query(query, [login], (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (results.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  });
});

app.delete('/api/delete-user/:id', (req, res) => {
  const userId = req.params.id;

  const query = 'DELETE FROM user WHERE id = ?';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Błąd podczas usuwania użytkownika:', err);
      return res.status(500).json({ error: 'Błąd serwera przy usuwaniu użytkownika' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    res.status(200).json({ message: 'Użytkownik usunięty pomyślnie' });
  });
});

app.post('/api/register-user', (req, res) => {
  console.log('Received register-user request:', req.body);
  const { login, password, imie, nazwisko, klasa } = req.body;
  const saltRounds = 10;

  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Błąd hashowania hasła:', err);
      return res.status(500).json({ error: 'Błąd serwera przy hashowaniu hasła' });
    }

    const query = `INSERT INTO user (login, password, imie, nazwisko, role_id, class_id, status_id) VALUES (?, ?, ?, ?, 1, ?, 1)`;
    db.query(query, [login, hashedPassword, imie, nazwisko, klasa], (err, result) => {
      if (err) {
        console.error('Błąd dodawania użytkownika:', err);
        return res.status(500).json({ error: 'Błąd serwera przy dodawaniu użytkownika' });
      }

      const userId = result.insertId;  // Pobranie ID nowo dodanego użytkownika

      // Dodanie salda dla nowego użytkownika
      const balanceQuery = `INSERT INTO user_balance (user_id, balance) VALUES (?, 0.00)`;
      db.query(balanceQuery, [userId], (err, balanceResult) => {
        if (err) {
          console.error('Błąd dodawania salda użytkownika:', err);
          return res.status(500).json({ error: 'Błąd serwera przy dodawaniu salda użytkownika' });
        }
        res.status(201).json({ message: 'Rejestracja zakończona pomyślnie, udaj się do księgowości w celu aktywowania konta.' });
      });
    });
  });
});

app.put('/api/update-class', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { classId } = req.body;

  if (!classId) {
    return res.status(400).json({ error: 'Brak wybranej klasy' });
  }

  const query = `
    UPDATE user SET class_id = ?, status_id = 2
    WHERE id = ?
  `;

  db.query(query, [classId, userId], (err, result) => {
    if (err) {
      console.error('Błąd podczas aktualizacji klasy:', err);
      return res.status(500).json({ error: 'Błąd serwera przy aktualizacji klasy' });
    }

    res.json({ message: 'Klasa i status zaktualizowane pomyślnie' });
  });
});

app.post('/api/create-meals', (req, res) => {
  const { startDate, endDate } = req.body;
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) { // Pomijanie sobót i niedziel
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const checkQuery = 'SELECT date FROM meal_descriptions WHERE date IN (?)';
  const values = dates.map(date => date.toISOString().split('T')[0]);

  db.query(checkQuery, [values], (err, results) => {
    if (err) {
      console.error('Błąd podczas sprawdzania istniejących obiadów:', err);
      return res.status(500).json({ success: false, message: 'Błąd serwera przy sprawdzaniu istniejących obiadów' });
    }

    if (results.length > 0) {
      return res.status(409).json({ success: false, message: 'Niektóre obiady w podanym zakresie dat już istnieją' });
    }

    const insertQuery = 'INSERT INTO meal_descriptions (date) VALUES ?';
    db.query(insertQuery, [values.map(date => [date])], (err, result) => {
      if (err) {
        console.error('Błąd podczas tworzenia obiadów:', err);
        return res.status(500).json({ success: false, message: 'Błąd serwera przy tworzeniu obiadów' });
      }
      res.status(201).json({ success: true, message: 'Obiady utworzone pomyślnie' });
    });
  });
});

app.delete('/api/delete-meal', (req, res) => {
  const { date, id } = req.body;

  if (date || id) {
    let mealQuery = '';
    let mealParam = '';

    if (date) {
      console.log(`Received delete request for date: ${date}`);
      mealQuery = 'SELECT id FROM meal_descriptions WHERE date = ?';
      mealParam = date;
    } else if (id) {
      console.log(`Received delete request for id: ${id}`);
      mealQuery = 'SELECT id FROM meal_descriptions WHERE id = ?';
      mealParam = id;
    }

    // Rozpoczęcie transakcji
    db.beginTransaction((err) => {
      if (err) {
        console.error('Błąd podczas rozpoczynania transakcji:', err);
        return res.status(500).json({ success: false, message: 'Błąd serwera przy rozpoczynaniu transakcji' });
      }

      // Pobranie ID obiadu
      db.query(mealQuery, [mealParam], (err, mealResult) => {
        if (err) {
          console.error('Błąd podczas pobierania obiadu:', err);
          return db.rollback(() => {
            res.status(500).json({ success: false, message: 'Błąd serwera przy pobieraniu obiadu' });
          });
        }

        if (mealResult.length === 0) {
          console.log('Obiad nie znaleziony');
          return db.rollback(() => {
            res.status(404).json({ success: false, message: 'Obiad nie znaleziony' });
          });
        }

        const mealId = mealResult[0].id;

        // Pobranie wszystkich zamówień powiązanych z obiadem
        const getOrdersQuery = 'SELECT user_id FROM order_meals WHERE meal_id = ?';
        db.query(getOrdersQuery, [mealId], (err, orders) => {
          if (err) {
            console.error('Błąd podczas pobierania zamówień:', err);
            return db.rollback(() => {
              res.status(500).json({ success: false, message: 'Błąd serwera przy pobieraniu zamówień' });
            });
          }

          // Pobranie ceny obiadu
          const priceQuery = 'SELECT amount FROM price WHERE id = 1';
          db.query(priceQuery, (err, priceResult) => {
            if (err) {
              console.error('Błąd podczas pobierania ceny obiadu:', err);
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Błąd serwera przy pobieraniu ceny obiadu' });
              });
            }

            const mealPrice = priceResult[0].amount;

            // Aktualizacja sald użytkowników
            const updateBalancePromises = orders.map(order => {
              return new Promise((resolve, reject) => {
                const updateBalanceQuery = 'UPDATE user_balance SET balance = balance + ? WHERE user_id = ?';
                db.query(updateBalanceQuery, [mealPrice, order.user_id], (err, result) => {
                  if (err) {
                    console.error('Błąd podczas aktualizacji salda dla user_id:', order.user_id, err);
                    return reject(err);
                  }
                  resolve();
                });
              });
            });

            Promise.all(updateBalancePromises)
              .then(() => {
                // Usunięcie zamówień powiązanych z obiadem
                const deleteOrdersQuery = 'DELETE FROM order_meals WHERE meal_id = ?';
                db.query(deleteOrdersQuery, [mealId], (err, result) => {
                  if (err) {
                    console.error('Błąd podczas usuwania zamówień:', err);
                    return db.rollback(() => {
                      res.status(500).json({ success: false, message: 'Błąd serwera przy usuwaniu zamówień' });
                    });
                  }

                  // Usunięcie obiadu
                  const deleteMealQuery = 'DELETE FROM meal_descriptions WHERE id = ?';
                  db.query(deleteMealQuery, [mealId], (err, result) => {
                    if (err) {
                      console.error('Błąd podczas usuwania obiadu:', err);
                      return db.rollback(() => {
                        res.status(500).json({ success: false, message: 'Błąd serwera przy usuwaniu obiadu' });
                      });
                    }

                    db.commit((err) => {
                      if (err) {
                        console.error('Błąd podczas zatwierdzania transakcji:', err);
                        return db.rollback(() => {
                          res.status(500).json({ success: false, message: 'Błąd serwera przy zatwierdzaniu transakcji' });
                        });
                      }

                      console.log('Obiad i powiązane zamówienia usunięte pomyślnie, salda zaktualizowane');
                      res.status(200).json({ success: true, message: 'Obiad usunięty pomyślnie, salda użytkowników zaktualizowane' });
                    });
                  });
                });
              })
              .catch(err => {
                console.error('Błąd podczas aktualizacji sald użytkowników:', err);
                db.rollback(() => {
                  res.status(500).json({ success: false, message: 'Błąd serwera przy aktualizacji sald użytkowników' });
                });
              });
          });
        });
      });
    });
  } else {
    res.status(400).json({ success: false, message: 'Brak daty lub id w żądaniu' });
  }
});

app.get('/api/classes', (req, res) => {
  const query = 'SELECT id, name FROM class';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Błąd podczas pobierania klas:', err);
      return res.status(500).json({ error: 'Błąd serwera przy pobieraniu klas' });
    }
    res.json(results);
  });
});

app.post('/api/classes', (req, res) => {
  const { name } = req.body;

  // Sprawdzenie, czy klasa o tej nazwie już istnieje
  const checkQuery = 'SELECT * FROM class WHERE name = ?';
  db.query(checkQuery, [name], (err, results) => {
    if (err) {
      console.error('Błąd podczas sprawdzania klasy:', err);
      return res.status(500).json({ success: false, message: 'Błąd serwera przy sprawdzaniu klasy' });
    }
    if (results.length > 0) {
      return res.status(409).json({ success: false, message: 'Klasa o tej nazwie już istnieje' });
    }

    // Dodanie nowej klasy
    const query = 'INSERT INTO class (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
      if (err) {
        console.error('Błąd podczas dodawania klasy:', err);
        return res.status(500).json({ success: false, message: 'Błąd serwera przy dodawaniu klasy' });
      }
      res.status(201).json({ success: true, message: 'Klasa dodana pomyślnie' });
    });
  });
});

app.delete('/api/classes/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM class WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Błąd podczas usuwania klasy:', err);
      return res.status(500).json({ success: false, message: 'Błąd serwera przy usuwaniu klasy' });
    }
    res.status(200).json({ success: true, message: 'Klasa usunięta pomyślnie' });
  });
});

app.post('/api/login', (req, res) => {
  console.log('Received login request:', req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nazwa użytkownika i hasło są wymagane' });
  }

  const query = 'SELECT * FROM user WHERE login = ?';
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Błąd porównywania hasła:', err);
        return res.status(500).json({ error: 'Błąd serwera' });
      }
      if (!isMatch) {
        return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
      }

      console.log('User data:', {
        id: user.id,
        username: user.login,
        role_id: user.role_id
      });

      try {
        const token = jwt.sign(
          { userId: user.id, username: user.login, role_id: user.role_id },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.json({
          token,
          username: user.login,
          role_id: user.role_id,
          id: user.id
        });
      } catch (tokenError) {
        console.error('Błąd generowania tokena JWT:', tokenError);
        return res.status(500).json({ error: 'Błąd serwera' });
      }
    });
  });
});

app.get('/api/meals', (req, res) => {
  const query = 'SELECT * FROM meal_descriptions';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    res.json(results);
  });
});

app.post('/api/add-order', (req, res) => {
  const { userId, mealId } = req.body;
  console.log('Received order:', { userId, mealId });

  if (!userId || !mealId) {
    console.log("Brakujące dane: ", req.body);
    return res.status(400).json({ error: 'Brakujące dane' });
  }

  // Sprawdzanie, czy zamówienie już istnieje na podstawie user_id i meal_id
  const checkOrderQuery = `
    SELECT id 
    FROM order_meals 
    WHERE user_id = ? 
    AND meal_id = ?
  `;
  const values = [userId, mealId];

  console.log('Executing checkOrderQuery with values:', values);
  db.query(checkOrderQuery, values, (err, results) => {
    if (err) {
      console.error('Błąd podczas sprawdzania istniejącego zamówienia:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    console.log('checkOrderQuery results:', results);
    if (results.length > 0) {
      console.log('Order already exists for userId:', userId, 'and mealId:', mealId);
      return res.status(409).json({ error: 'Zamówienie na ten obiad już istnieje na wybrany dzień' });
    }

    // Pobieranie ceny obiadu
    const priceQuery = 'SELECT amount FROM price WHERE id = 1';
    db.query(priceQuery, (err, priceResult) => {
      if (err) {
        console.error('Błąd podczas pobierania ceny obiadu:', err);
        return res.status(500).json({ error: 'Błąd serwera przy pobieraniu ceny obiadu' });
      }

      const mealPrice = priceResult[0].amount;

      const insertOrderQuery = 'INSERT INTO order_meals (user_id, meal_id) VALUES (?, ?)';
      console.log('Executing insertOrderQuery with values:', [userId, mealId]);
      db.query(insertOrderQuery, [userId, mealId], (err, result) => {
        if (err) {
          console.error('Błąd podczas dodawania zamówienia:', err);
          return res.status(500).json({ error: 'Błąd serwera przy dodawaniu zamówienia' });
        }

        // Zmniejszenie salda użytkownika o cenę obiadu
        const updateBalanceQuery = 'UPDATE user_balance SET balance = balance - ? WHERE user_id = ?';
        db.query(updateBalanceQuery, [mealPrice, userId], (err, updateResult) => {
          if (err) {
            console.error('Błąd podczas aktualizacji salda:', err);
            return res.status(500).json({ error: 'Błąd serwera przy aktualizacji salda' });
          }

          console.log('Order added successfully for userId:', userId, 'and mealId:', mealId);
          res.json({ message: 'Zamówienie dodane pomyślnie' });
        });
      });
    });
  });
});

app.get('/meal-descriptions', (req, res) => {
  const now = new Date();
  now.setHours(now.getHours() + 2); // Dodaj 2 godziny, jeśli serwer działa w UTC

  console.log("Aktualny czas na serwerze:", now);

  const today = now.toISOString().split('T')[0];
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let query = `
    SELECT id, DATE_FORMAT(date, '%Y-%m-%d') AS date
    FROM meal_descriptions 
    WHERE date >= ? 
    ORDER BY date ASC
  `;
  let queryParams = [today];

  if (startDate && endDate) {
    query = `
      SELECT id, DATE_FORMAT(date, '%Y-%m-%d') AS date
      FROM meal_descriptions 
      WHERE date BETWEEN ? AND ?
      ORDER BY date ASC
    `;
    queryParams = [startDate, endDate];
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy:', err);
      return res.status(500).send('Błąd serwera');
    }

    console.log("Wyniki zapytania:", results);
    res.json(results);
  });
});

app.get('/api/user-balance', (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Brakujący parametr userId' });
  }

  const query = 'SELECT balance FROM user_balance WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Nie znaleziono salda dla tego użytkownika' });
    }

    res.json({ balance: results[0].balance });
  });
});

app.get('/api/price', (req, res) => {
  const query = 'SELECT amount FROM price WHERE id = 1';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    res.json(results[0]);
  });
});

app.put('/api/end-of-year', (req, res) => {
  const { statusId } = req.body;

  if (!statusId) {
    return res.status(400).json({ error: 'Wymagany jest status.' });
  }

  const query = `
    UPDATE user 
    SET status_id = ? 
    WHERE role_id = 1;  /* role_id 1 = Użytkownik */
  `;

  req.db.query(query, [statusId], (err, result) => {
    if (err) {
      console.error('Błąd podczas aktualizacji statusów:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    res.json({ message: 'Statusy zaktualizowane pomyślnie.' });
  });
});

app.put('/api/price', (req, res) => {
  const { amount } = req.body;
  const query = 'UPDATE price SET amount = ? WHERE id = 1';
  db.query(query, [amount], (err, result) => {
    if (err) {
      console.error('Błąd zapytania do bazy:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }
    res.json({ message: 'Cena obiadu zaktualizowana pomyślnie' });
  });
});

app.get('/api/users-manage', (req, res) => {
  const search = req.query.search || '';
  const classId = req.query.classId || '';
  const roleId = req.query.roleId || '';
  const statusId = req.query.statusId || '';

  let query = `
    SELECT u.*, ub.balance, ub.note FROM user u
    LEFT JOIN user_balance ub ON u.id = ub.user_id
    WHERE (u.imie LIKE ? OR u.nazwisko LIKE ? OR u.login LIKE ?)
  `;
  
  const queryParams = [`%${search}%`, `%${search}%`, `%${search}%`];

  if (classId) {
    query += ' AND u.class_id = ?';
    queryParams.push(classId);
  }

  if (roleId) {
    query += ' AND u.role_id = ?';
    queryParams.push(roleId);
  }

  if (statusId) {
    query += ' AND u.status_id = ?';
    queryParams.push(statusId);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Błąd podczas pobierania użytkowników:', err);
      return res.status(500).send('Błąd serwera');
    }
    res.json(results);
  });
});

app.get('/api/statuses', (req, res) => {
  console.log('Zapytanie o statusy odebrane.');
  const statuses = [
    { id: 1, name: 'Nieaktywny' },
    { id: 2, name: 'Aktywny' },
    { id: 3, name: 'Wakacje' },
    { id: 4, name: 'Zablokowany' },
  ];

  res.json(statuses);
});

app.put('/api/users-manage/:id', (req, res) => {
  const userId = req.params.id;
  const { imie, nazwisko, klasa, login, password, role_id, status_id, balance, note } = req.body;

  let updateUserQuery = `
    UPDATE user SET imie = ?, nazwisko = ?, class_id = ?, login = ?, role_id = ?, status_id = ? WHERE id = ?`;
  const updateUserValues = [imie, nazwisko, klasa, login, role_id, status_id, userId];

  const updateBalanceQuery = `
    UPDATE user_balance SET balance = ?, note = ? WHERE user_id = ?`;
  const updateBalanceValues = [balance, note, userId];

  if (password) {
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Błąd podczas hashowania hasła:', err);
        return res.status(500).send('Błąd serwera');
      }
      updateUserQuery = `
        UPDATE user SET imie = ?, nazwisko = ?, class_id = ?, login = ?, password = ?, role_id = ?, status_id = ? WHERE id = ?`;
      updateUserValues.splice(4, 0, hashedPassword);

      db.query(updateUserQuery, updateUserValues, (err, result) => {
        if (err) {
          console.error('Błąd podczas aktualizacji użytkownika:', err);
          return res.status(500).send('Błąd serwera');
        }

        db.query(updateBalanceQuery, updateBalanceValues, (err, result) => {
          if (err) {
            console.error('Błąd podczas aktualizacji salda:', err);
            return res.status(500).send('Błąd serwera');
          }

          res.json({ message: 'Dane użytkownika zaktualizowane pomyślnie.' });
        });
      });
    });
  } else {
    db.query(updateUserQuery, updateUserValues, (err, result) => {
      if (err) {
        console.error('Błąd podczas aktualizacji użytkownika:', err);
        return res.status(500).send('Błąd serwera');
      }

      db.query(updateBalanceQuery, updateBalanceValues, (err, result) => {
        if (err) {
          console.error('Błąd podczas aktualizacji salda:', err);
          return res.status(500).send('Błąd serwera');
        }

        res.json({ message: 'Dane użytkownika zaktualizowane pomyślnie.' });
      });
    });
  }
});

app.delete('/api/delete-meals-for-class', (req, res) => {
  const { classId, startDate, endDate } = req.body;

  if (!classId || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Brak wymaganych danych' });
  }

  // Pobranie listy użytkowników z wybranej klasy
  const getUsersQuery = 'SELECT id FROM user WHERE class_id = ?';
  db.query(getUsersQuery, [classId], (err, users) => {
    if (err) {
      console.error('Błąd podczas pobierania użytkowników z klasy:', err);
      return res.status(500).json({ success: false, message: 'Błąd serwera przy pobieraniu użytkowników' });
    }

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Brak użytkowników w wybranej klasie' });
    }

    const userIds = users.map(user => user.id);

    // Pobranie ceny obiadu
    const priceQuery = 'SELECT amount FROM price WHERE id = 1';
    db.query(priceQuery, (err, priceResult) => {
      if (err) {
        console.error('Błąd podczas pobierania ceny obiadu:', err);
        return res.status(500).json({ success: false, message: 'Błąd serwera przy pobieraniu ceny obiadu' });
      }

      const mealPrice = priceResult[0].amount;

      // Rozpoczęcie transakcji
      db.beginTransaction((err) => {
        if (err) {
          console.error('Błąd podczas rozpoczynania transakcji:', err);
          return res.status(500).json({ success: false, message: 'Błąd serwera przy rozpoczynaniu transakcji' });
        }

        // Pobranie zamówień do usunięcia
        const getOrdersQuery = `
          SELECT om.id, om.user_id
          FROM order_meals om
          JOIN meal_descriptions md ON om.meal_id = md.id
          WHERE om.user_id IN (?) AND md.date BETWEEN ? AND ?
        `;
        db.query(getOrdersQuery, [userIds, startDate, endDate], (err, orders) => {
          if (err) {
            console.error('Błąd podczas pobierania zamówień:', err);
            return db.rollback(() => {
              res.status(500).json({ success: false, message: 'Błąd serwera przy pobieraniu zamówień' });
            });
          }

          if (orders.length === 0) {
            return db.rollback(() => {
              res.status(404).json({ success: false, message: 'Brak zamówień do usunięcia' });
            });
          }

          const orderIds = orders.map(order => order.id);

          // Usunięcie zamówień
          const deleteOrdersQuery = 'DELETE FROM order_meals WHERE id IN (?)';
          db.query(deleteOrdersQuery, [orderIds], (err, result) => {
            if (err) {
              console.error('Błąd podczas usuwania zamówień:', err);
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Błąd serwera przy usuwaniu zamówień' });
              });
            }

            // Aktualizacja sald użytkowników
            const updateBalancePromises = orders.map(order => {
              return new Promise((resolve, reject) => {
                const updateBalanceQuery = 'UPDATE user_balance SET balance = balance + ? WHERE user_id = ?';
                db.query(updateBalanceQuery, [mealPrice, order.user_id], (err, result) => {
                  if (err) {
                    console.error('Błąd podczas aktualizacji salda dla user_id:', order.user_id, err);
                    return reject(err);
                  }
                  resolve();
                });
              });
            });

            Promise.all(updateBalancePromises)
              .then(() => {
                db.commit((err) => {
                  if (err) {
                    console.error('Błąd podczas zatwierdzania transakcji:', err);
                    return db.rollback(() => {
                      res.status(500).json({ success: false, message: 'Błąd serwera przy zatwierdzaniu transakcji' });
                    });
                  }

                  console.log('Obiady zostały usunięte, salda zaktualizowane');
                  res.json({ success: true, message: 'Obiady usunięte pomyślnie, salda użytkowników zaktualizowane' });
                });
              })
              .catch(err => {
                console.error('Błąd podczas aktualizacji sald użytkowników:', err);
                db.rollback(() => {
                  res.status(500).json({ success: false, message: 'Błąd serwera przy aktualizacji sald użytkowników' });
                });
              });
          });
        });
      });
    });
  });
});

app.get('/api/orders', (req, res) => {
  const { userId, filter, page = 1, limit = 10, start, end, class: classId, user } = req.query;
  const offset = (page - 1) * limit;
  const currentDate = new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toISOString().slice(11, 19);
  const cutoffTime = '08:30:00'; // Ustawienie godziny 8:30 rano
  let whereClause = '1=1';

  if (userId) {
    whereClause += ` AND om.user_id = ${db.escape(userId)}`;
  }

  if (filter) {
    if (filter === 'upcoming') {
      whereClause += ` AND (md.date > '${currentDate}' OR (md.date = '${currentDate}' AND '${currentTime}' <= '${cutoffTime}'))`;
    } else if (filter === 'past') {
      whereClause += ` AND (md.date < '${currentDate}' OR (md.date = '${currentDate}' AND '${currentTime}' > '${cutoffTime}'))`;
    }
  }

  if (start && end) {
    whereClause += ` AND md.date BETWEEN '${start}' AND '${end}'`;
  }

  if (classId) {
    whereClause += ` AND u.class_id = ${db.escape(classId)}`;
  }

  if (user) {
    whereClause += ` AND om.user_id = ${db.escape(user)}`;
  }

  // Ustalanie sortowania na podstawie filtra
  let orderByClause = 'ORDER BY md.date DESC'; // Domyślne sortowanie dla 'past'

  if (filter === 'upcoming') {
    orderByClause = 'ORDER BY md.date ASC'; // Sortowanie rosnące dla 'upcoming'
  }

  const queryOrders = `
    SELECT om.id, md.date, u.nazwisko, u.imie, c.name AS klasa
    FROM order_meals om
    JOIN meal_descriptions md ON om.meal_id = md.id
    JOIN user u ON om.user_id = u.id
    JOIN class c ON u.class_id = c.id
    WHERE ${whereClause}
    ${orderByClause}
    LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}
  `;

  const queryCount = `
    SELECT COUNT(*) AS totalCount
    FROM order_meals om
    JOIN meal_descriptions md ON om.meal_id = md.id
    JOIN user u ON om.user_id = u.id
    JOIN class c ON u.class_id = c.id
    WHERE ${whereClause}
  `;

  db.query(queryOrders, (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy:', err);
      return res.status(500).json({ error: 'Błąd serwera' });
    }

    db.query(queryCount, (errCount, resultsCount) => {
      if (errCount) {
        console.error('Błąd zapytania do bazy podczas liczenia:', errCount);
        return res.status(500).json({ error: 'Błąd serwera' });
      }

      res.json({
        orders: results,
        totalCount: resultsCount[0].totalCount
      });
    });
  });
});

app.get('/api/classes', (req, res) => {
  const query = 'SELECT id, name FROM class';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Błąd podczas pobierania klas:', err);
      return res.status(500).send('Błąd serwera przy pobieraniu klas');
    }
    res.json(results);
  });
});

app.get('/api/users', (req, res) => {
  const query = 'SELECT id, imie, nazwisko FROM user';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Błąd podczas pobierania użytkowników:', err);
      return res.status(500).send('Błąd serwera przy pobieraniu użytkowników');
    }
    res.json(results);
  });
});

app.delete('/api/cancel-order/:orderId', (req, res) => {
  const { orderId } = req.params;

  // Pobieranie informacji o zamówieniu przed usunięciem
  const getOrderQuery = 'SELECT user_id FROM order_meals WHERE id = ?';
  db.query(getOrderQuery, [orderId], (err, orderResult) => {
    if (err) {
      console.error('Błąd podczas pobierania zamówienia:', err);
      return res.status(500).json({ error: 'Błąd serwera przy pobieraniu zamówienia' });
    }

    if (orderResult.length === 0) {
      return res.status(404).json({ error: 'Zamówienie nie znalezione' });
    }

    const userId = orderResult[0].user_id;

    // Pobieranie ceny obiadu
    const priceQuery = 'SELECT amount FROM price WHERE id = 1';
    db.query(priceQuery, (err, priceResult) => {
      if (err) {
        console.error('Błąd podczas pobierania ceny obiadu:', err);
        return res.status(500).json({ error: 'Błąd serwera przy pobieraniu ceny obiadu' });
      }

      const mealPrice = priceResult[0].amount;

      // Usuwanie zamówienia
      const deleteOrderQuery = 'DELETE FROM order_meals WHERE id = ?';
      db.query(deleteOrderQuery, [orderId], (err, result) => {
        if (err) {
          console.error('Błąd podczas usuwania zamówienia:', err);
          return res.status(500).json({ error: 'Błąd serwera przy usuwaniu zamówienia' });
        }

        // Zwiększenie salda użytkownika o cenę obiadu
        const updateBalanceQuery = 'UPDATE user_balance SET balance = balance + ? WHERE user_id = ?';
        db.query(updateBalanceQuery, [mealPrice, userId], (err, updateResult) => {
          if (err) {
            console.error('Błąd podczas aktualizacji salda:', err);
            return res.status(500).json({ error: 'Błąd serwera przy aktualizacji salda' });
          }

          res.json({ message: 'Zamówienie anulowane pomyślnie' });
        });
      });
    });
  });
});

app.post('/api/generate-report', (req, res) => {
  const { start, end } = req.body;

  const query = `
    SELECT md.date, um.nazwisko, um.imie, c.name AS klasa
    FROM meal_descriptions md
    JOIN order_meals om ON om.meal_id = md.id
    JOIN user um ON um.id = om.user_id
    JOIN class c ON um.class_id = c.id
    WHERE md.date BETWEEN ? AND ?
    ORDER BY md.date, um.nazwisko, c.name;
  `;
  db.query(query, [start, end], (err, results) => {
    if (err) {
      console.error('Błąd podczas generowania raportu:', err);
      return res.status(500).send('Błąd serwera przy generowaniu raportu');
    }

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Raport zamówień');

    worksheet.columns = [
      { header: 'Nr', key: 'nr', width: 5 },
      { header: 'Data', key: 'date', width: 15 },
      { header: 'Nazwisko', key: 'nazwisko', width: 20 },
      { header: 'Imię', key: 'imie', width: 20 },
      { header: 'Klasa', key: 'klasa', width: 10 }
    ];

    worksheet.getRow(1).font = { bold: true };

    results.forEach((row, index) => {
      const formattedDate = new Date(row.date).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      worksheet.addRow({ nr: index + 1, date: formattedDate, nazwisko: row.nazwisko, imie: row.imie, klasa: row.klasa });
    });

    worksheet.autoFilter = {
      from: 'A1',
      to: `E${results.length + 1}`
    };

    worksheet.columns.forEach(column => {
      column.eachCell({ includeEmpty: true }, cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });

    const statsSheet = workbook.addWorksheet('Statystyki');

    const totalOrders = results.length;
    const ordersByClass = {};
    const ordersByUser = {};
    const ordersByDate = {};

    results.forEach(row => {
      if (!ordersByClass[row.klasa]) {
        ordersByClass[row.klasa] = 0;
      }
      ordersByClass[row.klasa]++;

      const userKey = `${row.nazwisko} ${row.imie}`;
      if (!ordersByUser[userKey]) {
        ordersByUser[userKey] = { count: 0, klasa: row.klasa };
      }
      ordersByUser[userKey].count++;

      if (!ordersByDate[row.date]) {
        ordersByDate[row.date] = 0;
      }
      ordersByDate[row.date]++;
    });

    statsSheet.addRow(['Klasa', 'Liczba obiadów']).font = { bold: true };
    Object.keys(ordersByClass).forEach((klasa, index) => {
      statsSheet.addRow([klasa, ordersByClass[klasa]]);
    });
    statsSheet.addRow([]);

    statsSheet.addRow(['Nazwisko', 'Imię', 'Klasa', 'Liczba obiadów']).font = { bold: true };
    Object.keys(ordersByUser).forEach((user, index) => {
      const [nazwisko, imie] = user.split(' ');
      statsSheet.addRow([nazwisko, imie, ordersByUser[user].klasa, ordersByUser[user].count]);
    });
    statsSheet.addRow([]);

    statsSheet.addRow(['Łączna liczba obiadów', totalOrders]).font = { bold: true };
    statsSheet.addRow([]);

    // Dodanie tabeli z podziałem zamówionych obiadów na dany dzień
    statsSheet.addRow(['Data', 'Liczba obiadów']).font = { bold: true };
    Object.keys(ordersByDate).forEach((date, index) => {
      const formattedDate = new Date(date).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      statsSheet.addRow([formattedDate, ordersByDate[date]]);
    });

    statsSheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength + 2;
    });

    const filePath = path.join(__dirname, 'report.xlsx');

    workbook.xlsx.writeFile(filePath).then(() => {
      res.download(filePath, 'report.xlsx', (err) => {
        if (err) {
          console.error('Błąd podczas pobierania pliku XLSX:', err);
          return res.status(500).send('Błąd serwera przy pobieraniu pliku XLSX');
        }

        fs.unlinkSync(filePath);
      });
    });
  });
});

app.get('/api/user-orders/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT om.id, DATE_FORMAT(md.date, '%Y-%m-%d') AS date 
    FROM order_meals om 
    JOIN meal_descriptions md ON om.meal_id = md.id 
    WHERE om.user_id = ? 
    ORDER BY md.date
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy:', err);
      return res.status(500).send('Błąd serwera przy pobieraniu zamówień');
    }
    res.json(results);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});
