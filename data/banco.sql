-- Deleta o banco de dados
DROP DATABASE sistema_buscalibras;

-- Cria o banco de dados sistema_trocas
create database if not exists sistema_buscalibras;

-- Utilizo o banco criado
use sistema_buscalibras;

-- Deleta as tabelas antigas caso existam
DROP TABLE IF EXISTS aprovacao;
drop table if exists certificado;
drop table if exists interesse;
drop table if exists solicitante;
drop table if exists profissional;
drop table if exists usuarios;

-- Tabela usuarios
create table usuarios(
id int auto_increment primary key,
email varchar(100),
senha varchar(255),
perfil ENUM('administrador', 'solicitante', 'profissional'),
status ENUM('ativo', 'inativo') DEFAULT 'ativo',
data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela usuarios
create table profissional(
id int auto_increment primary key,
nome varchar(100),
telefone varchar(20),
data_de_nascimento date,
pergunta_rec_senha ENUM('Qual o nome da sua mãe?', 'Qual o nome do seu primeiro pet?', 'Qual o nome do jogador de futebol preferido?') not null,
resposta_rec_senha varchar (255) not null,
area_de_atuacao ENUM('Intérprete de Libras', 'Tradutor de Libras', 'Guia-Intérprete', 'Instrutor de Libras'),
estado varchar (255),
cidade varchar (255),
foto varchar(255),
id_usuario int,
foreign key (id_usuario) references usuarios(id)
);


create table solicitante(
id int auto_increment primary key,
nome varchar(100),
telefone varchar(20),
data_de_nascimento date,
estado varchar(255),
cidade varchar(255),
pergunta_rec_senha ENUM('Qual o nome da sua mãe?', 'Qual o nome do seu primeiro pet?', 'Qual o nome do jogador de futebol preferido?') not null,
resposta_rec_senha varchar (255) not null,
foto varchar(255),
id_usuario int,
foreign key (id_usuario) references usuarios(id)

);

-- Tabela interesse
create table interesse(
id int auto_increment primary key,
id_solicitante int,
id_profissional int,
foreign key (id_profissional) references profissional(id),
foreign key (id_solicitante) references solicitante(id)

);

create table certificado(
id int auto_increment primary key,
id_profissional int,
foreign key (id_profissional) references profissional(id),
titulo text not null,
anexo varchar(255)
);

create table aprovacao(
id int auto_increment primary key,
id_profissional int,
status ENUM('pendente', 'aprovado', 'recusado'),
certificado_id int,
foreign key (id_profissional) references profissional(id),
foreign key (certificado_id) references certificado(id)
);



-- Senhas: admin123, joao456, maria123 (hash bcrypt 10 rounds)

-- 1) ADMINISTRADOR (só precisa estar em 'usuarios')
INSERT INTO usuarios (email, senha, perfil) VALUES
('admin@buscalibras.com', '$2a$10$qQLXMbhiKxmsPcXtULeg0.H7ngkqzCGJPsYXHv9V4dT1CJsoyourq', 'administrador');


-- ============================================
-- 2) SOLICITANTE
-- ============================================
-- Cria o login
INSERT INTO usuarios (email, senha, perfil) VALUES
('joao.solicitante@gmail.com', '$2a$10$EK781yx0ZabAdfHEut2KIuk9b2Pq8PhZVMm6x/KFiyvE0/2xjCiZ.', 'solicitante');

-- Cria o perfil vinculado ao usuário recém-criado
INSERT INTO solicitante
(nome, data_de_nascimento, pergunta_rec_senha, resposta_rec_senha, foto, id_usuario)
VALUES
('João da Silva', '1995-04-12',
 'Qual o nome do seu primeiro pet?', 'Rex',
 'joao.jpg', LAST_INSERT_ID());


-- ============================================
-- 3) PROFISSIONAL
-- ============================================
-- Cria o login
INSERT INTO usuarios (email, senha, perfil) VALUES
('maria@gmail.com', '$2a$10$hVzmAhT7OCj.Kjg.VuBH..az9CgnD0qLZZfG597canPv4N5LG2Ud.', 'profissional');

-- Cria o perfil vinculado ao usuário recém-criado
INSERT INTO profissional 
(nome, telefone, data_de_nascimento, pergunta_rec_senha, resposta_rec_senha, 
 area_de_atuacao, estado, cidade, foto, id_usuario) 
VALUES
('Maria Oliveira', '(27) 99999-8888', '1988-07-25', 
 'Qual o nome da sua mãe?', 'Ana', 
 'Intérprete de Libras', 'ES', 'Vitória', 
 'maria.jpg', LAST_INSERT_ID()
 );


/*
-- Ver solicitantes com seu login
SELECT s.nome, u.email, u.senha, u.perfil
FROM solicitante s
JOIN usuarios u ON s.id_usuario = u.id;

-- Ver profissionais com seu login
SELECT p.nome, p.cidade, u.email, u.senha, u.perfil
FROM profissional p
JOIN usuarios u ON p.id_usuario = u.id;

-- Ver todos os usuários
SELECT * FROM usuarios;

*/







