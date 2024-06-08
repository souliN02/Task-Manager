const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/style', express.static(__dirname + '/style'));

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
    res.redirect('/');
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
  if (req.session.user) { // Check if the user is logged in
    res.sendFile(__dirname + '/html/tasks.html');
  } else {
    res.redirect('/login'); // Redirect to the login page if the user is not logged in
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(); // Destroy the session to log the user out
  res.redirect('/login');
});

app.listen(3000, function() {
  console.log('listening on 3000');
});