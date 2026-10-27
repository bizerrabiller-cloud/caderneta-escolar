// Ficha do aluno: registar, editar e apagar ocorrências.
// (Só começa a carregar quando o ficha.js avisar que o aluno existe.)
const alunoId = document.body.dataset.alunoId;

const listaOc = document.getElementById("lista-ocorrencias");
const contagemOc = document.getElementById("contagem-ocorrencias");
const avisoOc = document.getElementById("aviso-ocorrencias");

const dialogoOc = document.getElementById("dialogo-ocorrencia");
const formOc = document.getElementById("form-ocorrencia");
const tituloOc = document.getElementById("titulo-ocorrencia");
const erroOc = document.getElementById("erro-ocorrencia");
const btnGuardarOc = document.getElementById("guardar-ocorrencia");

const GRAVIDADES = { leve: "Leve", media: "Média", grave: "Grave" };

let ocorrencias = [];
let emEdicao = null;  // ocorrência que está a ser editada (null = nova)

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function hoje() {
  // Data de hoje no fuso do dispositivo, no formato AAAA-MM-DD
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

function desenhar() {
  listaOc.replaceChildren();

  if (ocorrencias.length === 0) {
    listaOc.append(el("li", "vazio", "Este aluno ainda não tem ocorrências registadas."));
    contagemOc.textContent = "";
    return;
  }
  contagemOc.textContent =
    ocorrencias.length === 1 ? "1 ocorrência" : ocorrencias.length + " ocorrências";

  for (const o of ocorrencias) {
    const gravidade = GRAVIDADES[o.gravidade] ? o.gravidade : "leve";
    const li = el("li", "ocorrencia " + gravidade);

    const topo = el("div", "ocorrencia-topo");
    const titulo = el("div");
    titulo.append(el("strong", "", o.tipo), el("small", "", formatarData(o.data)));
    topo.append(titulo, el("span", "selo selo-" + gravidade, GRAVIDADES[gravidade]));
    li.append(topo, el("p", "", o.descricao));

    if (o.medida_tomada) {
      const medida = el("p", "medida");
      medida.append(el("strong", "", "Medida tomada: "), document.createTextNode(o.medida_tomada));
      li.append(medida);
    }

    const acoes = el("div", "acoes-ocorrencia");
    const editar = el("button", "botao pequeno", "Editar");
    editar.type = "button";
    editar.addEventListener("click", () => abrirFormulario(o));
    const apagar = el("button", "botao pequeno perigo", "Apagar");
    apagar.type = "button";
    apagar.addEventListener("click", () => apagarOcorrencia(o));
    acoes.append(editar, apagar);
    li.append(acoes);

    listaOc.append(li);
  }
}

async function carregar() {
  try {
    ocorrencias = await Api.get("/api/alunos/" + alunoId + "/ocorrencias");
    avisoOc.hidden = true;
    desenhar();
  } catch (e) {
    avisoOc.textContent = e.message;
    avisoOc.hidden = false;
  }
}

function abrirFormulario(ocorrencia) {
  emEdicao = ocorrencia || null;
  formOc.reset();
  erroOc.hidden = true;
  tituloOc.textContent = emEdicao ? "Editar ocorrência" : "Nova ocorrência";

  if (emEdicao) {
    for (const campo of formOc.elements) {
      if (campo.name) campo.value = emEdicao[campo.name] || "";
    }
  } else {
    formOc.elements.data.value = hoje();
    formOc.elements.gravidade.value = "leve";
  }
  dialogoOc.showModal();
  (emEdicao ? formOc.elements.descricao : formOc.elements.tipo).focus();
}

async function apagarOcorrencia(o) {
  if (!confirm("Apagar a ocorrência “" + o.tipo + "” de " + formatarData(o.data) + "?")) return;
  try {
    await Api.apagar("/api/ocorrencias/" + o.id);
    await carregar();
  } catch (e) {
    avisoOc.textContent = e.message;
    avisoOc.hidden = false;
  }
}

document.getElementById("btn-nova-ocorrencia").addEventListener("click", () => abrirFormulario(null));
document.getElementById("cancelar-ocorrencia").addEventListener("click", () => dialogoOc.close());

formOc.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  erroOc.hidden = true;
  btnGuardarOc.disabled = true;
  try {
    const dados = Object.fromEntries(new FormData(formOc).entries());
    if (emEdicao) {
      await Api.put("/api/ocorrencias/" + emEdicao.id, dados);
    } else {
      await Api.post("/api/alunos/" + alunoId + "/ocorrencias", dados);
    }
    dialogoOc.close();
    await carregar();
  } catch (e) {
    erroOc.textContent = e.message;
    erroOc.hidden = false;
  } finally {
    btnGuardarOc.disabled = false;
  }
});

document.addEventListener("aluno-carregado", carregar);
