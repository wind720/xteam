const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const ejs = require('ejs');

const app = express();
const port = process.env.PORT || 3000;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // Altere para 'ejs'

app.use(session({
  secret: 'indw77',
  resave: false,
  saveUninitialized: true,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/game', express.static(path.join(__dirname, 'views')));

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'acesso123',
  database: process.env.DB_DATABASE || 'ecomm_login',
});

// Conectar ao banco de dados
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados MySQL');
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  const isLoggedIn = req.session && req.session.isLoggedIn;
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/check-login', (req, res) => {
  try {
    const isLoggedIn = req.session.isLoggedIn || false;
    const userId = req.session.userId;
    const username = req.session.username || 'Sem usuário';

    if (!isLoggedIn) {
      res.status(401).json({ isLoggedIn, username, userId });
    } else {
      res.status(200).json({ isLoggedIn, username, userId });
    }
  } catch (error) {
    console.error('Erro ao verificar o status de login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/get-username', (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    db.query('SELECT username FROM users WHERE id = ?', [userId], (error, results) => {
      if (error) {
        console.error('Erro ao obter o nome de usuário:', error);
        res.status(500).send('Erro interno do servidor');
        return;
      }

      const username = results[0]?.username || 'Sem usuário';
      res.json({ username });
    });
  } else {
    res.json({ username: 'Sem usuário' });
  }
});
app.post('/cadastrarUsuario', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Informe username, email e password' });
  }

  const sqlInsertUser = 'INSERT INTO users (username, email, password, balance, comments, avaliations, games) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const defaultValues = [username, email, password, 100.00, 0, 0, 0];

  // Inserir novo usuário no banco de dados
  db.query(sqlInsertUser, defaultValues, (err, result) => {
    if (err) {
      console.log('Erro ao cadastrar usuário:', err);
      return res.status(500).json({ error: 'Erro interno ao cadastrar usuário' });
    }

    console.log('Usuário cadastrado com sucesso');
    return res.status(200).json({ success: 'Usuário cadastrado com sucesso' });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query(
    'SELECT id, username, password FROM users WHERE username = ?',
    [username],
    async (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }

      if (results.length > 0) {
        const user = results[0];
        req.session.isLoggedIn = true;
        req.session.userId = user.id;
        req.session.username = user.username;

        res.status(200).json({ success: 'Login bem-sucedido' });
      } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
      }
    }
  );
});

app.get('/get-user-info', (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    db.query('SELECT username, email, password FROM users WHERE id = ?', [userId], (error, results) => {
      if (error) {
        console.error('Erro ao obter informações do usuário:', error);
        res.status(500).send('Erro interno do servidor');
        return;
      }

      const user = results[0] || {};
      res.json(user);
    });
  } else {
    res.status(401).json({ error: 'Usuário não autenticado' });
  }
});

app.post('/atualizar-dados', (req, res) => {
  const userId = req.session.userId;
  const { newUsername, newPassword } = req.body;

  if (!newUsername || !newPassword) {
    return res.status(400).json({ error: 'Informe novo nome de usuário e senha' });
  }

  if (newUsername.length > 30 || newPassword.length > 25) {
    return res.status(400).json({ error: 'Nome de usuário ou senha muito longos' });
  }

  const sql = 'UPDATE users SET username = ?, password = ? WHERE id = ?';
  db.query(sql, [newUsername, newPassword, userId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
      return res.status(500).json({ error: 'Erro interno ao atualizar dados do usuário' });
    }

    console.log('Dados do usuário atualizados com sucesso');
    return res.status(200).json({ success: 'Dados do usuário atualizados com sucesso' });
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/game/:gameid', (req, res) => {
  const gameId = req.params.gameid;

  // Consultar o banco de dados para obter informações do jogo com base no gameid
  db.query('SELECT * FROM games WHERE gameid = ?', [gameId], (error, results) => {
    if (error) {
      console.error('Erro ao obter informações do jogo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }

    if (results.length > 0) {
      const gameInfo = results[0];

      // Verifica se a requisição aceita JSON
      const acceptJson = req.get('Accept') === 'application/json';

      // Se aceita JSON, envia a resposta como JSON
      if (acceptJson) {
        res.json(gameInfo);
      } else {
        // Se não aceita JSON, renderiza a página HTML normalmente
        res.render('rangame', { gameInfo, req });
      }
    } else {
      res.status(404).json({ error: 'Jogo não encontrado' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://172.16.31.27:${port}`);
});
