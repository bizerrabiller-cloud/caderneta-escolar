// Página inicial: lista, pesquisa e registo de alunos.
const campoPesquisa = document.getElementById("pesquisa");
const lista = document.getElementById("lista");
const contagem = document.getElementById("contagem");
const aviso = document.getElementById("aviso");

const dialogo = document.getElementById("dialogo");
const formulario = document.getElementById("formulario");
const erroForm = document.getElementById("erro-form");
const btnGuardar = document.getElementById("btn-guardar");

let pedidoAtual = 0;   // evita mostrar resultados antigos se o utilizador escrever depressa
let temporizador = null;

function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;  // textContent evita problemas de segurança
  return el;
}

function desenhar(alunos, pesquisando) {
  lista.replaceChildren();

  if (alunos.length === 0) {
    const vazio = criar("li", "vazio",
      pesquisando
        ? "Nenhum aluno encontrado para esta pesquisa."
        : "Ainda não há alunos registados. Use o botão “+ Novo aluno”.");
    lista.append(vazio);
    contagem.textContent = "";
    return;
  }

  contagem.textContent = alunos.length === 1 ? "1 aluno" : alunos.length + " alunos";

  for (const a of alunos) {
    const li = criar("li");
    const ligacao = criar("a", "cartao-aluno");
    ligacao.href = "/aluno/" + a.id;

    const info = criar("div");
    info.append(criar("strong", "", a.nome));

    const partes = [];
    if (a.classe) partes.push(a.classe + " classe");
    if (a.turma) partes.push("Turma " + a.turma);
    if (a.numero_processo) partes.push("Proc. " + a.numero_processo);
    if (partes.length) info.append(criar("small", "", partes.join(" · ")));

    const n = a.total_ocorrencias;
    const selo = criar("span", n > 0 ? "selo com-ocorrencias" : "selo",
      n === 0 ? "Sem ocorrências" : n === 1 ? "1 ocorrência" : n + " ocorrências");

    ligacao.append(info, selo);
    li.append(ligacao);
    lista.append(li);
  }
}

async function carregar() {
  const termo = campoPesquisa.value.trim();
  const numero = ++pedidoAtual;
  try {
    const alunos = await Api.get("/api/alunos?q=" + encodeURIComponent(termo));
    if (numero !== pedidoAtual) return;  // chegou uma resposta mais recente entretanto
    aviso.hidden = true;
    desenhar(alunos, termo !== "");
  } catch (e) {
    if (numero !== pedidoAtual) return;
    aviso.textContent = e.message;
    aviso.hidden = false;
  }
}

// Pesquisa enquanto escreve (espera um instante depois da última tecla)
campoPesquisa.addEventListener("input", () => {
  clearTimeout(temporizador);
  temporizador = setTimeout(carregar, 250);
});

// ---------- Novo aluno ----------
document.getElementById("btn-novo").addEventListener("click", () => {
  formulario.reset();
  erroForm.hidden = true;
  dialogo.showModal();
  formulario.elements.nome.focus();
});

document.getElementById("btn-cancelar").addEventListener("click", () => dialogo.close());

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  erroForm.hidden = true;

  const dados = Object.fromEntries(new FormData(formulario).entries());
  btnGuardar.disabled = true;
  try {
    await Api.post("/api/alunos", dados);
    dialogo.close();
    campoPesquisa.value = "";
    await carregar();
  } catch (e) {
    erroForm.textContent = e.message;
    erroForm.hidden = false;
  } finally {
    btnGuardar.disabled = false;
  }
});

carregar();
