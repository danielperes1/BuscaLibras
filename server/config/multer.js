// Configura o multer para upload de arquivos de imagem de usuário
const multer = require('multer')
const path = require('path')

// Define como e onde os arquivos serão salvos no servidor
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define a pasta de destino de uploads dos usuários
    cb(null, path.join(__dirname, '../../client/public/uploads/usuarios/'))
  },
  filename: (req, file, cb) => {
    // Gera um nome de arquivo único para evitar colisões
    const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    cb(null, nomeUnico)
  }
})

// Cria o middleware de upload usando o storage definido
const upload = multer({ storage })

// Exporta o middleware para uso nas rotas
module.exports = upload

