/* Ofertas 360 — site
 *
 * Segurança:
 * - Nada vindo dos arquivos de dados vira HTML: tudo entra com textContent.
 * - Cada link é conferido de novo aqui (HTTPS + domínio oficial da loja ou da
 *   rede social). Um link fora da lista simplesmente não aparece.
 * - A política de segurança (CSP) da página só permite scripts deste site.
 */
"use strict";

(function () {
  // Mesma lista do robô (promobot/seguranca.py). Subdomínios também valem.
  const DOMINIOS_LINK = {
    shopee: ["shopee.com.br", "shp.ee"],
    aliexpress: ["aliexpress.com", "aliexpress.us"],
    mercadolivre: ["mercadolivre.com.br", "mercadolivre.com", "mercadolibre.com", "meli.la"],
    magalu: ["magazineluiza.com.br", "magalu.com", "magalu.com.br", "magazinevoce.com.br"],
    amazon: ["amazon.com.br", "amzn.to"],
    simulada: ["shopee.com.br", "aliexpress.com"],
  };
  const DOMINIOS_IMAGEM = {
    shopee: ["susercontent.com", "shopee.com.br"],
    aliexpress: ["alicdn.com", "aliexpress-media.com", "aliexpress.com"],
    mercadolivre: ["mlstatic.com"],
    magalu: ["mlcdn.com.br", "magazineluiza.com.br"],
    amazon: ["media-amazon.com", "ssl-images-amazon.com"],
    simulada: ["susercontent.com", "alicdn.com"],
  };
  const DOMINIOS_CANAL = {
    telegram: ["t.me", "telegram.me"],
    whatsapp: ["whatsapp.com", "wa.me"],
    instagram: ["instagram.com"],
    tiktok: ["tiktok.com"],
    youtube: ["youtube.com"],
  };
  const NOME_TIPO = {
    telegram: "Canal no Telegram",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
  };
  const HOST_VALIDO = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
  const POR_PAGINA = 24;

  // ------------------------------------------------------------ utilidades

  function urlSegura(valor, dominios) {
    if (typeof valor !== "string" || valor.length === 0 || valor.length > 2048) return null;
    if (/[\u0000- \u007f\\]/.test(valor)) return null;
    let url;
    try { url = new URL(valor); } catch (_) { return null; }
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (url.port !== "" && url.port !== "443") return null;
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!HOST_VALIDO.test(host)) return null;
    if (!dominios.some((d) => host === d || host.endsWith("." + d))) return null;
    return url.href;
  }

  function texto(valor, maximo) {
    if (typeof valor !== "string") return "";
    const limpo = valor.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, "").trim();
    return limpo.length > maximo ? limpo.slice(0, maximo - 1) + "…" : limpo;
  }

  function inteiro(valor, minimo, maximo) {
    return Number.isInteger(valor) && valor >= minimo && valor <= maximo ? valor : null;
  }

  function el(tag, classe, conteudo) {
    const no = document.createElement(tag);
    if (classe) no.className = classe;
    if (conteudo !== undefined) no.textContent = conteudo;
    return no;
  }

  const SVG = "http://www.w3.org/2000/svg";
  function icone(caminhos) {
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    for (const d of caminhos) {
      const p = document.createElementNS(SVG, "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    }
    return svg;
  }
  const ICONES = {
    telegram: ["M21.5 4.5 2.8 11.6c-.9.4-.9 1.2 0 1.5l4.6 1.5 1.8 5.5c.2.6.9.8 1.4.4l2.7-2.2 4.6 3.4c.6.4 1.3.1 1.5-.6L22.6 5.6c.2-.9-.4-1.4-1.1-1.1Z", "m7.4 14.6 10-6.4-7.6 7.4"],
    whatsapp: ["M3.5 20.5 5 16.3A8.5 8.5 0 1 1 8 19.2Z", "M9 8.5c0 3.5 2.6 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1-.4-2-1.4-2.4-2.4l.9-1-1-2-1.6 1Z"],
    instagram: ["M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z", "M12 8.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Z", "M17.3 6.7h.01"],
    tiktok: ["M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5", "M14 3c.4 2.6 2.2 4.4 5 4.6"],
    youtube: ["M3.5 8.2c.2-1.6 1.2-2.6 2.8-2.8C8.1 5.2 10 5 12 5s3.9.2 5.7.4c1.6.2 2.6 1.2 2.8 2.8.2 1.3.3 2.5.3 3.8s-.1 2.5-.3 3.8c-.2 1.6-1.2 2.6-2.8 2.8-1.8.2-3.7.4-5.7.4s-3.9-.2-5.7-.4c-1.6-.2-2.6-1.2-2.8-2.8-.2-1.3-.3-2.5-.3-3.8s.1-2.5.3-3.8Z", "m10 9 5 3-5 3Z"],
    link: ["M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1", "M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"],
    seta: ["M7 17 17 7", "M8 7h9v9"],
    cupom: ["M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z", "M14.5 8.5l-5 7", "M10 9h.01", "M14 15h.01"],
  };

  const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const dataHora = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  function quandoFoi(iso) {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return "";
    const minutos = Math.max(0, Math.round((Date.now() - data.getTime()) / 60000));
    if (minutos < 1) return "agora mesmo";
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `há ${horas} h`;
    const dias = Math.round(horas / 24);
    return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
  }

  function semAcento(valor) {
    return valor.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  async function lerJson(caminho) {
    const resposta = await fetch(caminho, { cache: "no-cache", credentials: "same-origin" });
    if (!resposta.ok) throw new Error("HTTP " + resposta.status);
    const tipo = resposta.headers.get("content-type") || "";
    if (!tipo.includes("json")) throw new Error("tipo inesperado");
    return resposta.json();
  }

  // ------------------------------------------------------------ canais

  function canaisValidos(dados) {
    const lista = dados && Array.isArray(dados.links) ? dados.links.slice(0, 30) : [];
    const resultado = [];
    for (const item of lista) {
      if (!item || typeof item !== "object") continue;
      const tipo = Object.prototype.hasOwnProperty.call(DOMINIOS_CANAL, item.tipo) ? item.tipo : null;
      if (!tipo) continue;
      const url = urlSegura(item.url, DOMINIOS_CANAL[tipo]);
      const nome = texto(item.nome, 60);
      if (url && nome) resultado.push({ tipo, url, nome });
    }
    return resultado;
  }

  function linkExterno(a, url) {
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
  }

  function mostrarCanaisCapa(canais) {
    const lista = document.getElementById("canais-capa");
    if (!lista) return;
    lista.replaceChildren();
    if (!canais.length) {
      lista.closest(".capa-texto").querySelector(".capa-chamada").hidden = true;
      return;
    }
    for (const canal of canais.slice(0, 6)) {
      const li = el("li");
      const a = el("a", "canal-botao");
      linkExterno(a, canal.url);
      a.append(icone(ICONES[canal.tipo] || ICONES.link), el("span", "", canal.nome));
      a.setAttribute("aria-label", `${canal.nome} (${NOME_TIPO[canal.tipo]})`);
      li.appendChild(a);
      lista.appendChild(li);
    }
  }

  function mostrarCanaisPagina(canais) {
    const lista = document.getElementById("canais-links");
    if (!lista) return;
    lista.replaceChildren();
    if (!canais.length) {
      lista.appendChild(el("li", "estado", "Os canais estão sendo preparados. Volte em breve!"));
      return;
    }
    for (const canal of canais) {
      const li = el("li");
      const a = el("a", "link-canal");
      linkExterno(a, canal.url);
      const bola = el("span", "icone");
      bola.appendChild(icone(ICONES[canal.tipo] || ICONES.link));
      const textos = el("span");
      textos.append(el("span", "nome", canal.nome), el("span", "tipo", NOME_TIPO[canal.tipo]));
      a.append(bola, textos);
      li.appendChild(a);
      lista.appendChild(li);
    }
  }

  function mostrarContato(dados) {
    const alvo = document.getElementById("contato");
    if (!alvo || !dados || typeof dados.email !== "string") return;
    const email = dados.email.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/.test(email)) return;
    alvo.append("Fale com a gente: ");
    const a = el("a", "", email);
    a.href = "mailto:" + email;
    alvo.appendChild(a);
  }

  async function carregarCanais() {
    try {
      const dados = await lerJson("dados/canais.json");
      const canais = canaisValidos(dados);
      mostrarCanaisCapa(canais);
      mostrarCanaisPagina(canais);
      mostrarContato(dados);
    } catch (_) {
      mostrarCanaisCapa([]);
      const lista = document.getElementById("canais-links");
      if (lista) lista.replaceChildren(el("li", "estado", "Não foi possível carregar os canais agora. Tente de novo em instantes."));
    }
  }

  // ------------------------------------------------------------ ofertas

  const estado = { ofertas: [], nichos: [], tema: "todos", busca: "", ordem: "recentes", mostrando: POR_PAGINA,
    cuponsPorLoja: new Map() };

  function ofertaValida(item) {
    if (!item || typeof item !== "object") return null;
    const fonte = Object.prototype.hasOwnProperty.call(DOMINIOS_LINK, item.fonte) ? item.fonte : null;
    if (!fonte) return null;
    const link = urlSegura(item.link, DOMINIOS_LINK[fonte]);
    const titulo = texto(item.titulo, 160);
    const preco = inteiro(item.preco_centavos, 1, 100000000);
    if (!link || !titulo || preco === null) return null;
    let original = inteiro(item.original_centavos, 1, 100000000);
    if (original !== null && original <= preco) original = null;
    const publicado = typeof item.publicado_em === "string" ? item.publicado_em : "";
    return {
      fonte, link, titulo, preco, original,
      nicho: texto(item.nicho, 32),
      loja: texto(item.loja, 30) || fonte,
      imagem: urlSegura(item.imagem, DOMINIOS_IMAGEM[fonte]),
      desconto: inteiro(item.desconto, 0, 99) || 0,
      cupom: texto(item.cupom, 40),
      publicado,
      momento: Date.parse(publicado) || 0,
      buscavel: semAcento(titulo),
    };
  }

  function cartao(oferta) {
    const artigo = el("article", "oferta");
    const foto = el("div", "oferta-foto");
    if (oferta.imagem) {
      const img = el("img");
      img.src = oferta.imagem;
      img.alt = oferta.titulo;
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.width = 400;
      img.height = 400;
      img.addEventListener("error", () => {
        const vazio = el("div", "oferta-sem-foto");
        const m = el("img");
        m.src = "etiquetinha.svg";
        m.alt = "";
        vazio.appendChild(m);
        img.replaceWith(vazio);
      }, { once: true });
      foto.appendChild(img);
    } else {
      const vazio = el("div", "oferta-sem-foto");
      const m = el("img");
      m.src = "etiquetinha.svg";
      m.alt = "";
      vazio.appendChild(m);
      foto.appendChild(vazio);
    }
    if (oferta.desconto >= 5) foto.appendChild(el("span", "selo", `-${oferta.desconto}%`));

    const corpo = el("div", "oferta-corpo");
    corpo.appendChild(el("span", "oferta-loja", oferta.loja));
    const titulo = el("h3", "oferta-titulo", oferta.titulo);
    titulo.title = oferta.titulo;
    corpo.appendChild(titulo);
    corpo.appendChild(el("span", "oferta-de", oferta.original ? reais.format(oferta.original / 100) : ""));
    corpo.appendChild(el("span", "oferta-preco", reais.format(oferta.preco / 100)));
    if (oferta.cupom) corpo.appendChild(el("span", "oferta-cupom", `Cupom: ${oferta.cupom}`));
    const daLoja = estado.cuponsPorLoja.get(oferta.fonte) || [];
    if (daLoja.length) {
      const b = el("button", "oferta-cupons");
      b.type = "button";
      b.append(icone(ICONES.cupom), el("span", "", daLoja.length === 1 ? "1 cupom" : `${daLoja.length} cupons`));
      b.setAttribute("aria-label", `Ver cupons da ${oferta.loja} para ${oferta.titulo}`);
      b.addEventListener("click", () => abrirCupons(oferta, daLoja));
      corpo.appendChild(b);
    }
    if (oferta.momento) {
      const quando = el("span", "oferta-quando", `Preço visto ${quandoFoi(oferta.publicado)}`);
      quando.title = `Preço conferido em ${dataHora.format(new Date(oferta.momento))}. Pode ter mudado.`;
      corpo.appendChild(quando);
    }
    const botao = el("a", "oferta-botao");
    linkExterno(botao, oferta.link);
    botao.rel = "sponsored nofollow noopener";
    botao.append(el("span", "", "Ver oferta"), icone(ICONES.seta));
    botao.setAttribute("aria-label", `Ver oferta na ${oferta.loja}: ${oferta.titulo}`);
    corpo.appendChild(botao);
    artigo.append(foto, corpo);
    return artigo;
  }

  function filtradas() {
    const termo = semAcento(estado.busca.trim());
    let lista = estado.ofertas.filter((o) =>
      (estado.tema === "todos" || o.nicho === estado.tema) && (!termo || o.buscavel.includes(termo))
    );
    if (estado.ordem === "desconto") lista = lista.slice().sort((a, b) => b.desconto - a.desconto || b.momento - a.momento);
    else if (estado.ordem === "preco") lista = lista.slice().sort((a, b) => a.preco - b.preco);
    else lista = lista.slice().sort((a, b) => b.momento - a.momento);
    return lista;
  }

  function desenhar() {
    const grade = document.getElementById("grade");
    const botao = document.getElementById("ver-mais");
    const lista = filtradas();
    grade.replaceChildren();
    grade.setAttribute("aria-busy", "false");
    if (!lista.length) {
      const msg = estado.ofertas.length
        ? "Nenhuma oferta com esse filtro agora. Tente outra palavra ou assunto."
        : "As primeiras ofertas chegam em breve. Enquanto isso, entre nos nossos canais!";
      grade.appendChild(el("p", "estado", msg));
      botao.hidden = true;
      return;
    }
    const fragmento = document.createDocumentFragment();
    for (const oferta of lista.slice(0, estado.mostrando)) fragmento.appendChild(cartao(oferta));
    grade.appendChild(fragmento);
    botao.hidden = lista.length <= estado.mostrando;
  }

  function desenharTemas() {
    const caixa = document.getElementById("temas");
    caixa.replaceChildren();
    const usados = new Set(estado.ofertas.map((o) => o.nicho));
    const temas = estado.nichos.filter((n) => usados.has(n.id));
    if (temas.length < 2) { caixa.hidden = true; return; }
    caixa.hidden = false;
    for (const tema of [{ id: "todos", nome: "Todas" }, ...temas]) {
      const b = el("button", "tema", tema.nome);
      b.type = "button";
      b.setAttribute("aria-pressed", String(estado.tema === tema.id));
      b.addEventListener("click", () => {
        estado.tema = tema.id;
        estado.mostrando = POR_PAGINA;
        for (const outro of caixa.children) outro.setAttribute("aria-pressed", String(outro === b));
        try { history.replaceState(null, "", tema.id === "todos" ? location.pathname : "#" + encodeURIComponent(tema.id)); } catch (_) { /* sem histórico */ }
        desenhar();
      });
      caixa.appendChild(b);
    }
  }

  async function carregarOfertas(cuponsPromessa) {
    const grade = document.getElementById("grade");
    try {
      const [dados, cupons] = await Promise.all([lerJson("dados/ofertas.json"), cuponsPromessa]);
      estado.cuponsPorLoja = new Map();
      for (const c of (cupons ? cupons.cupons : [])) {
        if (!estado.cuponsPorLoja.has(c.fonte)) estado.cuponsPorLoja.set(c.fonte, []);
        estado.cuponsPorLoja.get(c.fonte).push(c);
      }
      const brutas = Array.isArray(dados.ofertas) ? dados.ofertas.slice(0, 1000) : [];
      estado.ofertas = brutas.map(ofertaValida).filter(Boolean);
      estado.nichos = (Array.isArray(dados.nichos) ? dados.nichos : [])
        .map((n) => (n && typeof n === "object" ? { id: texto(n.id, 32), nome: texto(n.nome, 30) } : null))
        .filter((n) => n && n.id && n.nome && n.id !== "todos");
      let pedido = "";
      try { pedido = decodeURIComponent(location.hash.slice(1)); } catch (_) { /* endereço malformado */ }
      if (estado.nichos.some((n) => n.id === pedido)) estado.tema = pedido;
      document.getElementById("aviso-exemplo").hidden = dados.exemplo !== true;
      if (typeof dados.atualizado_em === "string" && !Number.isNaN(Date.parse(dados.atualizado_em))) {
        document.getElementById("atualizado").textContent = `Atualizado ${quandoFoi(dados.atualizado_em)}`;
      }
      desenharTemas();
      desenhar();
    } catch (_) {
      grade.replaceChildren(el("p", "estado", "Não foi possível carregar as ofertas agora. Atualize a página em instantes."));
      grade.setAttribute("aria-busy", "false");
    }
  }

  function prepararOfertas() {
    const busca = document.getElementById("busca");
    let espera = 0;
    busca.addEventListener("input", () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        estado.busca = busca.value.slice(0, 60);
        estado.mostrando = POR_PAGINA;
        desenhar();
      }, 150);
    });
    document.getElementById("ordem").addEventListener("change", (e) => {
      const valor = e.target.value;
      estado.ordem = ["recentes", "desconto", "preco"].includes(valor) ? valor : "recentes";
      estado.mostrando = POR_PAGINA;
      desenhar();
    });
    document.getElementById("ver-mais").addEventListener("click", () => {
      estado.mostrando += POR_PAGINA;
      desenhar();
    });
    const cuponsPromessa = lerCupons().catch(() => null);
    mostrarFaixaCupons(cuponsPromessa);
    carregarOfertas(cuponsPromessa);
    prepararJanela();
  }

  // Janela "cupons para este produto"
  function prepararJanela() {
    const janela = document.getElementById("janela-cupons");
    if (!janela || typeof janela.showModal !== "function") return;
    document.getElementById("janela-fechar").addEventListener("click", () => janela.close());
    janela.addEventListener("click", (e) => { if (e.target === janela) janela.close(); });  // toque fora fecha
  }

  function abrirCupons(oferta, lista) {
    const janela = document.getElementById("janela-cupons");
    if (!janela || typeof janela.showModal !== "function") {
      location.href = "cupons.html#" + encodeURIComponent(oferta.fonte);
      return;
    }
    const vale = (c) => !c.minimo || c.minimo <= oferta.preco;
    const ordenada = lista.slice().sort((a, b) => Number(vale(b)) - Number(vale(a)) || a.validade.localeCompare(b.validade));
    document.getElementById("janela-titulo").textContent = `Cupons da ${oferta.loja}`;
    document.getElementById("janela-produto").textContent = `${oferta.titulo} · ${reais.format(oferta.preco / 100)}`;
    const caixa = document.getElementById("janela-lista");
    caixa.replaceChildren();
    for (const c of ordenada) {
      const item = el("div", "cupom-mini" + (vale(c) ? "" : " nao-vale"));
      const topo = el("div", "cupom-mini-topo");
      topo.appendChild(el("span", "cupom-mini-desconto", c.desconto));
      topo.appendChild(vale(c)
        ? el("span", "selo-vale", "Vale para este preço")
        : el("span", "selo-falta", `Mínimo ${reais.format(c.minimo / 100)}: faltam ${reais.format((c.minimo - oferta.preco) / 100)}`));
      item.append(topo, el("p", "", c.descricao));
      if (c.codigo) item.appendChild(caixaCodigo(c.codigo));
      else if (c.link) {
        const a = el("a", "cupom-mini-link", `Ativar o cupom na ${c.loja}`);
        linkExterno(a, c.link);
        a.rel = "sponsored nofollow noopener";
        item.appendChild(a);
      }
      caixa.appendChild(item);
    }
    document.getElementById("janela-todos").href = "cupons.html#" + encodeURIComponent(oferta.fonte);
    const ir = document.getElementById("janela-ir");
    linkExterno(ir, oferta.link);
    ir.rel = "sponsored nofollow noopener";
    ir.replaceChildren(el("span", "", `Ver na ${oferta.loja}`), icone(ICONES.seta));
    janela.showModal();
  }

  // ------------------------------------------------------------ cupons

  const CODIGO_CUPOM = /^[A-Z0-9_-]{3,30}$/;
  const DATA_CUPOM = /^\d{4}-\d{2}-\d{2}$/;

  function hojeLocal() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function cupomValido(item, hoje) {
    if (!item || typeof item !== "object") return null;
    const fonte = Object.prototype.hasOwnProperty.call(DOMINIOS_LINK, item.fonte) ? item.fonte : null;
    if (!fonte) return null;
    const validade = typeof item.validade === "string" && DATA_CUPOM.test(item.validade) ? item.validade : null;
    if (!validade || validade < hoje) return null;  // venceu: some mesmo se o site estiver desatualizado
    const codigo = typeof item.codigo === "string" && CODIGO_CUPOM.test(item.codigo) ? item.codigo : "";
    const link = item.link ? urlSegura(item.link, DOMINIOS_LINK[fonte]) : null;
    const desconto = texto(item.desconto, 30);
    const descricao = texto(item.descricao, 120);
    if ((!codigo && !link) || !desconto || !descricao) return null;
    return { fonte, loja: texto(item.loja, 30) || fonte, codigo, link, desconto, descricao, validade,
      minimo: inteiro(item.minimo_centavos, 1, 10000000) };
  }

  async function copiar(textoCopiar) {
    try {
      await navigator.clipboard.writeText(textoCopiar);
      return true;
    } catch (_) {
      return false;
    }
  }

  function caixaCodigo(textoCodigo) {
    const caixa = el("div", "cupom-codigo");
    const codigo = el("code", "", textoCodigo);
    const botao = el("button", "cupom-copiar", "Copiar");
    botao.type = "button";
    botao.setAttribute("aria-label", `Copiar o cupom ${textoCodigo}`);
    botao.addEventListener("click", async () => {
      const ok = await copiar(textoCodigo);
      if (!ok) {  // navegador sem permissão: seleciona o código para copiar à mão
        const faixa = document.createRange();
        faixa.selectNodeContents(codigo);
        const selecao = window.getSelection();
        selecao.removeAllRanges();
        selecao.addRange(faixa);
      }
      botao.textContent = ok ? "Copiado!" : "Selecionado";
      botao.classList.toggle("copiado", ok);
      setTimeout(() => { botao.textContent = "Copiar"; botao.classList.remove("copiado"); }, 2500);
    });
    caixa.append(codigo, botao);
    return caixa;
  }

  function cartaoCupom(c, hoje) {
    const artigo = el("article", "cupom");
    const topo = el("div", "cupom-topo");
    const [ano, mes, dia] = c.validade.split("-");
    const validade = el("span", "cupom-validade" + (c.validade === hoje ? " hoje" : ""),
      c.validade === hoje ? "Último dia!" : `Válido até ${dia}/${mes}/${ano}`);
    topo.append(el("span", "cupom-loja", c.loja), validade);
    artigo.append(topo, el("span", "cupom-desconto", c.desconto), el("p", "cupom-descricao", c.descricao));
    if (c.minimo) artigo.appendChild(el("span", "cupom-minimo", `Compra mínima: ${reais.format(c.minimo / 100)}`));
    if (c.codigo) {
      artigo.appendChild(caixaCodigo(c.codigo));
    } else {
      artigo.appendChild(el("span", "cupom-automatico", "Sem código: o desconto é ativado pelo link"));
    }
    if (c.link) {
      const ir = el("a", "oferta-botao");
      linkExterno(ir, c.link);
      ir.rel = "sponsored nofollow noopener";
      ir.append(el("span", "", `Ir para a ${c.loja}`), icone(ICONES.seta));
      artigo.appendChild(ir);
    }
    return artigo;
  }

  async function lerCupons() {
    const dados = await lerJson("dados/cupons.json");
    const hoje = hojeLocal();
    const lista = Array.isArray(dados.cupons) ? dados.cupons.slice(0, 500) : [];
    return { hoje, exemplo: dados.exemplo === true, cupons: lista.map((c) => cupomValido(c, hoje)).filter(Boolean) };
  }

  async function prepararCupons() {
    const caixa = document.getElementById("lista-cupons");
    let dados;
    try {
      dados = await lerCupons();
    } catch (_) {
      caixa.replaceChildren(el("p", "estado", "Não foi possível carregar os cupons agora. Atualize a página em instantes."));
      caixa.setAttribute("aria-busy", "false");
      return;
    }
    document.getElementById("aviso-exemplo").hidden = !dados.exemplo;
    let loja = "todas";
    const desenhar = () => {
      const lista = dados.cupons.filter((c) => loja === "todas" || c.fonte === loja);
      caixa.replaceChildren();
      caixa.setAttribute("aria-busy", "false");
      if (!lista.length) {
        caixa.appendChild(el("p", "estado", "Nenhum cupom válido agora. Volte amanhã: sempre aparecem novos!"));
        return;
      }
      for (const c of lista) caixa.appendChild(cartaoCupom(c, dados.hoje));
    };
    const lojas = [...new Map(dados.cupons.map((c) => [c.fonte, c.loja])).entries()];
    let pedido = "";
    try { pedido = decodeURIComponent(location.hash.slice(1)); } catch (_) { /* endereço malformado */ }
    if (lojas.some(([id]) => id === pedido)) loja = pedido;
    const filtros = document.getElementById("lojas-cupom");
    if (lojas.length >= 2) {
      for (const [id, nome] of [["todas", "Todas"], ...lojas]) {
        const b = el("button", "tema", nome);
        b.type = "button";
        b.setAttribute("aria-pressed", String(id === loja));
        b.addEventListener("click", () => {
          loja = id;
          for (const outro of filtros.children) outro.setAttribute("aria-pressed", String(outro === b));
          desenhar();
        });
        filtros.appendChild(b);
      }
    } else {
      filtros.hidden = true;
    }
    desenhar();
  }

  async function mostrarFaixaCupons(cuponsPromessa) {
    const faixa = document.getElementById("faixa-cupons");
    if (!faixa) return;
    try {
      const dados = await cuponsPromessa;
      if (!dados) return;
      const total = dados.cupons.length;
      if (!total) return;
      faixa.textContent = total === 1 ? "Tem 1 cupom válido hoje" : `Tem ${total} cupons válidos hoje`;
      faixa.hidden = false;
    } catch (_) { /* sem cupons: a faixa fica escondida */ }
  }

  // ------------------------------------------------------------ início

  document.addEventListener("DOMContentLoaded", () => {
    const pagina = document.body.dataset.pagina;
    if (pagina === "ofertas") prepararOfertas();
    if (pagina === "cupons") prepararCupons();
    if (pagina === "ofertas" || pagina === "canais") carregarCanais();
  });
})();
