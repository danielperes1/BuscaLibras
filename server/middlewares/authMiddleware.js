const jwt = require('jsonwebtoken')

module.exports = {
    verificarAutenticacao: (req, res, next) => {
        const token = req.cookies?.token
        if (!token) return res.redirect('/login')

        try {
            const usuario = jwt.verify(token, process.env.JWT_SECRET)
            req.usuario = usuario
            res.locals.usuario = usuario
            next()
        } catch {
            res.clearCookie('token')
            res.redirect('/login')
        }
    },

    somenteAdmin: (req, res, next) => {
        if (req.usuario?.perfil !== 'administrador') {
            return res.status(403).json({ mensagem: 'Acesso restrito ao administrador' })
        }
        next()
    },

    somenteProfissional: (req, res, next) => {
        if (req.usuario?.perfil !== 'profissional') {
            return res.status(403).json({ mensagem: 'Acesso restrito ao profissional' })
        }
        next()
    }
}
