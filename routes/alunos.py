from flask import Blueprint, jsonify, request

import db

bp = Blueprint("alunos", __name__, url_prefix="/api/alunos")

CAMPOS = [
    "nome",
    "numero_processo",
    "data_nascimento",
    "genero",
    "classe",
    "turma",
    "encarregado_nome",
    "encarregado_telefone",
    "morada",
    "observacoes",
]


def dados_do_pedido():
    """Lê o JSON enviado pelo site e limpa os espaços de cada campo."""
    dados = request.get_json(silent=True) or {}
    return {c: (str(dados.get(c, "")).strip() or None) for c in CAMPOS}


def erro(mensagem, codigo=400):
    return jsonify(erro=mensagem), codigo


@bp.get("")
def listar():
    """Lista alunos. Parâmetros opcionais: q (pesquisa), classe, turma."""
    q = request.args.get("q", "").strip()
    classe = request.args.get("classe", "").strip()
    turma = request.args.get("turma", "").strip()

    sql = """
        SELECT a.*,
               (SELECT COUNT(*) FROM ocorrencias o WHERE o.aluno_id = a.id) AS total_ocorrencias
        FROM alunos a
        WHERE 1 = 1
    """
    params = []

    if q:
        # Escapa os símbolos especiais do LIKE para a pesquisa ser literal
        termo = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        sql += """ AND (a.nome LIKE ? ESCAPE '\\'
                     OR a.numero_processo LIKE ? ESCAPE '\\'
                     OR a.encarregado_nome LIKE ? ESCAPE '\\') """
        params += [termo, termo, termo]
    if classe:
        sql += " AND a.classe = ?"
        params.append(classe)
    if turma:
        sql += " AND a.turma = ?"
        params.append(turma)

    sql += " ORDER BY a.nome COLLATE NOCASE"

    with db.ligar() as bd:
        linhas = bd.execute(sql, params).fetchall()
    return jsonify([dict(l) for l in linhas])


@bp.post("")
def criar():
    dados = dados_do_pedido()
    if not dados["nome"]:
        return erro("O nome do aluno é obrigatório.")

    colunas = ", ".join(CAMPOS)
    marcas = ", ".join("?" for _ in CAMPOS)
    with db.ligar() as bd:
        cursor = bd.execute(
            f"INSERT INTO alunos ({colunas}) VALUES ({marcas})",
            [dados[c] for c in CAMPOS],
        )
        aluno = bd.execute("SELECT * FROM alunos WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(dict(aluno)), 201


@bp.get("/<int:aluno_id>")
def obter(aluno_id):
    with db.ligar() as bd:
        aluno = bd.execute("SELECT * FROM alunos WHERE id = ?", (aluno_id,)).fetchone()
    if aluno is None:
        return erro("Aluno não encontrado.", 404)
    return jsonify(dict(aluno))


@bp.put("/<int:aluno_id>")
def atualizar(aluno_id):
    dados = dados_do_pedido()
    if not dados["nome"]:
        return erro("O nome do aluno é obrigatório.")

    atribuicoes = ", ".join(f"{c} = ?" for c in CAMPOS)
    with db.ligar() as bd:
        cursor = bd.execute(
            f"UPDATE alunos SET {atribuicoes} WHERE id = ?",
            [dados[c] for c in CAMPOS] + [aluno_id],
        )
        if cursor.rowcount == 0:
            return erro("Aluno não encontrado.", 404)
        aluno = bd.execute("SELECT * FROM alunos WHERE id = ?", (aluno_id,)).fetchone()
    return jsonify(dict(aluno))


@bp.delete("/<int:aluno_id>")
def apagar(aluno_id):
    """Apaga o aluno e, por consequência, todas as suas ocorrências."""
    with db.ligar() as bd:
        cursor = bd.execute("DELETE FROM alunos WHERE id = ?", (aluno_id,))
    if cursor.rowcount == 0:
        return erro("Aluno não encontrado.", 404)
    return jsonify(mensagem="Aluno apagado.")
