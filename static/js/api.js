// Converte "2026-10-27" em "27/10/2026" (sem usar fusos horários, para não "saltar" de dia)
function formatarData(iso) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return partes ? partes[3] + "/" + partes[2] + "/" + partes[1] : iso || "";
}

// Funções para falar com o servidor. Usadas por todas as páginas.
const Api = {
  async pedir(metodo, url, dados) {
    const opcoes = { method: metodo, headers: {} };
    if (dados !== undefined) {
      opcoes.headers["Content-Type"] = "application/json";
      opcoes.body = JSON.stringify(dados);
    }

    let resposta;
    try {
      resposta = await fetch(url, opcoes);
    } catch (e) {
      throw new Error("Não foi possível ligar ao servidor. Verifique se está a funcionar.");
    }

    let corpo = null;
    try {
      corpo = await resposta.json();
    } catch (e) {
      // resposta sem JSON
    }

    if (!resposta.ok) {
      throw new Error((corpo && corpo.erro) || "Ocorreu um erro (" + resposta.status + ").");
    }
    return corpo;
  },

  get(url) { return this.pedir("GET", url); },
  post(url, dados) { return this.pedir("POST", url, dados); },
  put(url, dados) { return this.pedir("PUT", url, dados); },
  apagar(url) { return this.pedir("DELETE", url); },
};
