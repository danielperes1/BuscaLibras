const jwt = require('jsonwebtoken')

module.exports = {
  verificarAutenticacao: (req, res, next) => {
    // Busca o token JWT armazenado no cookie 'token'
    const token = req.cookies?.token
    if (!token) return res.redirect('/login')

    try {
      // Valida o token e extrai os dados do usuário
      const usuario = jwt.verify(token, process.env.JWT_SECRET)
      req.usuario = usuario
      res.locals.usuario = usuario // Disponibiliza o usuário para as views EJS
      next()
    } catch {
      // Se o token for inválido ou expirado, limpa o cookie e redireciona ao login
      res.clearCookie('token')
      res.redirect('/login')
    }
  },

  somenteAdmin: (req, res, next) => {
    // Permite o acesso apenas se o usuário for administrador
    if (req.usuario?.perfil !== 'administrador') {
      return res.status(403).json({ mensagem: 'Acesso restrito ao administrador' })
    }
    next()
  }
}

