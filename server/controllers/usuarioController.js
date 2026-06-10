const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const usuarioModel = require("../models/usuarioModel.js")

module.exports = {
    login: async (req, res) => {
        try {
            const { email, senha } = req.body

            const usuario = await usuarioModel.buscarPorEmail(email)
            if (!usuario) return res.status(401).json({ mensagem: "Credenciais invalidas" })

            const senhaValida = await bcrypt.compare(senha, usuario.senha)
            if (!senhaValida) return res.status(401).json({ mensagem: "Credenciais invalidas" })

            let nome = 'Admin'
            if (usuario.perfil !== 'administrador') {
                nome = await usuarioModel.buscarNomePorIdUsuario(usuario.id, usuario.perfil) || usuario.email
            }

            const token = jwt.sign(
                { id: usuario.id, perfil: usuario.perfil, nome },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            )

            res.cookie('token', token, { httpOnly: true })

            if (usuario.perfil === 'administrador') return res.redirect("/usuarios")
            if (usuario.perfil === 'solicitante') return res.redirect("/profissionais/vitrine")
            if (usuario.perfil === 'profissional') return res.redirect("/dashboard/inicio")

        } catch (erro) {
            res.status(500).json({ mensagem: "Erro interno no servidor" })
        }
    },

    logout: (req, res) => {
        res.clearCookie('token')
        res.redirect("/login")
    },

    // DASHBOARD DO ADMIN - lista os usuarios do sistema com seus dados
    dashboard: async (req, res) => {
        try {
            const totalProfissionais = await usuarioModel.contarPorPerfil('profissional')
            const totalSolicitantes = await usuarioModel.contarPorPerfil('solicitante')
            const usuariosBrutos = await usuarioModel.listarUsuariosCompletos()

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

            res.render('admin/dashboard', {
                totalUsuarios: totalProfissionais + totalSolicitantes,
                totalProfissionais,
                totalSolicitantes,
                usuarios,
                paginaAtual: 'usuarios'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar a dashboard" })
        }
    },

    cadastrar: async (req, res) => {
        try {
            const { nome, email, senha, perfil, telefone, data_de_nascimento, pergunta_rec_senha, resposta_rec_senha, area_de_atuacao, estado, cidade } = req.body

            const foto = req.file ? `/uploads/usuarios/${req.file.filename}` : null

            const usuarioExistente = await usuarioModel.buscarPorEmail(email)
            if (usuarioExistente) return res.status(400).json({ mensagem: "Email ja cadastrado" })

            if (perfil === 'administrador') return res.status(403).json({ mensagem: "Perfil nao permitido" })

            const senhaCriptografada = await bcrypt.hash(senha, 10)

            const idUsuario = await usuarioModel.criarUsuario(email, senhaCriptografada, perfil)

            if (perfil === 'profissional') {
                await usuarioModel.criarProfissional(nome, telefone, data_de_nascimento, pergunta_rec_senha, resposta_rec_senha, area_de_atuacao, estado, cidade, foto, idUsuario)
            } else if (perfil === 'solicitante') {
                await usuarioModel.criarSolicitante(nome, telefone, data_de_nascimento, estado, cidade, pergunta_rec_senha, resposta_rec_senha, foto, idUsuario)
            }

            res.redirect("/login")

        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro interno no servidor" })
        }
    }
}
