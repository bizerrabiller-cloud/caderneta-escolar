from flask import Blueprint, jsonify, request

import db

bp = Blueprint("ocorrencias", __name__, url_prefix="/api")

GRAVIDADES = ("leve", "media", "grave")


def erro(mensagem, codigo=400):
    return jsonify(erro=mensagem), codigo


def validar():
    """Lê e valida os dados de uma ocorrência. Devolve (dados, mensagem_de_erro)."""
    j = request.get_json(silent=True) or {}

    def texto(campo):
        return str(j.get(campo, "")).strip()

    dados = {
        "data": texto("data"),
        "tipo": texto("tipo"),
        "gravidade": texto("gravidade") or "leve",
        "descricao": texto("descricao"),
        "medida_tomada": texto("medida_tomada") or None,
    }
    if not dados["data"]:
        return None, "A data é obrigatória."
    if not dados["tipo"]:
        return None, "O tipo de ocorrência é obrigatório."
    if not dados["descricao"]:
        return None, "A descrição é obrigatória."
    if dados["gravidade"] not in GRAVIDADES:
        return None, "A gravidade deve ser: leve, media ou grave."
    return dados, None


@bp.get("/alunos/<int:aluno_id>/ocorrencias")
def listar(aluno_id):
    """Ocorrências de um aluno, da mais recente para a mais antiga."""
    with db.ligar() as bd:
        if bd.execute("SELECT 1 FROM alunos WHERE id = ?", (aluno_id,)).fetchone() is None:
            return erro("Aluno não encontrado.", 404)
        linhas = bd.execute(
            "SELECT * FROM ocorrencias WHERE aluno_id = ? ORDER BY data DESC, id DESC",
            (aluno_id,),
        ).fetchall()
    return jsonify([dict(l) for l in linhas])


@bp.post("/alunos/<int:aluno_id>/ocorrencias")
def criar(aluno_id):
    dados, mensagem = validar()
    if mensagem:
        return erro(mensagem)

    with db.ligar() as bd:
        if bd.execute("SELECT 1 FROM alunos WHERE id = ?", (aluno_id,)).fetchone() is None:
            return erro("Aluno não encontrado.", 404)
        cursor = bd.execute(
            """INSERT INTO ocorrencias (aluno_id, data, tipo, gravidade, descricao, medida_tomada)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (aluno_id, dados["data"], dados["tipo"], dados["gravidade"],
             dados["descricao"], dados["medida_tomada"]),
        )
        ocorrencia = bd.execute(
            "SELECT * FROM ocorrencias WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return jsonify(dict(ocorrencia)), 201


@bp.put("/ocorrencias/<int:ocorrencia_id>")
def atualizar(ocorrencia_id):
    dados, mensagem = validar()
    if mensagem:
        return erro(mensagem)

    with db.ligar() as bd:
        cursor = bd.execute(
            """UPDATE ocorrencias
               SET data = ?, tipo = ?, gravidade = ?, descricao = ?, medida_tomada = ?
               WHERE id = ?""",
            (dados["data"], dados["tipo"], dados["gravidade"],
             dados["descricao"], dados["medida_tomada"], ocorrencia_id),
        )
        if cursor.rowcount == 0:
            return erro("Ocorrência não encontrada.", 404)
        ocorrencia = bd.execute(
            "SELECT * FROM ocorrencias WHERE id = ?", (ocorrencia_id,)
        ).fetchone()
    return jsonify(dict(ocorrencia))


@bp.delete("/ocorrencias/<int:ocorrencia_id>")
def apagar(ocorrencia_id):
    with db.ligar() as bd:
        cursor = bd.execute("DELETE FROM ocorrencias WHERE id = ?", (ocorrencia_id,))
    if cursor.rowcount == 0:
        return erro("Ocorrência não encontrada.", 404)
    return jsonify(mensagem="Ocorrência apagada.")
