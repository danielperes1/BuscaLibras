const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const usuarioModel = require('../models/usuarioModel.js')

module.exports = {
  login: async (req, res) => {
    try {
      const { email, senha } = req.body

      // Busca o usuário no banco pelo email informado
      const usuario = await usuarioModel.buscarPorEmail(email)
      if (!usuario) return res.status(401).json({ mensagem: 'Credenciais invalidas' })

      // Compara a senha informada com a senha criptografada no banco
      const senhaValida = await bcrypt.compare(senha, usuario.senha)
      if (!senhaValida) return res.status(401).json({ mensagem: 'Credenciais invalidas' })

      // Define o nome do usuário para exibição no token e no cabeçalho
      let nome = 'Admin'
      if (usuario.perfil !== 'administrador') {
        nome = await usuarioModel.buscarNomePorIdUsuario(usuario.id, usuario.perfil) || usuario.email
      }

      // Cria um token JWT com id, perfil e nome do usuário
      const token = jwt.sign(
        { id: usuario.id, perfil: usuario.perfil, nome },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      )

      // Armazena o token no cookie para manter a sessão
      res.cookie('token', token, { httpOnly: true })

      // Redireciona o usuário de acordo com seu perfil
      if (usuario.perfil === 'administrador') return res.redirect('/usuarios')
      if (usuario.perfil === 'solicitante') return res.redirect('/profissionais/vitrine')
      if (usuario.perfil === 'profissional') return res.redirect('/dashboard/inicio')
    } catch (erro) {
      res.status(500).json({ mensagem: 'Erro interno no servidor' })
    }
  },

  logout: (req, res) => {
    // Limpa o cookie do token e redireciona para a página de login
    res.clearCookie('token')
    res.redirect('/login')
  },

  // Renderiza a dashboard do administrador com estatísticas e lista de usuários
  dashboard: async (req, res) => {
    try {
      const totalProfissionais = await usuarioModel.contarPorPerfil('profissional')
      const totalSolicitantes = await usuarioModel.contarPorPerfil('solicitante')
      const usuariosBrutos = await usuarioModel.listarUsuariosCompletos()

      // Formata os dados dos usuários para exibição na view
      const usuarios = usuariosBrutos.map(user => {
        const nome = user.nome || user.email
        const partesNome = nome.trim().split(/\s+/)
        const iniciais = (partesNome[0][0] + (partesNome[1]?.[0] || '')).toUpperCase()

        return {
          ...user,
          nome,
          iniciais,
          tipoLabel: user.perfil === 'profissional' ? user.area_de_atuacao : 'Solicitante',
          perfilLabel: user.perfil === 'profissional' ? 'Profissional' : 'Solicitante',
          statusLabel: user.status === 'inativo' ? 'Inativo' : 'Ativo',
          dataCadastroFormatada: new Date(user.data_cadastro).toLocaleDateString('pt-BR')
        }
      })

      // Renderiza a view da dashboard com os dados necessários
      res.render('admin/dashboard', {
        totalUsuarios: totalProfissionais + totalSolicitantes,
        totalProfissionais,
        totalSolicitantes,
        usuarios,
        paginaAtual: 'usuarios'
      })
    } catch (erro) {
      console.error(erro)
      res.status(500).json({ mensagem: 'Erro ao carregar a dashboard' })
    }
  },

  cadastrar: async (req, res) => {
    try {
      const {
        nome,
        email,
        senha,
        perfil,
        telefone,
        data_de_nascimento,
        pergunta_rec_senha,
        resposta_rec_senha,
        area_de_atuacao,
        estado,
        cidade
      } = req.body

      // Se o usuário enviou uma foto, monta o caminho relativo para a pasta de uploads
      const foto = req.file ? `/uploads/usuarios/${req.file.filename}` : null

      // Verifica se já existe um usuário com o mesmo email
      const usuarioExistente = await usuarioModel.buscarPorEmail(email)
      if (usuarioExistente) return res.status(400).json({ mensagem: 'Email ja cadastrado' })

      // Impede que o perfil administrador seja criado via cadastro público
      if (perfil === 'administrador') return res.status(403).json({ mensagem: 'Perfil nao permitido' })

      // Criptografa a senha antes de salvar no banco
      const senhaCriptografada = await bcrypt.hash(senha, 10)

      // Insere o registro principal na tabela de usuários
      const idUsuario = await usuarioModel.criarUsuario(email, senhaCriptografada, perfil)

      // Insere dados adicionais dependendo do perfil escolhido
      if (perfil === 'profissional') {
        await usuarioModel.criarProfissional(
          nome,
          telefone,
          data_de_nascimento,
          pergunta_rec_senha,
          resposta_rec_senha,
          area_de_atuacao,
          estado,
          cidade,
          foto,
          idUsuario
        )
      } else if (perfil === 'solicitante') {
        await usuarioModel.criarSolicitante(
          nome,
          telefone,
          data_de_nascimento,
          estado,
          cidade,
          pergunta_rec_senha,
          resposta_rec_senha,
          foto,
          idUsuario
        )
      }

      // Após cadastro bem-sucedido, redireciona para o login
      res.redirect('/login')
    } catch (erro) {
      console.error(erro)
      res.status(500).json({ mensagem: 'Erro interno no servidor' })
    }
  }
}
