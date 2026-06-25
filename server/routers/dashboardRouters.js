const express = require("express")
const router = express.Router()

const usuarioController = require("../controllers/usuarioController.js")
const { verificarAutenticacao, somenteProfissional } = require("../middlewares/authMiddleware.js")

// Home do profissional (resumo dos interesses recebidos)
router.get("/inicio", verificarAutenticacao, somenteProfissional, usuarioController.homeProfissional)

// Pagina de interessados (lista completa) e acoes de aceitar/recusar
router.get("/interessados", verificarAutenticacao, somenteProfissional, usuarioController.paginaInteressados)
router.post("/interessados/:id/status", verificarAutenticacao, somenteProfissional, usuarioController.atualizarStatusInteresse)

module.exports = router
