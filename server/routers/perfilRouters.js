const express = require("express")
const router = express.Router()

const usuarioController = require("../controllers/usuarioController.js")
const upload = require("../config/multer.js")
const uploadCertificado = require("../config/multerCertificado.js")
const { verificarAutenticacao, somenteProfissional } = require("../middlewares/authMiddleware.js")

// Visualizacao do proprio perfil do profissional
router.get("/", verificarAutenticacao, somenteProfissional, usuarioController.meuPerfil)

// Formulario de edicao do perfil
router.get("/editar", verificarAutenticacao, somenteProfissional, usuarioController.editarPerfilForm)

// Salva as alteracoes do perfil (com upload opcional de foto)
router.post("/editar", verificarAutenticacao, somenteProfissional, upload.single('foto'), usuarioController.atualizarPerfil)

// Tela de certificados e credenciais
router.get("/certificados", verificarAutenticacao, somenteProfissional, usuarioController.certificadosForm)

// Envio de um novo certificado
router.post("/certificados", verificarAutenticacao, somenteProfissional, uploadCertificado.single('anexo'), usuarioController.enviarCertificado)

module.exports = router
