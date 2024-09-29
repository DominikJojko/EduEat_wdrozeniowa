const bcrypt = require('bcrypt');

const User = {
  create: function(db, login, password, imie, nazwisko, klasa, role_id, callback) {
    bcrypt.hash(password, 10, function(err, hash) {
      if (err) {
        return callback(err);
      }
      const query = 'INSERT INTO user (login, password, imie, nazwisko, klasa, role_id) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(query, [login, hash, imie, nazwisko, klasa, role_id], function(err, result) {
        callback(err, result);
      });
    });
  },

  findByLogin: function(db, login, callback) {
    const query = 'SELECT * FROM user WHERE login = ?';
    db.query(query, [login], function(err, results) {
      if (err) {
        return callback(err);
      }
      if (results.length > 0) {
        const user = results[0];
        user.role_id = user.role_id || null;
        callback(null, user);
      } else {
        callback(null, null);
      }
    });
  }
};

module.exports = User;
