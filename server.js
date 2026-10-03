import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, 'data', 'menu.json');

const adminCredentialsPath = path.join(__dirname, 'data', 'admin.json');
const defaultAdminUser = {
  username: 'admin',
  password: 'yanni123',
};

const ensureAdminCredentialsFile = () => {
  const dir = path.dirname(adminCredentialsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(adminCredentialsPath)) {
    fs.writeFileSync(adminCredentialsPath, JSON.stringify(defaultAdminUser, null, 2), 'utf8');
  }
};

const getAdminUser = () => {
  ensureAdminCredentialsFile();

  try {
    const contents = fs.readFileSync(adminCredentialsPath, 'utf8');
    const parsed = JSON.parse(contents);
    return {
      ...defaultAdminUser,
      ...parsed,
    };
  } catch {
    return { ...defaultAdminUser };
  }
};

const writeAdminUser = (user) => {
  ensureAdminCredentialsFile();
  fs.writeFileSync(adminCredentialsPath, JSON.stringify(user, null, 2), 'utf8');
};

const defaultMenuData = [
  {
    title: 'Cultural Foods',
    items: [
      { name: 'Yanni Special Meat Combo', price: '1,200 ETB', vipPrice: '1,500 ETB', description: 'Premium beef and cultural sides with signature Ethiopian flavor.', cat: 'Cultural foods' },
      { name: 'Tibs', price: '750 ETB', vipPrice: '900 ETB', description: 'Classic Ethiopian beef tibs with peppers and butter.', cat: 'Cultural foods' },
    ],
  },
  {
    title: 'Junk Food',
    items: [
      { name: "Yani's Special Pizza", price: '950 ETB', vipPrice: '1,150 ETB', description: 'Loaded pizza with cheese, meat, and house sauce.', cat: 'Junk food' },
    ],
  },
];

const ensureDataFile = () => {
  const dir = path.dirname(dataFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify(defaultMenuData, null, 2), 'utf8');
  }
};

const readMenu = () => {
  ensureDataFile();

  try {
    const contents = fs.readFileSync(dataFilePath, 'utf8');
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultMenuData;
  } catch {
    return defaultMenuData;
  }
};

const writeMenu = (menu) => {
  ensureDataFile();
  fs.writeFileSync(dataFilePath, JSON.stringify(menu, null, 2), 'utf8');
};

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Yanni Menu API is running' });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const adminUser = getAdminUser();

  if (username === adminUser.username && password === adminUser.password) {
    return res.json({ ok: true, message: 'Login successful' });
  }

  return res.status(401).json({ ok: false, message: 'Invalid credentials' });
});

app.put('/api/admin/credentials', (req, res) => {
  const { username, password, currentUsername, currentPassword } = req.body || {};
  const adminUser = getAdminUser();

  if (currentUsername !== adminUser.username || currentPassword !== adminUser.password) {
    return res.status(401).json({ ok: false, message: 'Current admin credentials are invalid.' });
  }

  const nextUsername = String(username || '').trim();
  const nextPassword = String(password || '').trim();

  if (!nextUsername || !nextPassword) {
    return res.status(400).json({ ok: false, message: 'Username and password are required.' });
  }

  const nextUser = {
    username: nextUsername,
    password: nextPassword,
    role: 'menu-admin',
  };

  writeAdminUser(nextUser);
  return res.json({ ok: true, message: 'Admin credentials updated successfully.' });
});

app.get('/api/menu', (req, res) => {
  const menu = readMenu();
  res.json(menu);
});

app.put('/api/menu', (req, res) => {
  const { username, password, menu } = req.body || {};
  const adminUser = getAdminUser();

  if (username !== adminUser.username || password !== adminUser.password) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  if (!Array.isArray(menu)) {
    return res.status(400).json({ ok: false, message: 'Menu payload must be an array' });
  }

  writeMenu(menu);
  return res.json({ ok: true, message: 'Menu saved successfully' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Yanni Menu API listening on http://0.0.0.0:${port}`);
});
