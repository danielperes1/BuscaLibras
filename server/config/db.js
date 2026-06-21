// Importa o cliente MySQL com suporte a promessa
const mysql = require('mysql2/promise')

// Cria um pool de conexões para o banco de dados, permitindo reuso e melhor performance
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Endereço do servidor MySQL
  user: process.env.DB_USER, // Usuário de conexão
  password: process.env.DB_PASSWORD, // Senha do usuário
  database: process.env.DB_NAME, // Nome do banco de dados
  waitForConnections: true, // Permite aguardar quando não há conexões disponíveis
  connectionLimit: 10, // Número máximo de conexões simultâneas
  queueLimit: 0 // Sem limite de fila para requisições esperando conexão
})

// Exporta o pool para ser usado em todo o projeto
module.exports = pool

