import socket

from flask import Flask, jsonify, render_template

import db

app = Flask(__name__)

# Cria a base de dados e as tabelas (se ainda não existirem) sempre que o servidor arranca
db.criar_tabelas()

PORTA = 5000


@app.route("/")
def inicio():
    return render_template("index.html")


# Rota de teste: confirma que o servidor está a funcionar
@app.route("/api/saude")
def saude():
    return jsonify(estado="ok", mensagem="Caderneta escolar a funcionar")


# As rotas de alunos e ocorrências serão ligadas aqui no Passo 4


def endereco_na_rede():
    """Descobre o IP deste computador na rede local (para abrir noutros dispositivos)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))  # não envia nada, só descobre a interface
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


if __name__ == "__main__":
    print("\nCaderneta escolar iniciada!\n")
    print(f"  Neste computador:    http://localhost:{PORTA}")
    ip = endereco_na_rede()
    if ip:
        print(f"  Outros dispositivos: http://{ip}:{PORTA}")
    print("\nPara parar o servidor: Ctrl + C\n")

    # host="0.0.0.0" permite ligações de outros dispositivos da mesma rede
    app.run(host="0.0.0.0", port=PORTA, debug=False)
