import os
import sqlite3

PASTA = os.path.dirname(os.path.abspath(__file__))
CAMINHO_BD = os.path.join(PASTA, "data", "caderneta.db")


def ligar():
    """Abre uma ligação à base de dados. Os resultados podem ser lidos pelo nome da coluna."""
    ligacao = sqlite3.connect(CAMINHO_BD)
    ligacao.row_factory = sqlite3.Row
    ligacao.execute("PRAGMA foreign_keys = ON")  # garante que cada ocorrência pertence a um aluno
    return ligacao


def criar_tabelas():
    """Cria as tabelas se ainda não existirem. Pode ser chamada sempre que o servidor arranca."""
    os.makedirs(os.path.dirname(CAMINHO_BD), exist_ok=True)
    with ligar() as bd:
        bd.executescript(
            """
            CREATE TABLE IF NOT EXISTS alunos (
                id                    INTEGER PRIMARY KEY AUTOINCREMENT,
                nome                  TEXT NOT NULL,
                numero_processo       TEXT,
                data_nascimento       TEXT,
                genero                TEXT,
                classe                TEXT,
                turma                 TEXT,
                encarregado_nome      TEXT,
                encarregado_telefone  TEXT,
                morada                TEXT,
                observacoes           TEXT,
                criado_em             TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );

            CREATE TABLE IF NOT EXISTS ocorrencias (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                aluno_id        INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
                data            TEXT NOT NULL,
                tipo            TEXT NOT NULL,
                gravidade       TEXT NOT NULL DEFAULT 'leve',
                descricao       TEXT NOT NULL,
                medida_tomada   TEXT,
                criado_em       TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            );

            CREATE INDEX IF NOT EXISTS idx_alunos_nome ON alunos(nome);
            CREATE INDEX IF NOT EXISTS idx_ocorrencias_aluno ON ocorrencias(aluno_id);
            """
        )


if __name__ == "__main__":
    criar_tabelas()
    print("Base de dados pronta em:", CAMINHO_BD)
