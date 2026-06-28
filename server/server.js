// importação do modulo express
const express = require("express");
const app = express();

//modulo do node para lidar com caminho de arquivos
const path = require("path");

console.log(path.join(__dirname, ":estou aqui"));

// Define a porta do servidor com base nas variaveis do ambiente
// Se der errado, a porta será a 5000
const port = process.env.PORT || 5000;

//MIDDLEWARE PARA ENTENDER O JSON
app.use(express.json()) // le os dados em json
app.use(express.urlencoded({extended: true})) // Servidor esta apto a ler os dados dos formulario
// Permite ler cookies e alterar tambem
app.use(require('cookie-parser')())
// importa o modulo do dotenv, le o arquivo .env, e ja configura inicialmente
require('dotenv').config()

const { verificarAutenticacao } = require('./middlewares/authMiddleware.js')

// CONFIGURAÇÃO DO EJS E PASTAS DO FRONT END
// Define o EJS como engine do front 
app.set('view engine','ejs')

// Aponta para o express e ejs onde estão as paginas 
app.set('views', path.join(__dirname, "../client/views"))

// Deixa a pasta public acessivel ao usuario 
app.use(express.static(path.join(__dirname, "../client/public")))


// ROTAS PUBLICAS
// Criação de rotas padrão


app.get("/", (req, res) => {
  // Redireciona para a tela de login
  res.status(200).redirect("/login");
});


// ROTA QUE RETORNA A PAGINA DE LOGIN
app.get("/login", (req, res) => {
  res.render("auth/login");
});

// ROTA QUE RETORNA A PAGINA DE ESCOLHA DE PERFIL
app.get("/escolha", (req, res) => {
  res.render("auth/escolha");
});

// ROTA QUE RETORNA O CADASTRO DE PROFISSIONAL
app.get("/cadastro", (req, res) => {
  res.render("auth/cadastro");
});

// ROTA QUE RETORNA O CADASTRO DE SOLICITANTE
app.get("/cadastro2", (req, res) => {
  res.render("auth/cadastro2");
});

// ROTA DA HOME DO SOLICITANTE APÓS O LOGIN
app.get("/profissionais/vitrine", verificarAutenticacao, (req, res) => {
  res.render("solicitante/home", {
    totalInteresses: 0,
    paginaAtual: "home"
  });
});

//importar as rotas do usuario
const usuariosRoutes = require("./routers/usuarioRouters.js");

// Requisições começando com /usuarios e gerenciada pelo sub-arquivo de rotas
app.use("/usuarios", usuariosRoutes);

//importar as rotas do dashboard do profissional
const dashboardRoutes = require("./routers/dashboardRouters.js");

// Requisições começando com /dashboard (home do profissional)
app.use("/dashboard", dashboardRoutes);

//importar as rotas de perfil do profissional
const perfilRoutes = require("./routers/perfilRouters.js");

// Requisições começando com /meu-perfil
app.use("/meu-perfil", perfilRoutes);


// Funcao para subir no servidor
/*
app.listen(port, () => {
  console.log(`Servidor ativo e ouvindo na porta: ${port}`);
  console.log(`Link: http://localhost:${port}`);
});
*/

const pool = require("./config/db.js");

//Cria uma conexao teste com o banco

(async () => {

  try {
    await pool.getConnection();
    console.log("Banco conectado");

    // Se o banco de dados estiver ativo, ai sim o servidor sera iniciado
    app.listen(port, () => {
      console.log(`Link: http://localhost:${port}`)
      console.log(`Servidor funcionando na porta: ${port}`)
    });

  } catch (erro) {
    // Se deu erro, avisa e encerra a tentativa
    console.log("Erro ao tentar conectar com o banco de dados");
    process.exit(1);
  }
})();