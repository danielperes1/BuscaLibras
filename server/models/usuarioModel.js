const db = require("../config/db.js")

module.exports = {
    buscarPorEmail: async (email) => {
        const query = 'SELECT * FROM usuarios WHERE email = ?'
        const [linhas] = await db.execute(query, [email])
        return linhas[0]
    },

    criarUsuario: async (email, senha, perfil) => {
        const query = 'INSERT INTO usuarios (email, senha, perfil) VALUES (?, ?, ?)'
        const [resultado] = await db.execute(query, [email, senha, perfil])
        return resultado.insertId
    },

    criarProfissional: async (nome, telefone, data_de_nascimento, pergunta_rec_senha, resposta_rec_senha, area_de_atuacao, estado, cidade, foto, id_usuario) => {
        const query = `INSERT INTO profissional
            (nome, telefone, data_de_nascimento, pergunta_rec_senha, resposta_rec_senha, area_de_atuacao, estado, cidade, foto, id_usuario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        const [resultado] = await db.execute(query, [nome, telefone, data_de_nascimento, pergunta_rec_senha, resposta_rec_senha, area_de_atuacao, estado, cidade, foto, id_usuario])
        return resultado.insertId
    },

    buscarNomePorIdUsuario: async (id_usuario, perfil) => {
        if (perfil === 'profissional') {
            const [rows] = await db.execute('SELECT nome FROM profissional WHERE id_usuario = ?', [id_usuario])
            return rows[0]?.nome || null
        }
        if (perfil === 'solicitante') {
            const [rows] = await db.execute('SELECT nome FROM solicitante WHERE id_usuario = ?', [id_usuario])
            return rows[0]?.nome || null
        }
        return null
    },

    criarSolicitante: async (nome, telefone, data_de_nascimento, estado, cidade, pergunta_rec_senha, resposta_rec_senha, foto, id_usuario) => {
        const query = `INSERT INTO solicitante
            (nome, telefone, data_de_nascimento, estado, cidade, pergunta_rec_senha, resposta_rec_senha, foto, id_usuario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        const [resultado] = await db.execute(query, [nome, telefone, data_de_nascimento, estado, cidade, pergunta_rec_senha, resposta_rec_senha, foto, id_usuario])
        return resultado.insertId
    },

    // Conta quantos usuarios existem com o perfil informado
    contarPorPerfil: async (perfil) => {
        const query = 'SELECT COUNT(*) AS total FROM usuarios WHERE perfil = ?'
        const [linhas] = await db.execute(query, [perfil])
        return linhas[0].total
    },

    // Lista profissionais e solicitantes com os dados exibidos na dashboard do admin
    listarUsuariosCompletos: async () => {
        const query = `
            SELECT u.id, u.email, u.perfil, u.status, u.data_cadastro,
                   COALESCE(p.nome, s.nome) AS nome,
                   p.area_de_atuacao
            FROM usuarios u
            LEFT JOIN profissional p ON p.id_usuario = u.id
            LEFT JOIN solicitante s ON s.id_usuario = u.id
            WHERE u.perfil != 'administrador'
            ORDER BY u.data_cadastro DESC`
        const [linhas] = await db.execute(query)
        return linhas
    }
}
