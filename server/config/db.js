// importa o modulo mysql para conectar ao banco
const mysql = require("mysql2/promise")

// Cria uma pool de conexao, varias conexoes de uma vez, para evitar erros no banco
const pool = mysql.createPool({
    host: process.env.DB_HOST, // Onde o banco esta hospedado
    user: process.env.DB_USER, // Usuario que fará a conexão
    password: process.env.DB_PASSWORD, // Senha do usuario
    database: process.env.DB_NAME, // Banco ao qual deseja se conectar
    charset: 'utf8mb4', // Garante que acentos (ç, á, é...) e ENUMs com acento sejam gravados corretamente
     // Se todas conexoes estiverem ocupadas, deixa o usuario esperando sem dar erro
    waitForConnections: true, 
    // Quantidade maxima de conexoes ao mesmo tempo
    connectionLimit: 10, // Limite de conexoes ao mesmo tempo
    queueLimit: 0 // Sem limite para filas de conexao    
})

// Exporta as informacoes do banco, pros models utilizarem
module.exports = pool;
