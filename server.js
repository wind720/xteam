const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

app.use(session({
  secret: 'indw77',
  resave: false,
  saveUninitialized: true,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'acesso123',
  database: 'ecomm_login',
});

// Conectar ao banco de dados
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados MySQL');
  }
});

// Habilitar análise de corpo embutida no Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurar pasta pública
app.use(express.static(path.join(__dirname, 'public')));

// Rota padrão para servir o arquivo HTML
app.get('/', (req, res) => {
  const isLoggedIn = req.session && req.session.isLoggedIn;
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para lidar com o cadastro de usuários
app.post('/cadastrarUsuario', (req, res) => {
  const { username, email, password } = req.body;

  // Verifica se username, email e password estão presentes no corpo da requisição
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Informe username, email e password' });
  }

  // Insere os dados na tabela users
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, password], (err, result) => {
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

  // Consultar o banco de dados para verificar as credenciais
  db.query(
    'SELECT id, username, password FROM users WHERE username = ?',
    [username],
    async (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('Erro interno do servidor');
        return;
      }

      // Verificar se o usuário existe e comparar a senha com o hash
      if (results.length > 0) {
        const user = results[0];
        // Adicionar o nome de usuário à sessão
        req.session.isLoggedIn = true;
        req.session.userId = user.id;
        req.session.username = user.username; // Adicione esta linha

        res.status(200).send('Login bem-sucedido');
      } else {
        res.status(401).send('Credenciais inválidas');
      }
    }
  );
});

// Rota para verificar o status de login do usuário
app.get('/check-login', (req, res) => {
  const isLoggedIn = req.session.isLoggedIn || false;
  const userId = req.session.userId;
  const username = req.session.username || 'Sem usuário'; // Altere aqui

  res.json({ isLoggedIn, username, userId });
});

// Rota para obter o nome de usuário com base no ID do usuário
// Rota para obter o nome de usuário com base no ID do usuário
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

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Server is running at http://172.16.31.27:${port}`);
});
