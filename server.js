const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/style', express.static(__dirname + '/style'));
app.use('/scripts', express.static(__dirname + '/scripts'));

app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

let db = new sqlite3.Database('./db/users.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the users database.');
});

db.run(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email text NOT NULL,
    password text NOT NULL
);`);

db.run(`CREATE TABLE IF NOT EXISTS tasks(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description text NOT NULL,
  userId INTEGER,
  FOREIGN KEY(userId) REFERENCES users(id)
);`);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/html/register.html');
});

app.post('/register', (req, res) => {
  if (req.body.password !== req.body.passwordConfirmation) {
    return res.send('Passwords do not match');
  }

  db.run(`INSERT INTO users(email, password) VALUES(?,?)`, [req.body.email, req.body.password], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`A row has been inserted with rowid ${this.lastID}`);
    res.redirect('/login');
  });
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/html/login.html');
});

app.post('/login', (req, res) => {
  db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [req.body.email, req.body.password], (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    if (row) {
      req.session.user = row; // Save the user's information in the session
      res.redirect('/tasks');
    } else {
      res.send('Login failed');
    }
  });
});

app.get('/tasks', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(__dirname + '/html/tasks.html');
});

app.get('/tasks-data', (req, res) => {
  const userId = req.session.user.id;
  db.all(`SELECT * FROM tasks WHERE userId = ?`, [userId], (err, tasks) => {
    if (err) {
      return console.error(err.message);
    }
    res.json(tasks);
  });
});

app.get('/current-user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ name: req.session.user.name });
});

app.post('/tasks', (req, res) => {
  const sql = `INSERT INTO tasks(description, userId) VALUES(?,?)`;
  const params = [req.body.description, req.session.user.id];

  db.run(sql, params, function(err) {
    if (err) {
      return console.log(err.message);
    }

    // Get the newly inserted task
    db.get(`SELECT * FROM tasks WHERE id = ?`, [this.lastID], (err, task) => {
      if (err) {
        return console.log(err.message);
      }
      // Respond with the newly created task
      res.json(task);
    });
  });
});

app.put('/tasks/:id', (req, res) => {
  db.run(`UPDATE tasks SET description = ? WHERE id = ?`, [req.body.description, req.params.id], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`Row(s) updated: ${this.changes}`);
    res.send('Task updated');
  });
});

app.delete('/tasks/:id', (req, res) => {
  db.run(`DELETE FROM tasks WHERE id = ?`, req.params.id, function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`Row(s) deleted: ${this.changes}`);
    res.send('Task deleted');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(); // Destroy the session to log the user out
  res.redirect('/login');
});

app.listen(3000, function() {
  console.log('listening on 3000');
});