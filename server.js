const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configurar pasta pública
app.use(express.static(path.join(__dirname, 'public')));

// Rota padrão para servir o arquivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para a página de login/cadastro
app.get('/loginCadastro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'loginCadastro', 'loginCadastro.html'));
});

// Rota para a página de avaliação/compra
app.get('/avaliacaoCompra', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'avaliacaoCompra', 'avaliacaoCompra.html'));
});

// Rota para a página de personalização de usuário
app.get('/personalizacaoUsuario', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'personalizacaoUsuario', 'personalizacaoUsuario.html'));
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Server is running at http://172.16.31.27:${port}`);
});
