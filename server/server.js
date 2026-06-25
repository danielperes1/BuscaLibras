// Importa o framework Express e cria a aplicação
const express = require("express")
const app = express()

// Módulo do Node para manipular caminhos de arquivos
const path = require("path")

// Exibe o caminho atual do diretório do servidor (apenas para depuração)
console.log(path.join(__dirname, ":estou aqui"))

// Define a porta do servidor a partir da variável de ambiente ou usa 5000 como padrão
const port = process.env.PORT || 5000

// Configurações de middlewares para tratar requisições
app.use(express.json()) // Permite ler payloads JSON no corpo das requisições
app.use(express.urlencoded({ extended: true })) // Permite ler dados de formulários enviados via POST
app.use(require('cookie-parser')()) // Habilita leitura e escrita de cookies no Express

// Carrega variáveis de ambiente a partir do arquivo .env
require('dotenv').config()

// Configurações do motor de views EJS
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../client/views')) // Define onde ficam os templates

// Expondo arquivos estáticos da pasta client/public para o navegador
app.use(express.static(path.join(__dirname, '../client/public')))

// Rotas públicas básicas
app.get('/', (req, res) => {
  // Ao acessar a raiz do sistema, redireciona para a página de login
  res.status(200).redirect('/login')
})

app.get('/login', (req, res) => {
  // Renderiza a página de login
  res.render('auth/login')
})

app.get('/escolha', (req, res) => {
  // Renderiza a tela de escolha entre perfil profissional ou solicitante
  res.render('auth/escolha')
})

app.get('/cadastro', (req, res) => {
  // Renderiza a tela de cadastro para profissionais
  res.render('auth/cadastro')
})

app.get('/cadastro2', (req, res) => {
  // Renderiza a tela de cadastro para solicitantes
  res.render('auth/cadastro2')
})

// Rota pública para redefinição de senha (acessível em /redefinicaoSenha)
app.get('/redefinicaoSenha', (req, res) => {
  res.render('auth/redefinicaoSenha')
})
// Importa as rotas específicas de usuário
const usuariosRoutes = require('./routers/usuarioRouters.js')
app.use('/usuarios', usuariosRoutes) // Monta as rotas em /usuarios

// Importa a configuração de conexão com o banco de dados
const pool = require('./config/db.js')

// Testa conexão com o banco antes de subir o servidor
;(async () => {
  try {
    await pool.getConnection() // Verifica se é possível conectar ao banco
    console.log('Banco conectado')

    // Se conseguir conectar, inicia o servidor Express
    app.listen(port, () => {
      console.log(`Link: http://localhost:${port}`)
      console.log(`Servidor funcionando na porta: ${port}`)
    })
  } catch (erro) {
    // Se falhar na conexão, exibe o erro e encerra o processo
    console.log('Erro ao tentar conectar com o banco de dados')
    process.exit(1)
  }
})()
