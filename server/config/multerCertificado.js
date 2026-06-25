const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../client/public/uploads/certificados/'))
    },
    filename: (req, file, cb) => {
        const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
        cb(null, nomeUnico)
    }
})

// So aceita PDF, JPG ou PNG
const fileFilter = (req, file, cb) => {
    const permitidos = ['application/pdf', 'image/jpeg', 'image/png']
    if (permitidos.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Formato invalido. Envie PDF, JPG ou PNG.'))
    }
}

const uploadCertificado = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

module.exports = uploadCertificado
