const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const USERS_FILE = './users.json';

// Helper: load users
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data || '[]');
}

// Helper: save users
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// SIGNUP route
app.post('/signup', (req, res) => {
  const { email, password, firstName, lastName, userType } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing info' });

  const users = loadUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  users.push({ email, password, firstName, lastName, userType });
  saveUsers(users);
  res.json({ success: true, message: 'Account created successfully!' });
});

// LOGIN route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ success: true, message: 'Login successful!', user });
});

app.listen(3000, () => console.log('✅ Server running at http://localhost:3000'));
