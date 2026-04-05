let dados = JSON.parse(localStorage.getItem("dados")) || [];

let selecaoAtual = {
  tipo: "",
  manetes: "",
  valor: 0,
  descricao: ""
};

function salvar() {
  localStorage.setItem("dados", JSON.stringify(dados));
}

function abrirApp() {
  document.getElementById("telaInicial").classList.add("oculto");
  document.getElementById("app").classList.remove("oculto");
  render();
}

function selecionarOpcao(botao, tipo, manetes, valor, descricao) {
  selecaoAtual = { tipo, manetes, valor, descricao };

  document.querySelectorAll(".botoes-preco button").forEach((btn) => {
    btn.classList.remove("ativo");
  });

  botao.classList.add("ativo");

  document.getElementById("manualArea").classList.add("oculto");
  document.getElementById("manualDescricao").value = "";
  document.getElementById("manualValor").value = "";
}

function toggleManual() {
  const area = document.getElementById("manualArea");
  area.classList.toggle("oculto");

  if (!area.classList.contains("oculto")) {
    document.querySelectorAll(".botoes-preco button").forEach((btn) => {
      btn.classList.remove("ativo");
    });

    selecaoAtual = {
      tipo: "manual",
      manetes: "-",
      valor: 0,
      descricao: ""
    };
  }
}

function calcular(valor) {
  return {
    lucro: valor * 0.6,
    manutencao: valor * 0.2,
    assinatura: valor * 0.1,
    reinvest: valor * 0.1
  };
}

function formatarData(dataISO) {
  if (!dataISO || !dataISO.includes("-")) return dataISO;
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function normalizarTexto(texto) {
  return (texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function limparFormulario() {
  document.getElementById("cliente").value = "";
  document.getElementById("manualDescricao").value = "";
  document.getElementById("manualValor").value = "";

  document.querySelectorAll(".botoes-preco button").forEach((btn) => {
    btn.classList.remove("ativo");
  });

  document.getElementById("manualArea").classList.add("oculto");

  selecaoAtual = {
    tipo: "",
    manetes: "",
    valor: 0,
    descricao: ""
  };
}

function adicionar() {
  const cliente = document.getElementById("cliente").value.trim();
  const data = document.getElementById("data").value;
  const manualAberto = !document.getElementById("manualArea").classList.contains("oculto");

  if (!cliente) {
    alert("Digite o nome do cliente.");
    return;
  }

  if (!data) {
    alert("Selecione a data.");
    return;
  }

  let tipo = selecaoAtual.tipo;
  let manetes = selecaoAtual.manetes;
  let valor = selecaoAtual.valor;
  let descricao = selecaoAtual.descricao;

  if (manualAberto) {
    const descricaoManual = document.getElementById("manualDescricao").value.trim() || "manual";
    const valorManual = parseFloat(document.getElementById("manualValor").value);

    if (!valorManual || valorManual <= 0) {
      alert("Digite um valor manual válido.");
      return;
    }

    tipo = descricaoManual;
    manetes = "-";
    valor = valorManual;
    descricao = descricaoManual;
  } else {
    if (!valor || !tipo) {
      alert("Selecione uma opção de aluguel.");
      return;
    }
  }

  const calc = calcular(valor);

  dados.push({
    cliente,
    data,
    tipo: descricao || tipo,
    manetes,
    valor,
    ...calc
  });

  salvar();
  atualizarFiltroClientes();
  limparFormulario();
  render();
}

function remover(indexReal) {
  dados.splice(indexReal, 1);
  salvar();
  atualizarFiltroClientes();
  render();
}

function atualizarFiltroClientes() {
  const select = document.getElementById("filtroHistoricoCliente");
  if (!select) return;

  const valorAtual = select.value;

  const clientesUnicos = [...new Set(dados.map((item) => item.cliente.trim()))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  select.innerHTML = `<option value="">Todos os clientes</option>`;

  clientesUnicos.forEach((cliente) => {
    const option = document.createElement("option");
    option.value = cliente;
    option.textContent = cliente;
    select.appendChild(option);
  });

  if (clientesUnicos.includes(valorAtual)) {
    select.value = valorAtual;
  }
}

function obterClienteFrequente() {
  if (!dados.length) return null;

  const contador = {};

  dados.forEach((item) => {
    const nome = item.cliente.trim();

    if (!contador[nome]) {
      contador[nome] = {
        nome,
        quantidade: 0,
        total: 0
      };
    }

    contador[nome].quantidade += 1;
    contador[nome].total += item.valor;
  });

  const ranking = Object.values(contador).sort((a, b) => {
    if (b.quantidade !== a.quantidade) return b.quantidade - a.quantidade;
    return b.total - a.total;
  });

  return ranking[0];
}

function renderClienteFrequente() {
  const box = document.getElementById("clienteFrequente");
  if (!box) return;

  const clienteTop = obterClienteFrequente();

  if (!clienteTop) {
    box.innerHTML = "Nenhum cliente cadastrado ainda.";
    return;
  }

  box.innerHTML = `
    <div class="cliente-frequente-nome">${clienteTop.nome}</div>
    <div class="cliente-frequente-info">Aluguéis: ${clienteTop.quantidade}</div>
    <div class="cliente-frequente-info">Total movimentado: R$ ${clienteTop.total.toFixed(2)}</div>
  `;
}

function filtrarDados() {
  const inputBusca = document.getElementById("buscaCliente");
  const filtroSelect = document.getElementById("filtroHistoricoCliente");

  const busca = inputBusca ? normalizarTexto(inputBusca.value) : "";
  const clienteSelecionado = filtroSelect ? filtroSelect.value : "";

  return dados
    .map((item, indexReal) => ({ ...item, indexReal }))
    .filter((item) => {
      const nomeNormalizado = normalizarTexto(item.cliente);
      const passouBusca = !busca || nomeNormalizado.includes(busca);
      const passouFiltro = !clienteSelecionado || item.cliente === clienteSelecionado;
      return passouBusca && passouFiltro;
    });
}

function desenharGrafico(dadosFiltrados) {
  const canvas = document.getElementById("graficoLucro");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const larguraCSS = canvas.clientWidth || canvas.parentElement.clientWidth || 300;
  const alturaCSS = parseInt(getComputedStyle(canvas).height, 10) || 280;

  canvas.width = larguraCSS * dpr;
  canvas.height = alturaCSS * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, larguraCSS, alturaCSS);

  if (!dadosFiltrados.length) {
    ctx.fillStyle = "#cfe7ff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Sem dados para o gráfico.", larguraCSS / 2, alturaCSS / 2);
    return;
  }

  const agrupado = {};

  dadosFiltrados.forEach((item) => {
    const chave = formatarData(item.data);
    if (!agrupado[chave]) agrupado[chave] = 0;
    agrupado[chave] += item.lucro;
  });

  const labels = Object.keys(agrupado);
  const valores = Object.values(agrupado);

  const margemTopo = 20;
  const margemDireita = 20;
  const margemBaixo = 40;
  const margemEsquerda = 45;

  const larguraGrafico = larguraCSS - margemEsquerda - margemDireita;
  const alturaGrafico = alturaCSS - margemTopo - margemBaixo;
  const maxValor = Math.max(...valores, 1);

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = margemTopo + (alturaGrafico / 4) * i;
    ctx.beginPath();
    ctx.moveTo(margemEsquerda, y);
    ctx.lineTo(margemEsquerda + larguraGrafico, y);
    ctx.stroke();
  }

  const barraLargura = (larguraGrafico / labels.length) * 0.6;
  const espaco = larguraGrafico / labels.length;

  valores.forEach((valor, i) => {
    const alturaBarra = (valor / maxValor) * alturaGrafico;
    const x = margemEsquerda + i * espaco + (espaco - barraLargura) / 2;
    const y = margemTopo + alturaGrafico - alturaBarra;

    const gradiente = ctx.createLinearGradient(0, y, 0, y + alturaBarra);
    gradiente.addColorStop(0, "#35b7ff");
    gradiente.addColorStop(1, "#1f8bde");

    ctx.fillStyle = gradiente;
    ctx.beginPath();
    ctx.roundRect(x, y, barraLargura, alturaBarra, 8);
    ctx.fill();

    ctx.fillStyle = "#dff2ff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`R$ ${valor.toFixed(0)}`, x + barraLargura / 2, y - 8);

    ctx.fillStyle = "#cfe7ff";
    ctx.font = "11px Arial";
    ctx.fillText(labels[i], x + barraLargura / 2, alturaCSS - 14);
  });

  ctx.fillStyle = "#cfe7ff";
  ctx.font = "12px Arial";
  ctx.textAlign = "right";
  ctx.fillText(`R$ ${maxValor.toFixed(0)}`, margemEsquerda - 8, margemTopo + 10);
  ctx.fillText("R$ 0", margemEsquerda - 8, margemTopo + alturaGrafico);
}

function render() {
  const tabela = document.getElementById("tabela");
  if (!tabela) return;

  tabela.innerHTML = "";

  const dadosFiltrados = filtrarDados();

  let total = 0;
  let totalLucro = 0;
  let totalManutencao = 0;
  let totalAssinatura = 0;
  let totalReinvest = 0;

  if (!dadosFiltrados.length) {
    tabela.innerHTML = `
      <tr>
        <td colspan="10" class="sem-registros">Nenhum registro encontrado.</td>
      </tr>
    `;
  } else {
    dadosFiltrados.forEach((item) => {
      total += item.valor;
      totalLucro += item.lucro;
      totalManutencao += item.manutencao;
      totalAssinatura += item.assinatura;
      totalReinvest += item.reinvest;

      tabela.innerHTML += `
        <tr>
          <td>${formatarData(item.data)}</td>
          <td>${item.cliente}</td>
          <td>${item.tipo}</td>
          <td>${item.manetes}</td>
          <td>R$ ${item.valor.toFixed(2)}</td>
          <td>R$ ${item.lucro.toFixed(2)}</td>
          <td>R$ ${item.manutencao.toFixed(2)}</td>
          <td>R$ ${item.assinatura.toFixed(2)}</td>
          <td>R$ ${item.reinvest.toFixed(2)}</td>
          <td><button onclick="remover(${item.indexReal})">Excluir</button></td>
        </tr>
      `;
    });
  }

  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("totalLucro").innerText = totalLucro.toFixed(2);
  document.getElementById("totalManutencao").innerText = totalManutencao.toFixed(2);
  document.getElementById("totalAssinatura").innerText = totalAssinatura.toFixed(2);
  document.getElementById("totalReinvest").innerText = totalReinvest.toFixed(2);

  renderClienteFrequente();
  desenharGrafico(dadosFiltrados);
}

window.addEventListener("resize", () => {
  const app = document.getElementById("app");
  if (app && !app.classList.contains("oculto")) {
    render();
  }
});

atualizarFiltroClientes();
render();
