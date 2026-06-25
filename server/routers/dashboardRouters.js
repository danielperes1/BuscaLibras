const express = require("express")
const router = express.Router()

const usuarioController = require("../controllers/usuarioController.js")
const { verificarAutenticacao, somenteProfissional } = require("../middlewares/authMiddleware.js")

// Home do profissional (resumo dos interesses recebidos)
router.get("/inicio", verificarAutenticacao, somenteProfissional, usuarioController.homeProfissional)

module.exports = router
