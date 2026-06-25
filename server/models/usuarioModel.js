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

    // Busca os dados completos do profissional a partir do id do usuario logado
    buscarProfissionalPorIdUsuario: async (id_usuario) => {
        const [linhas] = await db.execute('SELECT * FROM profissional WHERE id_usuario = ?', [id_usuario])
        return linhas[0]
    },

    // Busca o perfil do profissional junto com o email da tabela usuarios
    buscarPerfilProfissional: async (id_usuario) => {
        const query = `
            SELECT p.*, u.email
            FROM profissional p
            JOIN usuarios u ON u.id = p.id_usuario
            WHERE p.id_usuario = ?`
        const [linhas] = await db.execute(query, [id_usuario])
        return linhas[0]
    },

    // Atualiza os dados do perfil do profissional
    atualizarPerfilProfissional: async (id_usuario, dados) => {
        const query = `
            UPDATE profissional SET
                nome = ?,
                telefone = ?,
                data_de_nascimento = ?,
                area_de_atuacao = ?,
                sobre = ?,
                disponibilidade = ?
                ${dados.foto ? ', foto = ?' : ''}
            WHERE id_usuario = ?`

        const valores = [
            dados.nome ?? null,
            dados.telefone ?? null,
            dados.data_de_nascimento || null,
            dados.area_de_atuacao ?? null,
            dados.sobre ?? null,
            dados.disponibilidade ?? null
        ]
        if (dados.foto) valores.push(dados.foto)
        valores.push(id_usuario)

        await db.execute(query, valores)
    },

    // Atualiza o email na tabela de login (usuarios)
    atualizarEmailUsuario: async (id_usuario, email) => {
        await db.execute('UPDATE usuarios SET email = ? WHERE id = ?', [email, id_usuario])
    },

    // Lista os certificados de um profissional com o status da aprovacao
    listarCertificadosProfissional: async (id_profissional) => {
        const query = `
            SELECT c.id, c.titulo, c.anexo, c.data_envio,
                   COALESCE(a.status, 'pendente') AS status
            FROM certificado c
            LEFT JOIN aprovacao a ON a.certificado_id = c.id
            WHERE c.id_profissional = ?
            ORDER BY c.data_envio DESC, c.id DESC`
        const [linhas] = await db.execute(query, [id_profissional])
        return linhas
    },

    // Cria um certificado e ja registra a aprovacao como 'pendente'
    criarCertificado: async (id_profissional, titulo, anexo) => {
        const [resultado] = await db.execute(
            'INSERT INTO certificado (id_profissional, titulo, anexo) VALUES (?, ?, ?)',
            [id_profissional, titulo, anexo]
        )
        const idCertificado = resultado.insertId

        await db.execute(
            'INSERT INTO aprovacao (id_profissional, status, certificado_id) VALUES (?, ?, ?)',
            [id_profissional, 'pendente', idCertificado]
        )
        return idCertificado
    },

    // Conta o total de interesses recebidos por um profissional
    contarInteressesPorProfissional: async (id_profissional) => {
        const [linhas] = await db.execute(
            'SELECT COUNT(*) AS total FROM interesse WHERE id_profissional = ?',
            [id_profissional]
        )
        return linhas[0].total
    },

    // Conta os interesses recebidos hoje por um profissional
    contarInteressesHoje: async (id_profissional) => {
        const [linhas] = await db.execute(
            'SELECT COUNT(*) AS total FROM interesse WHERE id_profissional = ? AND DATE(data_interesse) = CURDATE()',
            [id_profissional]
        )
        return linhas[0].total
    },

    // Conta os interesses de um profissional agrupados por status (aceito, pendente, recusado)
    contarInteressesPorStatus: async (id_profissional) => {
        const [linhas] = await db.execute(
            `SELECT status, COUNT(*) AS total
             FROM interesse
             WHERE id_profissional = ?
             GROUP BY status`,
            [id_profissional]
        )
        const contagem = { aceito: 0, pendente: 0, recusado: 0 }
        linhas.forEach(l => { contagem[l.status] = l.total })
        return contagem
    },

    // Lista os interessados mais recentes de um profissional (com dados do solicitante)
    listarInteressadosRecentes: async (id_profissional, limite = 3) => {
        const query = `
            SELECT i.id, i.status, i.data_interesse,
                   s.nome, s.foto, s.cidade, s.estado
            FROM interesse i
            JOIN solicitante s ON s.id = i.id_solicitante
            WHERE i.id_profissional = ?
            ORDER BY i.data_interesse DESC
            LIMIT ?`
        const [linhas] = await db.query(query, [id_profissional, limite])
        return linhas
    },

    // Lista todos os interessados de um profissional (com dados do solicitante)
    listarTodosInteressados: async (id_profissional) => {
        const query = `
            SELECT i.id, i.status, i.data_interesse,
                   s.nome, s.foto, s.cidade, s.estado
            FROM interesse i
            JOIN solicitante s ON s.id = i.id_solicitante
            WHERE i.id_profissional = ?
            ORDER BY i.data_interesse DESC`
        const [linhas] = await db.execute(query, [id_profissional])
        return linhas
    },

    // Atualiza o status de um interesse (aceito / recusado / pendente),
    // garantindo que ele pertence ao profissional informado
    atualizarStatusInteresse: async (id_interesse, id_profissional, status) => {
        const [resultado] = await db.execute(
            'UPDATE interesse SET status = ? WHERE id = ? AND id_profissional = ?',
            [status, id_interesse, id_profissional]
        )
        return resultado.affectedRows > 0
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
