const express = require("express")
const router = express.Router()

const usuarioController = require("../controllers/usuarioController.js")
const upload = require("../config/multer.js")
const { verificarAutenticacao, somenteAdmin } = require("../middlewares/authMiddleware.js")

// Rotas públicas
router.post("/login", usuarioController.login)
router.get("/logout", usuarioController.logout)
router.post("/cadastrar", upload.single('foto'), usuarioController.cadastrar)

// Rotas privadas (admin)
router.get("/", verificarAutenticacao, somenteAdmin, usuarioController.dashboard)

module.exports = router
