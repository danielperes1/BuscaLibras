const express = require("express")
const router = express.Router()

const usuarioController = require("../controllers/usuarioController.js")
const { verificarAutenticacao, somenteSolicitante } = require("../middlewares/authMiddleware.js")

// Pagina de busca de profissionais (com filtros de texto, area e estado)
router.get("/buscar", verificarAutenticacao, somenteSolicitante, usuarioController.paginaBuscar)

// Registra o interesse do solicitante em um profissional
router.post("/interesses/:id", verificarAutenticacao, somenteSolicitante, usuarioController.demonstrarInteresse)

// Lista os interesses demonstrados pelo solicitante
router.get("/interesses", verificarAutenticacao, somenteSolicitante, usuarioController.paginaInteresses)

// Visualizacao publica do perfil de um profissional
router.get("/profissionais/:id/perfil", verificarAutenticacao, somenteSolicitante, usuarioController.verPerfilProfissional)

module.exports = router
