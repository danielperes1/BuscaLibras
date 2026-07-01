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

    // HOME DO PROFISSIONAL - resumo dos interesses recebidos
    homeProfissional: async (req, res) => {
        try {
            const idUsuario = req.usuario.id

            const profissional = await usuarioModel.buscarProfissionalPorIdUsuario(idUsuario)
            if (!profissional) return res.status(404).json({ mensagem: "Profissional nao encontrado" })

            const idProfissional = profissional.id

            const [totalInteressados, novosHoje, porStatus, interessadosBrutos] = await Promise.all([
                usuarioModel.contarInteressesPorProfissional(idProfissional),
                usuarioModel.contarInteressesHoje(idProfissional),
                usuarioModel.contarInteressesPorStatus(idProfissional),
                usuarioModel.listarInteressadosRecentes(idProfissional, 3)
            ])

            // Calcula o percentual de preenchimento do perfil
            const camposPerfil = ['nome', 'telefone', 'data_de_nascimento', 'area_de_atuacao', 'estado', 'cidade', 'foto']
            const preenchidos = camposPerfil.filter(campo => profissional[campo]).length
            const perfilCompleto = Math.round((preenchidos / camposPerfil.length) * 100)

            // Gera iniciais e cor de avatar para cada interessado
            const coresAvatar = ['#b39ddb', '#80cbc4', '#dce775', '#ffab91', '#9fa8da', '#f48fb1', '#90caf9']
            const interessados = interessadosBrutos.map((item, i) => {
                const nome = (item.nome || '').trim()
                const inicial = (nome[0] || '?').toUpperCase()
                const localizacao = [item.cidade, item.estado].filter(Boolean).join(' - ') || '-'
                // So usa a foto se for um upload real (ignora placeholders do seed como "joao.jpg")
                const foto = (item.foto && item.foto.startsWith('/uploads/')) ? item.foto : null
                return {
                    ...item,
                    foto,
                    inicial,
                    localizacao,
                    cor: coresAvatar[i % coresAvatar.length]
                }
            })

            res.render('profissional/home', {
                nome: req.usuario.nome,
                totalInteressados,
                novosHoje,
                perfilCompleto,
                aceitos: porStatus.aceito,
                pendentes: porStatus.pendente,
                recusados: porStatus.recusado,
                interessados,
                paginaAtual: 'home'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar a home do profissional" })
        }
    },

    // PAGINA DE INTERESSADOS - lista completa dos solicitantes interessados
    paginaInteressados: async (req, res) => {
        try {
            const idUsuario = req.usuario.id

            const profissional = await usuarioModel.buscarProfissionalPorIdUsuario(idUsuario)
            if (!profissional) return res.status(404).json({ mensagem: "Profissional nao encontrado" })

            const idProfissional = profissional.id

            const interessadosBrutos = await usuarioModel.listarTodosInteressados(idProfissional)

            // Gera iniciais, localizacao e cor de avatar para cada interessado
            const coresAvatar = ['#d98a8a', '#8fc99a', '#7fc6c0', '#b39ddb', '#ffab91', '#9fa8da', '#f48fb1', '#90caf9']
            const interessados = interessadosBrutos.map((item, i) => {
                const nome = (item.nome || '').trim()
                const partesNome = nome.split(/\s+/)
                const iniciais = ((partesNome[0]?.[0] || '?') + (partesNome[1]?.[0] || '')).toUpperCase()
                const foto = (item.foto && item.foto.startsWith('/uploads/')) ? item.foto : null
                return {
                    ...item,
                    foto,
                    iniciais,
                    cidade: item.cidade || '',
                    estado: item.estado || '',
                    cor: coresAvatar[i % coresAvatar.length]
                }
            })

            const pendentes = interessados.filter(p => p.status === 'pendente').length

            res.render('profissional/interessados', {
                nome: req.usuario.nome,
                interessados,
                pendentes,
                paginaAtual: 'interessados'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar os interessados" })
        }
    },

    // ATUALIZA O STATUS DE UM INTERESSE (aceitar / recusar)
    atualizarStatusInteresse: async (req, res) => {
        try {
            const idUsuario = req.usuario.id
            const idInteresse = req.params.id
            const { status } = req.body

            const statusValidos = ['aceito', 'recusado', 'pendente']
            if (!statusValidos.includes(status)) {
                return res.status(400).json({ mensagem: "Status invalido" })
            }

            const profissional = await usuarioModel.buscarProfissionalPorIdUsuario(idUsuario)
            if (!profissional) return res.status(404).json({ mensagem: "Profissional nao encontrado" })

            await usuarioModel.atualizarStatusInteresse(idInteresse, profissional.id, status)

            res.redirect("/dashboard/interessados")
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao atualizar o interesse" })
        }
    },

    // MEU PERFIL DO PROFISSIONAL - visualizacao do proprio perfil
    meuPerfil: async (req, res) => {
        try {
            const perfil = await usuarioModel.buscarPerfilProfissional(req.usuario.id)
            if (!perfil) return res.status(404).json({ mensagem: "Profissional nao encontrado" })

            const nome = (perfil.nome || '').trim()
            const partesNome = nome.split(/\s+/)
            const iniciais = (partesNome[0][0] + (partesNome[1]?.[0] || '')).toUpperCase()
            const localizacao = [perfil.cidade, perfil.estado].filter(Boolean).join(' - ') || '-'
            const foto = (perfil.foto && perfil.foto.startsWith('/uploads/')) ? perfil.foto : null

            res.render('profissional/perfil', {
                perfil,
                iniciais,
                localizacao,
                foto,
                paginaAtual: 'perfil'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar o perfil" })
        }
    },

    // FORMULARIO DE EDICAO DO PERFIL DO PROFISSIONAL
    editarPerfilForm: async (req, res) => {
        try {
            const perfil = await usuarioModel.buscarPerfilProfissional(req.usuario.id)
            if (!perfil) return res.status(404).json({ mensagem: "Profissional nao encontrado" })

            const nome = (perfil.nome || '').trim()
            const partesNome = nome.split(/\s+/)
            const iniciais = (partesNome[0][0] + (partesNome[1]?.[0] || '')).toUpperCase()
            const foto = (perfil.foto && perfil.foto.startsWith('/uploads/')) ? perfil.foto : null

            // Formata a data para o input type=date (YYYY-MM-DD)
            let dataNascimento = ''
            if (perfil.data_de_nascimento) {
                const d = new Date(perfil.data_de_nascimento)
                dataNascimento = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            }

            const areas = ['Intérprete de Libras', 'Tradutor de Libras', 'Guia-Intérprete', 'Instrutor de Libras']

            res.render('profissional/editar-perfil', {
                perfil,
                iniciais,
                foto,
                dataNascimento,
                areas,
                paginaAtual: 'perfil'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar a edicao do perfil" })
        }
    },

    // SALVA AS ALTERACOES DO PERFIL DO PROFISSIONAL
    atualizarPerfil: async (req, res) => {
        try {
            const idUsuario = req.usuario.id
            const { nome, email, telefone, data_de_nascimento, area_de_atuacao, sobre, disponibilidade } = req.body
            const foto = req.file ? `/uploads/usuarios/${req.file.filename}` : null

            // Se trocou o email, garante que ainda nao existe em outra conta
            if (email) {
                const existente = await usuarioModel.buscarPorEmail(email)
                if (existente && existente.id !== idUsuario) {
                    return res.status(400).json({ mensagem: "Email ja cadastrado em outra conta" })
                }
                await usuarioModel.atualizarEmailUsuario(idUsuario, email)
            }

            await usuarioModel.atualizarPerfilProfissional(idUsuario, {
                nome, telefone, data_de_nascimento, area_de_atuacao, sobre, disponibilidade, foto
            })

            res.redirect("/meu-perfil")
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao salvar o perfil" })
        }
    },

    // TELA DE CERTIFICADOS E CREDENCIAIS DO PROFISSIONAL
    certificadosForm: async (req, res) => {
        try {
            const profissional = await usuarioModel.buscarProfissionalPorIdUsuario(req.usuario.id)
            if (!profissional) return res.status(404).json({ mensagem: "Profissional nao encontrado" })

            const labelStatus = { pendente: 'em análise', aprovado: 'verificado', recusado: 'recusado' }
            const brutos = await usuarioModel.listarCertificadosProfissional(profissional.id)

            const certificados = brutos.map(cert => {
                const arquivo = (cert.anexo || '').split('/').pop()
                const ext = arquivo.split('.').pop().toLowerCase()
                return {
                    ...cert,
                    arquivo,
                    isPdf: ext === 'pdf',
                    statusLabel: labelStatus[cert.status] || 'em análise',
                    statusClasse: cert.status === 'aprovado' ? 'verificado' : cert.status === 'recusado' ? 'recusado' : 'analise',
                    dataFormatada: cert.data_envio ? new Date(cert.data_envio).toLocaleDateString('pt-BR') : ''
                }
            })

            res.render('profissional/certificados', {
                certificados,
                paginaAtual: 'perfil'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar os certificados" })
        }
    },

    // ENVIO DE UM NOVO CERTIFICADO (fica como 'pendente' ate o ADM aprovar)
    enviarCertificado: async (req, res) => {
        try {
            const profissional = await usuarioModel.buscarProfissionalPorIdUsuario(req.usuario.id)
            if (!profissional) return res.status(404).json({ mensagem: "Profissional nao encontrado" })

            const { titulo } = req.body
            if (!req.file) return res.status(400).json({ mensagem: "Nenhum arquivo enviado" })
            if (!titulo || !titulo.trim()) return res.status(400).json({ mensagem: "Informe o nome do certificado" })

            const anexo = `/uploads/certificados/${req.file.filename}`
            await usuarioModel.criarCertificado(profissional.id, titulo.trim(), anexo)

            res.redirect("/meu-perfil/certificados")
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao enviar o certificado" })
        }
    },

    // HOME DO SOLICITANTE - vitrine com o total de interesses demonstrados
    homeSolicitante: async (req, res) => {
        try {
            const solicitante = await usuarioModel.buscarSolicitantePorIdUsuario(req.usuario.id)
            const totalInteresses = solicitante
                ? await usuarioModel.contarInteressesDoSolicitante(solicitante.id)
                : 0

            res.render('solicitante/home', {
                totalInteresses,
                paginaAtual: 'home'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar a home do solicitante" })
        }
    },

    // PAGINA DE BUSCA DE PROFISSIONAIS (com filtros de texto, area e estado)
    paginaBuscar: async (req, res) => {
        try {
            const q = (req.query.q || '').trim()
            const area = req.query.area || ''
            const estado = req.query.estado || ''

            const [profissionaisBrutos, estados] = await Promise.all([
                usuarioModel.listarProfissionaisFiltrados({ q, area, estado }),
                usuarioModel.listarEstadosProfissionais()
            ])

            const coresAvatar = ['#d98a8a', '#8f6fce', '#7ed3a0', '#3a8fc7', '#e0a458', '#ce7fb0']
            const profissionais = profissionaisBrutos.map((item, i) => {
                const nome = (item.nome || '').trim()
                const partesNome = nome.split(/\s+/)
                const iniciais = ((partesNome[0]?.[0] || '?') + (partesNome[1]?.[0] || '')).toUpperCase()
                const localizacao = [item.cidade, item.estado].filter(Boolean).join(' - ') || '-'
                const foto = (item.foto && item.foto.startsWith('/uploads/')) ? item.foto : null
                return { ...item, iniciais, localizacao, foto, cor: coresAvatar[i % coresAvatar.length] }
            })

            // Areas de atuacao para os botoes de filtro (valor = ENUM do banco)
            const areas = [
                { value: 'Intérprete de Libras', label: 'Intérprete' },
                { value: 'Guia-Intérprete', label: 'Guia-Intérprete' },
                { value: 'Tradutor de Libras', label: 'Tradutor' },
                { value: 'Instrutor de Libras', label: 'Instrutor' }
            ]

            res.render('solicitante/buscar', {
                profissionais,
                estados,
                areas,
                filtros: { q, area, estado },
                paginaAtual: 'buscar'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar a busca de profissionais" })
        }
    },

    // REGISTRA O INTERESSE DO SOLICITANTE EM UM PROFISSIONAL
    demonstrarInteresse: async (req, res) => {
        try {
            const solicitante = await usuarioModel.buscarSolicitantePorIdUsuario(req.usuario.id)
            if (!solicitante) return res.status(404).json({ mensagem: "Solicitante nao encontrado" })

            await usuarioModel.registrarInteresse(solicitante.id, req.params.id)

            res.redirect(req.get('Referer') || '/buscar')
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao registrar o interesse" })
        }
    },

    // PAGINA DE INTERESSES - profissionais em que o solicitante demonstrou interesse
    paginaInteresses: async (req, res) => {
        try {
            const solicitante = await usuarioModel.buscarSolicitantePorIdUsuario(req.usuario.id)
            if (!solicitante) return res.status(404).json({ mensagem: "Solicitante nao encontrado" })

            const brutos = await usuarioModel.listarInteressesDoSolicitante(solicitante.id)

            const coresAvatar = ['#d98a8a', '#8f6fce', '#7ed3a0', '#3a8fc7', '#e0a458', '#ce7fb0']
            const interesses = brutos.map((item, i) => {
                const nome = (item.nome || '').trim()
                const partesNome = nome.split(/\s+/)
                const iniciais = ((partesNome[0]?.[0] || '?') + (partesNome[1]?.[0] || '')).toUpperCase()
                const localizacao = [item.cidade, item.estado].filter(Boolean).join(' - ') || '-'
                const foto = (item.foto && item.foto.startsWith('/uploads/')) ? item.foto : null
                return { ...item, iniciais, localizacao, foto, cor: coresAvatar[i % coresAvatar.length] }
            })

            res.render('solicitante/interesses', {
                interesses,
                paginaAtual: 'interesses'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar os interesses" })
        }
    },

    // VISUALIZACAO PUBLICA DO PERFIL DE UM PROFISSIONAL (acessada pelo solicitante)
    verPerfilProfissional: async (req, res) => {
        try {
            const perfil = await usuarioModel.buscarProfissionalPorId(req.params.id)
            if (!perfil) return res.status(404).json({ mensagem: "Profissional nao encontrado" })

            const nome = (perfil.nome || '').trim()
            const partesNome = nome.split(/\s+/)
            const iniciais = ((partesNome[0]?.[0] || '?') + (partesNome[1]?.[0] || '')).toUpperCase()
            const localizacao = [perfil.cidade, perfil.estado].filter(Boolean).join(' - ') || '-'
            const foto = (perfil.foto && perfil.foto.startsWith('/uploads/')) ? perfil.foto : null

            // Certificados aprovados (credenciais publicas do profissional)
            const brutos = await usuarioModel.listarCertificadosProfissional(perfil.id)
            const certificados = brutos
                .filter(cert => cert.status === 'aprovado')
                .map(cert => {
                    const arquivo = (cert.anexo || '').split('/').pop()
                    const ext = arquivo.split('.').pop().toLowerCase()
                    return {
                        ...cert,
                        arquivo,
                        isPdf: ext === 'pdf',
                        dataFormatada: cert.data_envio ? new Date(cert.data_envio).toLocaleDateString('pt-BR') : ''
                    }
                })

            res.render('solicitante/perfil-profissional', {
                perfil,
                iniciais,
                localizacao,
                foto,
                certificados,
                paginaAtual: 'buscar'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar o perfil do profissional" })
        }
    },

    // FORMULARIO DE EDICAO DO PERFIL DO SOLICITANTE
    editarPerfilSolicitante: async (req, res) => {
        try {
            const perfil = await usuarioModel.buscarPerfilSolicitante(req.usuario.id)
            if (!perfil) return res.status(404).json({ mensagem: "Solicitante nao encontrado" })

            const nome = (perfil.nome || '').trim()
            const partesNome = nome.split(/\s+/)
            const iniciais = ((partesNome[0]?.[0] || '?') + (partesNome[1]?.[0] || '')).toUpperCase()
            const foto = (perfil.foto && perfil.foto.startsWith('/uploads/')) ? perfil.foto : null

            // Formata a data para o input type=date (YYYY-MM-DD)
            let dataNascimento = ''
            if (perfil.data_de_nascimento) {
                const d = new Date(perfil.data_de_nascimento)
                dataNascimento = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            }

            res.render('solicitante/editar-perfil', {
                perfil,
                iniciais,
                foto,
                dataNascimento,
                paginaAtual: 'perfil'
            })
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao carregar a edicao do perfil" })
        }
    },

    // SALVA AS ALTERACOES DO PERFIL DO SOLICITANTE
    atualizarPerfilSolicitanteAcao: async (req, res) => {
        try {
            const idUsuario = req.usuario.id
            const { nome, email, telefone, data_de_nascimento, estado, cidade, senha, confirmar_senha } = req.body
            const foto = req.file ? `/uploads/usuarios/${req.file.filename}` : null

            // Se trocou o email, garante que ainda nao existe em outra conta
            if (email) {
                const existente = await usuarioModel.buscarPorEmail(email)
                if (existente && existente.id !== idUsuario) {
                    return res.status(400).json({ mensagem: "Email ja cadastrado em outra conta" })
                }
                await usuarioModel.atualizarEmailUsuario(idUsuario, email)
            }

            // Troca de senha (opcional): so atualiza se preencheu os campos
            if (senha) {
                if (senha !== confirmar_senha) {
                    return res.status(400).json({ mensagem: "As senhas nao coincidem" })
                }
                const senhaCriptografada = await bcrypt.hash(senha, 10)
                await usuarioModel.atualizarSenhaUsuario(idUsuario, senhaCriptografada)
            }

            await usuarioModel.atualizarPerfilSolicitante(idUsuario, {
                nome, telefone, data_de_nascimento, estado, cidade, foto
            })

            res.redirect("/meu-perfil")
        } catch (erro) {
            console.error(erro)
            res.status(500).json({ mensagem: "Erro ao salvar o perfil" })
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
