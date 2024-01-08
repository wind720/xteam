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

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
