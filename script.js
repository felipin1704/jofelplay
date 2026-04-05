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

function parseDataLocal(dataISO) {
  if (!dataISO || !dataISO.includes("-")) return null;
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function dataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function limparFormulario() {
  document.getElementById("cliente").value = "";
  document.getElementById("manualDescricao").value = "";
  document.getElementById("manualValor").value = "";
  document.getElementById("data").value = dataHojeISO();

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

function alterarPeriodo() {
  const periodo = document.getElementById("filtroPeriodo").value;
  const boxInicio = document.getElementById("boxDataInicio");
  const boxFim = document.getElementById("boxDataFim");

  if (periodo === "personalizado") {
    boxInicio.classList.remove("oculto");
    boxFim.classList.remove("oculto");
  } else {
    boxInicio.classList.add("oculto");
    boxFim.classList.add("oculto");
  }

  render();
}

function dentroDoPeriodo(item) {
  const periodo = document.getElementById("filtroPeriodo")?.value || "todos";
  const dataItem = parseDataLocal(item.data);
  if (!dataItem) return false;

  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

  if (periodo === "todos") return true;

  if (periodo === "hoje") {
    return dataItem >= inicioHoje && dataItem <= fimHoje;
  }

  if (periodo === "semana") {
    const diaSemana = inicioHoje.getDay();
    const ajuste = diaSemana === 0 ? 6 : diaSemana - 1;
    const inicioSemana = new Date(inicioHoje);
    inicioSemana.setDate(inicioHoje.getDate() - ajuste);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    return dataItem >= inicioSemana && dataItem <= fimSemana;
  }

  if (periodo === "mes") {
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
    return dataItem >= inicioMes && dataItem <= fimMes;
  }

  if (periodo === "personalizado") {
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    if (!dataInicio && !dataFim) return true;

    const inicio = dataInicio ? parseDataLocal(dataInicio) : null;
    const fim = dataFim ? parseDataLocal(dataFim) : null;

    if (inicio && fim) {
      fim.setHours(23, 59, 59, 999);
      return dataItem >= inicio && dataItem <= fim;
    }

    if (inicio) return dataItem >= inicio;
    if (fim) {
      fim.setHours(23, 59, 59, 999);
      return dataItem <= fim;
    }
  }

  return true;
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
      const passouPeriodo = dentroDoPeriodo(item);
      return passouBusca && passouFiltro && passouPeriodo;
    });
}

function calcularResumoHoje() {
  const hoje = dataHojeISO();
  const registrosHoje = dados.filter((item) => item.data === hoje);
  const faturamento = registrosHoje.reduce((acc, item) => acc + item.valor, 0);
  const lucro = registrosHoje.reduce((acc, item) => acc + item.lucro, 0);
  const clientes = new Set(registrosHoje.map((item) => item.cliente.trim())).size;

  return { faturamento, lucro, clientes };
}

function calcularResumoMes() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const registrosMes = dados.filter((item) => {
    const data = parseDataLocal(item.data);
    return data && data.getFullYear() === ano && data.getMonth() === mes;
  });

  const faturamento = registrosMes.reduce((acc, item) => acc + item.valor, 0);
  const lucro = registrosMes.reduce((acc, item) => acc + item.lucro, 0);
  const clientes = new Set(registrosMes.map((item) => item.cliente.trim())).size;

  return { faturamento, lucro, clientes };
}

function renderResumoHojeEMes() {
  const resumoHoje = calcularResumoHoje();
  const resumoMes = calcularResumoMes();

  document.getElementById("heroFaturamentoHoje").innerText = resumoHoje.faturamento.toFixed(2);
  document.getElementById("heroLucroHoje").innerText = resumoHoje.lucro.toFixed(2);
  document.getElementById("heroClientesHoje").innerText = resumoHoje.clientes;

  document.getElementById("faturamentoHoje").innerText = resumoHoje.faturamento.toFixed(2);
  document.getElementById("lucroHoje").innerText = resumoHoje.lucro.toFixed(2);
  document.getElementById("clientesHoje").innerText = resumoHoje.clientes;

  document.getElementById("faturamentoMes").innerText = resumoMes.faturamento.toFixed(2);
  document.getElementById("lucroMes").innerText = resumoMes.lucro.toFixed(2);
  document.getElementById("clientesMes").innerText = resumoMes.clientes;
}

function renderCardsMobile(dadosFiltrados) {
  const cards = document.getElementById("cardsMobile");
  if (!cards) return;

  cards.innerHTML = "";

  if (!dadosFiltrados.length) {
    cards.innerHTML = `<div class="sem-registros">Nenhum registro encontrado.</div>`;
    return;
  }

  dadosFiltrados.forEach((item) => {
    cards.innerHTML += `
      <div class="card-historico-mobile">
        <div class="linha-titulo">
          <div class="nome-cliente">${item.cliente}</div>
          <div class="data-card">${formatarData(item.data)}</div>
        </div>

        <div class="grid-info">
          <div class="info-item">
            <span>Tipo</span>
            <strong>${item.tipo}</strong>
          </div>
          <div class="info-item">
            <span>Manetes</span>
            <strong>${item.manetes}</strong>
          </div>
          <div class="info-item">
            <span>Valor</span>
            <strong>R$ ${item.valor.toFixed(2)}</strong>
          </div>
          <div class="info-item">
            <span>Lucro</span>
            <strong>R$ ${item.lucro.toFixed(2)}</strong>
          </div>
          <div class="info-item">
            <span>Manutenção</span>
            <strong>R$ ${item.manutencao.toFixed(2)}</strong>
          </div>
          <div class="info-item">
            <span>Assinatura</span>
            <strong>R$ ${item.assinatura.toFixed(2)}</strong>
          </div>
          <div class="info-item">
            <span>Reinvest.</span>
            <strong>R$ ${item.reinvest.toFixed(2)}</strong>
          </div>
        </div>

        <button class="btn-excluir-mobile" onclick="remover(${item.indexReal})">
          Excluir
        </button>
      </div>
    `;
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

function gerarPDF() {
  const dadosFiltrados = filtrarDados();
  const resumoHoje = calcularResumoHoje();
  const resumoMes = calcularResumoMes();

  const linhas = dadosFiltrados.map((item) => `
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
    </tr>
  `).join("");

  const janela = window.open("", "_blank");

  janela.document.write(`
    <html>
      <head>
        <title>Relatório JOFEL PLAY</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1, h2 { margin-bottom: 10px; }
          .bloco { margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
          .item { border: 1px solid #ccc; border-radius: 10px; padding: 12px; }
          .item span { display:block; font-size:12px; color:#666; margin-bottom:4px; }
          .item strong { font-size:18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; text-align: center; }
          th { background: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Relatório JOFEL PLAY</h1>

        <div class="bloco">
          <h2>Resumo de hoje</h2>
          <div class="grid">
            <div class="item"><span>Faturamento de hoje</span><strong>R$ ${resumoHoje.faturamento.toFixed(2)}</strong></div>
            <div class="item"><span>Lucro de hoje</span><strong>R$ ${resumoHoje.lucro.toFixed(2)}</strong></div>
            <div class="item"><span>Clientes do dia</span><strong>${resumoHoje.clientes}</strong></div>
          </div>
        </div>

        <div class="bloco">
          <h2>Resumo do mês</h2>
          <div class="grid">
            <div class="item"><span>Faturamento do mês</span><strong>R$ ${resumoMes.faturamento.toFixed(2)}</strong></div>
            <div class="item"><span>Lucro do mês</span><strong>R$ ${resumoMes.lucro.toFixed(2)}</strong></div>
            <div class="item"><span>Clientes do mês</span><strong>${resumoMes.clientes}</strong></div>
          </div>
        </div>

        <div class="bloco">
          <h2>Histórico filtrado</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Manetes</th>
                <th>Valor</th>
                <th>Lucro</th>
                <th>Manutenção</th>
                <th>Assinatura</th>
                <th>Reinvest.</th>
              </tr>
            </thead>
            <tbody>
              ${linhas || `<tr><td colspan="9">Nenhum registro encontrado.</td></tr>`}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `);

  janela.document.close();
  janela.focus();
  janela.print();
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
  renderResumoHojeEMes();
  renderCardsMobile(dadosFiltrados);
  desenharGrafico(dadosFiltrados);
}

window.addEventListener("resize", () => {
  const app = document.getElementById("app");
  if (app && !app.classList.contains("oculto")) {
    render();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  atualizarFiltroClientes();
  document.getElementById("data").value = dataHojeISO();
  render();
});
