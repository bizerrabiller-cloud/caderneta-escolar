// Ficha do aluno: mostrar, editar e apagar os dados do aluno.
const idAluno = document.body.dataset.alunoId;

const blocoAluno = document.getElementById("bloco-aluno");
const blocoOcorrencias = document.getElementById("bloco-ocorrencias");
const avisoFicha = document.getElementById("aviso");
const nomeEl = document.getElementById("aluno-nome");
const dadosEl = document.getElementById("aluno-dados");

const dialogoAluno = document.getElementById("dialogo-aluno");
const formAluno = document.getElementById("form-aluno");
const erroAluno = document.getElementById("erro-aluno");
const btnGuardarAluno = document.getElementById("guardar-aluno");

const CAMPOS = [
  ["classe", "Classe"],
  ["turma", "Turma"],
  ["numero_processo", "Nº de processo"],
  ["data_nascimento", "Data de nascimento"],
  ["genero", "Género"],
  ["encarregado_nome", "Encarregado de educação"],
  ["encarregado_telefone", "Telefone do encarregado"],
  ["morada", "Morada", true],
  ["observacoes", "Observações", true],
];

let aluno = null;

function mostrar(a) {
  aluno = a;
  document.title = a.nome + " · Caderneta Escolar";
  nomeEl.textContent = a.nome;
  dadosEl.replaceChildren();

  for (const [campo, rotulo, largo] of CAMPOS) {
    const valor = a[campo];
    if (!valor) continue;  // só mostra o que está preenchido

    const item = document.createElement("div");
    item.className = largo ? "item largo" : "item";
    const dt = document.createElement("dt");
    dt.textContent = rotulo;
    const dd = document.createElement("dd");

    if (campo === "encarregado_telefone") {
      const ligacao = document.createElement("a");
      ligacao.href = "tel:" + valor.replace(/[^\d+]/g, "");
      ligacao.textContent = valor;
      dd.append(ligacao);
    } else if (campo === "data_nascimento") {
      dd.textContent = formatarData(valor);
    } else {
      dd.textContent = valor;
    }
    item.append(dt, dd);
    dadosEl.append(item);
  }

  if (!dadosEl.children.length) {
    const p = document.createElement("p");
    p.className = "contagem";
    p.textContent = "Sem mais dados registados. Use “Editar” para os preencher.";
    dadosEl.append(p);
  }
}

async function carregarAluno() {
  try {
    mostrar(await Api.get("/api/alunos/" + idAluno));
    blocoAluno.hidden = false;
    blocoOcorrencias.hidden = false;
    document.dispatchEvent(new Event("aluno-carregado"));  // avisa o ocorrencias.js
  } catch (e) {
    avisoFicha.textContent = e.message;
    avisoFicha.hidden = false;
  }
}

// ---------- Editar ----------
document.getElementById("btn-editar-aluno").addEventListener("click", () => {
  for (const campo of formAluno.elements) {
    if (campo.name) campo.value = aluno[campo.name] || "";
  }
  erroAluno.hidden = true;
  dialogoAluno.showModal();
});

document.getElementById("cancelar-aluno").addEventListener("click", () => dialogoAluno.close());

formAluno.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  erroAluno.hidden = true;
  btnGuardarAluno.disabled = true;
  try {
    const dados = Object.fromEntries(new FormData(formAluno).entries());
    mostrar(await Api.put("/api/alunos/" + idAluno, dados));
    dialogoAluno.close();
  } catch (e) {
    erroAluno.textContent = e.message;
    erroAluno.hidden = false;
  } finally {
    btnGuardarAluno.disabled = false;
  }
});

// ---------- Apagar ----------
document.getElementById("btn-apagar-aluno").addEventListener("click", async () => {
  const pergunta =
    "Apagar o aluno “" + aluno.nome + "” e TODAS as suas ocorrências?\n\nEsta ação não pode ser desfeita.";
  if (!confirm(pergunta)) return;
  try {
    await Api.apagar("/api/alunos/" + idAluno);
    window.location.href = "/";
  } catch (e) {
    avisoFicha.textContent = e.message;
    avisoFicha.hidden = false;
  }
});

carregarAluno();
