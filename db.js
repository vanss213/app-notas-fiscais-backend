// db.js
const { Pool } = require('pg');

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  user: 'postgres',           // seu usuário do pgAdmin
  host: 'localhost',          // ou 127.0.0.1
  database: 'backend_notas',  // nome do seu banco no pgAdmin
  password: 'minhasenha123',  // troque pela sua senha real do PostgreSQL
  port: 5432,                 // porta padrão do PostgreSQL
});

// Teste de conexão ao iniciar
pool.connect()
  .then(() => console.log('✅ Conectado ao PostgreSQL com sucesso!'))
  .catch(err => console.error('❌ Erro na conexão com o PostgreSQL:', err));

module.exports = pool;
