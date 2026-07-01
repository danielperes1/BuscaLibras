const express = require("express")
const router = express.Router()

const usuarioController = require("../controllers/usuarioController.js")
const upload = require("../config/multer.js")
const uploadCertificado = require("../config/multerCertificado.js")
const { verificarAutenticacao, somenteProfissional, somenteSolicitante } = require("../middlewares/authMiddleware.js")

// Meu perfil: despacha conforme o tipo de usuario logado
// - solicitante: formulario de edicao dos proprios dados
// - profissional: visualizacao do perfil profissional
router.get("/", verificarAutenticacao, (req, res) => {
    if (req.usuario.perfil === 'solicitante') return usuarioController.editarPerfilSolicitante(req, res)
    return usuarioController.meuPerfil(req, res)
})

// Salva as alteracoes do perfil do solicitante (com upload opcional de foto)
router.post("/solicitante", verificarAutenticacao, somenteSolicitante, upload.single('foto'), usuarioController.atualizarPerfilSolicitanteAcao)

// Formulario de edicao do perfil
router.get("/editar", verificarAutenticacao, somenteProfissional, usuarioController.editarPerfilForm)

// Salva as alteracoes do perfil (com upload opcional de foto)
router.post("/editar", verificarAutenticacao, somenteProfissional, upload.single('foto'), usuarioController.atualizarPerfil)

// Tela de certificados e credenciais
router.get("/certificados", verificarAutenticacao, somenteProfissional, usuarioController.certificadosForm)

// Envio de um novo certificado
router.post("/certificados", verificarAutenticacao, somenteProfissional, uploadCertificado.single('anexo'), usuarioController.enviarCertificado)

module.exports = router
