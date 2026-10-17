(function () {
  const H = window.Harmonizador;
  const CHAVE = 'minha-adega-v1';
  const TIPOS = { tinto: 'Tinto', branco: 'Branco', rose: 'Rosé', espumante: 'Espumante', sobremesa: 'Sobremesa', fortificado: 'Fortificado' };
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const estrelas = n => n ? '<span class="nota" title="Sua nota: ' + n + ' de 5">' + '●'.repeat(n) + '○'.repeat(5 - n) + '</span>' : '';
  const corNota = n => n >= 70 ? 'var(--ok)' : n >= 55 ? 'var(--tinta)' : n >= 40 ? 'var(--warn)' : 'var(--bad)';
  const GRUPOS = { tinto: 'Tintos', branco: 'Brancos', rose: 'Rosés', espumante: 'Espumantes', sobremesa: 'Sobremesa', fortificado: 'Fortificados' };
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  const nomesUvas = v => (v.uvas || []).map(id => H.uvaPorId[id]?.nome || id).join(', ');

  // ---------- Persistência (localStorage + backup em JSON) ----------
  let adega = [];
  try { adega = JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { adega = []; }
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(adega)); } catch { /* armazenamento indisponível */ } render(); };
  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ---------- Integração com o n8n ----------
  const CFG = window.ADEGA_CONFIG || {};
  async function chamarN8n(acao, dados) {
    const r = await fetch(CFG.webhook, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: CFG.token, acao, ...dados }),
    });
    const j = await r.json().catch(() => ({ ok: false, erro: `Resposta inválida do servidor (${r.status}).` }));
    if (!r.ok || !j.ok) throw new Error(j.erro || `Erro ${r.status}`);
    return j;
  }
  const enviarFeedback = feedback => chamarN8n('feedback', { feedback }).catch(() => toast('Não consegui enviar o feedback agora.'));
  function toast(msg) {
    const t = Object.assign(document.createElement('div'), { className: 'toast', textContent: msg });
    document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
  }
  const lerPref = k => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const gravarPref = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

  // Reduz a foto (no máx. 1280px, JPEG) antes de enviar: mais rápido e mais barato
  function reduzirFoto(arquivo) {
    return new Promise((ok, falha) => {
      const img = new Image();
      img.onload = () => {
        const fator = Math.min(1, 1280 / Math.max(img.width, img.height));
        const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * fator), height: Math.round(img.height * fator) });
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        ok(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => falha(new Error('Não consegui abrir a foto.'));
      img.src = URL.createObjectURL(arquivo);
    });
  }

  // ---------- Abas ----------
  function irPara(tab) {
    document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x.dataset.tab === tab));
    document.querySelectorAll('main > section').forEach(s => s.classList.toggle('on', s.id === tab));
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => irPara(b.dataset.tab)));

  // ---------- Adega ----------
  function render() {
    const termo = $('#busca').value.trim().toLowerCase();
    const tipo = $('#filtroTipo').value;
    const lista = adega.filter(v => (!tipo || v.tipo === tipo) &&
      (!termo || [v.nome, v.produtor, v.regiao, nomesUvas(v)].join(' ').toLowerCase().includes(termo)));
    const garrafas = adega.reduce((s, v) => s + Number(v.quantidade || 0), 0);
    const valor = adega.reduce((s, v) => s + Number(v.quantidade || 0) * Number(v.preco || 0), 0);
    $('#resumo').innerHTML = adega.length
      ? `<b>${garrafas}</b> ${garrafas === 1 ? 'garrafa' : 'garrafas'}` + (valor ? `<br>R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '')
      : '';
    const item = v => {
      const j = H.janela(v);
      const top = H.pratosParaVinho(v).slice(0, 3).map(r => r.prato.nome.split(' / ')[0].toLowerCase()).join(', ');
      const qtd = Number(v.quantidade || 0);
      return `<article class="vinho" style="--cor:var(--${v.tipo})">
        <div><h3>${esc(v.nome)}</h3>
          <div class="det">${esc([v.produtor, v.regiao].filter(Boolean).join(', '))}${v.produtor || v.regiao ? ' · ' : ''}${esc(nomesUvas(v))}</div></div>
        <div><div class="safra">${v.safra || 'NV'}</div><div class="qtd">${qtd ? plural(qtd, 'garrafa', 'garrafas') : 'acabou'}</div></div>
        <div class="extra">${estrelas(Number(v.qualidade))}${j ? `<span class="est ${j.status}">${j.texto}</span>` : ''}
          <span class="com">Vai bem com ${esc(top)}</span></div>
        <div class="acoes">
          <button class="link" data-harm="${v.id}">Harmonizar</button>
          <button class="link" data-edit="${v.id}">Editar</button>
          <button class="link" data-beber="${v.id}" ${qtd > 0 ? '' : 'disabled'}>Abri uma garrafa</button>
        </div></article>`;
    };
    $('#listaAdega').innerHTML = lista.length
      ? Object.keys(GRUPOS).map(t => {
          const doTipo = lista.filter(v => v.tipo === t);
          return doTipo.length ? `<div class="grupo"><span>${GRUPOS[t]}</span><span>${doTipo.length}</span></div><div class="lista">${doTipo.map(item).join('')}</div>` : '';
        }).join('')
      : `<p class="vazio">${adega.length ? 'Nada encontrado com esse filtro.' : 'A adega está vazia. Adicione o primeiro vinho, ou carregue os exemplos para conhecer o app.'}</p>`;
    preencherSelVinho();
  }

  $('#listaAdega').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) abrirForm(adega.find(v => v.id === b.dataset.edit));
    if (b.dataset.harm) harmonizarVinho(adega.find(v => v.id === b.dataset.harm));
    if (b.dataset.beber) { const v = adega.find(x => x.id === b.dataset.beber); v.quantidade = Math.max(0, Number(v.quantidade) - 1); salvar(); }
  };
  $('#busca').oninput = render;
  $('#filtroTipo').innerHTML += Object.entries(TIPOS).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
  $('#filtroTipo').onchange = render;

  // ---------- Formulário ----------
  const frm = $('#frm'), dlg = $('#dlg');
  frm.tipo.innerHTML = Object.entries(TIPOS).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
  let editando = null, uvasSel = new Set(), leituraIA = null;

  const CAMPOS_IA = ['nome', 'produtor', 'regiao', 'tipo', 'safra', 'docura'];
  $('#fotoRotulo').onchange = async e => {
    const arq = e.target.files[0]; e.target.value = '';
    if (!arq) return;
    const st = $('#iaStatus');
    st.textContent = 'Lendo o rótulo…';
    try {
      const imagem = await reduzirFoto(arq);
      st.innerHTML = 'Lendo o rótulo…<img alt="Foto do rótulo" src="' + imagem + '">';
      const { rotulo } = await chamarN8n('ler_rotulo', { imagem });
      for (const k of CAMPOS_IA) if (rotulo[k] != null && rotulo[k] !== '') frm[k].value = rotulo[k];
      if (rotulo.uvas.length) uvasSel = new Set(rotulo.uvas);
      chips();
      leituraIA = { ...rotulo, uvas: [...rotulo.uvas] };
      const conf = Math.round(rotulo.confianca * 100);
      st.innerHTML = `Rótulo lido (confiança de ${conf}%). Confira os campos antes de salvar.` +
        (rotulo.uvas_texto ? `<br>Uvas no rótulo: ${esc(rotulo.uvas_texto)}` : '') +
        (!rotulo.uvas.length ? '<br>Não identifiquei a uva. Marque abaixo.' : '') +
        (rotulo.observacoes ? `<br>${esc(rotulo.observacoes)}` : '') +
        '<img alt="Foto do rótulo" src="' + imagem + '">';
    } catch (err) {
      st.textContent = 'Não deu certo: ' + err.message;
    }
  };

  // ---------- Catálogo (Casa Rio Verde, via n8n) ----------
  // Fica em cache no aparelho por 7 dias; só traz dados técnicos (sem preço nem foto)
  const CHAVE_CAT = 'adega-catalogo-v2';
  let catalogo = null;
  const normaliza = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  async function carregarCatalogo() {
    if (catalogo) return catalogo;
    try {
      const c = JSON.parse(localStorage.getItem(CHAVE_CAT));
      if (c && Date.now() - c.ts < 7 * 864e5) return (catalogo = c.itens);
    } catch { /* sem cache */ }
    const { itens } = await chamarN8n('catalogo', {});
    catalogo = itens.map(([nome, produtor, pais, tipo, safra, uvas, uvasTexto]) =>
      ({ nome, produtor, pais, tipo, safra, uvas: uvas ? uvas.split(',') : [], uvasTexto, busca: normaliza([nome, produtor, pais, uvasTexto].join(' ')) }));
    try { localStorage.setItem(CHAVE_CAT, JSON.stringify({ ts: Date.now(), itens: catalogo })); } catch { /* cheio ou bloqueado */ }
    return catalogo;
  }

  const sug = $('#sugestoes');
  let achados = [];
  frm.nome.addEventListener('input', async () => {
    const termos = normaliza(frm.nome.value).split(/\s+/).filter(t => t.length > 1);
    if (!termos.length || editando) { sug.hidden = true; return; }
    let cat;
    try { cat = await carregarCatalogo(); } catch { $('#catStatus').textContent = 'Catálogo indisponível agora.'; return; }
    achados = cat.filter(c => termos.every(t => c.busca.includes(t))).slice(0, 8);
    sug.innerHTML = achados.map((c, i) => `<button type="button" data-i="${i}">${esc(c.nome)}<small>${esc([c.produtor, c.pais, c.uvasTexto].filter(Boolean).join(' · '))}</small></button>`).join('');
    sug.hidden = !achados.length;
  });
  frm.nome.addEventListener('blur', () => setTimeout(() => { sug.hidden = true; }, 150));
  sug.addEventListener('mousedown', e => e.preventDefault());
  sug.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    preencherDoCatalogo(achados[b.dataset.i]);
  });
  function preencherDoCatalogo(c) {
    // A safra fica no campo próprio, não no nome
    frm.nome.value = c.nome.replace(/\s*\b(19|20)\d{2}\b\s*$/, '');
    frm.produtor.value = c.produtor || '';
    frm.regiao.value = c.pais || '';
    if (c.tipo) frm.tipo.value = c.tipo;
    frm.safra.value = c.safra || '';
    uvasSel = new Set(c.uvas);
    chips();
    sug.hidden = true;
    $('#catStatus').textContent = 'Preenchido pelo catálogo da Casa Rio Verde.' +
      (c.uvas.length ? '' : ` Uvas: ${c.uvasTexto || 'não informadas'}. Marque abaixo a mais próxima.`);
  }

  // Compara o que a IA leu com o que foi salvo: é o que mede a precisão da leitura
  function registrarLeitura(v) {
    if (!leituraIA) return;
    const correcao = {};
    for (const k of CAMPOS_IA) {
      const ia = leituraIA[k] ?? null, final = v[k] ?? null;
      if (String(ia ?? '') !== String(final ?? '')) correcao[k] = { ia, final };
    }
    const uvasIA = [...leituraIA.uvas].sort().join(','), uvasFinal = [...v.uvas].sort().join(',');
    if (uvasIA !== uvasFinal) correcao.uvas = { ia: uvasIA, final: uvasFinal };
    enviarFeedback({
      tipo: Object.keys(correcao).length ? 'leitura_corrigida' : 'leitura_certa',
      avaliador: lerPref('adega-avaliador'), vinho: [v.produtor, v.nome].filter(Boolean).join(' '), uvas: nomesUvas(v),
      leitura_ia: leituraIA, correcao,
    });
    leituraIA = null;
  }

  function chips() {
    const f = $('#buscaUva').value.trim().toLowerCase();
    $('#chipsUvas').innerHTML = UVAS.filter(u => !f || u.nome.toLowerCase().includes(f) || uvasSel.has(u.id))
      .map(u => `<span class="chip ${uvasSel.has(u.id) ? 'on' : ''}" data-uva="${u.id}">${esc(u.nome)}</span>`).join('');
  }
  $('#buscaUva').oninput = chips;
  $('#chipsUvas').onclick = e => {
    const c = e.target.closest('[data-uva]'); if (!c) return;
    const id = c.dataset.uva;
    uvasSel.has(id) ? uvasSel.delete(id) : uvasSel.add(id);
    // Sugere o tipo pela primeira uva marcada, em cadastro novo
    if (!editando && uvasSel.size === 1) frm.tipo.value = H.uvaPorId[[...uvasSel][0]].tipo;
    chips();
  };

  function abrirForm(v) {
    editando = v || null;
    frm.reset();
    $('#dlgTitulo').textContent = v ? 'Editar vinho' : 'Novo vinho';
    $('#btnExcluir').hidden = !v;
    uvasSel = new Set(v?.uvas || []);
    leituraIA = null;
    sug.hidden = true;
    $('#catStatus').textContent = v ? '' : 'Digite parte do nome ou do produtor para buscar no catálogo.';
    $('#iaStatus').textContent = 'Fotografe o rótulo da frente para preencher os campos automaticamente.';
    if (v) for (const k of ['nome', 'produtor', 'regiao', 'tipo', 'safra', 'qualidade', 'quantidade', 'preco', 'docura', 'obs']) frm[k].value = v[k] ?? '';
    $('#buscaUva').value = '';
    chips();
    dlg.showModal();
  }
  $('#btnNovo').onclick = () => abrirForm();

  frm.addEventListener('submit', e => {
    if (e.submitter?.value !== 'ok') return;
    if (!uvasSel.size) { e.preventDefault(); alert('Marque pelo menos uma uva.'); return; }
    const d = Object.fromEntries(new FormData(frm));
    const v = {
      id: editando?.id || novoId(), nome: d.nome.trim(), produtor: d.produtor.trim(), regiao: d.regiao.trim(), tipo: d.tipo,
      safra: d.safra ? Number(d.safra) : null, qualidade: d.qualidade ? Number(d.qualidade) : null,
      quantidade: Number(d.quantidade || 0), preco: d.preco ? Number(d.preco) : null,
      docura: d.docura ? Number(d.docura) : null, obs: d.obs.trim(), uvas: [...uvasSel],
    };
    if (editando) adega[adega.indexOf(editando)] = v; else adega.push(v);
    registrarLeitura(v);
    salvar();
  });
  $('#btnExcluir').onclick = () => {
    if (!confirm(`Excluir "${editando.nome}" da adega?`)) return;
    adega = adega.filter(v => v !== editando); dlg.close(); salvar();
  };

  // ---------- Backup ----------
  $('#btnExportar').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(adega, null, 2)], { type: 'application/json' }));
    a.download = `adega-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  $('#arqImportar').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const dados = JSON.parse(await f.text());
      if (!Array.isArray(dados)) throw new Error();
      if (confirm(`Importar ${dados.length} vinho(s)? Isso substitui a adega atual.`)) { adega = dados; salvar(); }
    } catch { alert('Arquivo inválido.'); }
    e.target.value = '';
  };
  $('#btnExemplos').onclick = () => {
    if (adega.length && !confirm('Adicionar vinhos de exemplo à sua adega?')) return;
    const ano = new Date().getFullYear();
    adega.push(
      { id: novoId(), nome: 'Casillero del Diablo Reserva', produtor: 'Concha y Toro', regiao: 'Chile', tipo: 'tinto', safra: ano - 3, qualidade: 3, quantidade: 2, preco: 69.9, uvas: ['cabernet-sauvignon'] },
      { id: novoId(), nome: 'Alamos', produtor: 'Catena Zapata', regiao: 'Argentina, Mendoza', tipo: 'tinto', safra: ano - 2, qualidade: 3, quantidade: 1, preco: 89.9, uvas: ['malbec'] },
      { id: novoId(), nome: 'Brut Tradicional', produtor: 'Cave Geisse', regiao: 'Brasil, Serra Gaúcha', tipo: 'espumante', safra: ano - 2, qualidade: 4, quantidade: 1, preco: 139, uvas: ['espumante-tradicional'] },
      { id: novoId(), nome: 'Sauvignon Blanc', produtor: 'Villa Maria', regiao: 'Nova Zelândia', tipo: 'branco', safra: ano - 1, qualidade: 4, quantidade: 1, preco: 159, uvas: ['sauvignon-blanc'] },
      { id: novoId(), nome: 'Tawny 10 anos', produtor: 'Taylor\'s', regiao: 'Portugal, Douro', tipo: 'fortificado', safra: null, qualidade: 5, quantidade: 1, preco: 289, uvas: ['porto'] },
    );
    salvar();
  };

  // ---------- Resultados ----------
  // Cada linha guarda o contexto da harmonização para o botão "Discordo"
  let contextos = [];
  function linha(nota, titulo, sub, r, ctx) {
    const i = contextos.push({ ...ctx, nota_app: nota }) - 1;
    return `<div class="res"><div class="score" style="color:${corNota(nota)}">${nota}<small>${H.rotulo(nota).toLowerCase()}</small></div>
      <div><strong>${titulo}</strong>${sub ? `<div class="muted">${sub}</div>` : ''}
      <ul class="why">${r.pros.slice(0, 3).map(t => `<li class="p">${esc(t)}</li>`).join('')}${r.contras.slice(0, 2).map(t => `<li class="c">${esc(t)}</li>`).join('')}</ul>
      <button class="discordo" data-ctx="${i}">Discordo</button></div></div>`;
  }
  const bloco = html => `<div class="bloco">${html}</div>`;

  const dlgFb = $('#dlgFb'), frmFb = $('#frmFb');
  let ctxFb = null;
  document.addEventListener('click', e => {
    const b = e.target.closest('.discordo'); if (!b) return;
    ctxFb = contextos[b.dataset.ctx];
    frmFb.reset();
    frmFb.avaliador.value = lerPref('adega-avaliador');
    $('#fbResumo').textContent = `${ctxFb.vinho} (${ctxFb.uvas}) com ${ctxFb.prato}: o app deu nota ${ctxFb.nota_app}.`;
    dlgFb.showModal();
  });
  frmFb.addEventListener('submit', e => {
    if (e.submitter?.value !== 'ok') return;
    const d = Object.fromEntries(new FormData(frmFb));
    gravarPref('adega-avaliador', d.avaliador.trim());
    enviarFeedback({ tipo: 'harmonizacao', avaliador: d.avaliador.trim(), ...ctxFb, nota_avaliador: Number(d.nota), comentario: d.comentario.trim() })
      .then(() => toast('Obrigado, sua opinião foi registrada.'));
  });
  function perfilHtml(p) {
    const b = (n, v) => `<div>${n}<i style="--v:${v * 20}%"></i></div>`;
    return `<div class="perfil">${b('Corpo', p.corpo)}${b('Acidez', p.acidez)}${b('Tanino', p.tanino)}${b('Doçura', p.docura)}</div>`;
  }

  // ---------- Início: foto do rótulo ou do prato ----------
  const res = $('#resultado');
  let ultimaLeitura = null; // rótulo lido pela IA, para "Salvar na adega"
  function mostrarResultado(html) {
    res.innerHTML = html;
    res.hidden = false;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const topoRes = (img, etiqueta, titulo, detalhe) => `<div class="res-topo">
      ${img ? `<img src="${img}" alt="">` : ''}
      <div><span class="etq">${etiqueta}</span><h2 class="res-titulo">${esc(titulo)}</h2>${detalhe ? `<p class="muted">${detalhe}</p>` : ''}</div></div>`;
  const carregando = (img, texto) => mostrarResultado(`${topoRes(img, 'Analisando', texto, '')}<div class="girando" aria-hidden="true"></div>`);
  const falhou = (img, msg) => mostrarResultado(`${topoRes(img, 'Não deu certo', 'Não consegui ler a foto', esc(msg))}
      <div class="res-acoes"><button class="btn" data-nova>Tentar outra foto</button></div>`);

  // Procura no catálogo um rótulo com o mesmo produtor e nome, para descobrir a uva
  function uvasPeloCatalogo(v) {
    const termos = normaliza([v.produtor, v.nome].join(' ')).split(/\s+/).filter(t => t.length > 2 && !/^(19|20)\d{2}$/.test(t));
    if (!catalogo || termos.length < 2) return [];
    // Compara só nome e produtor; entre os candidatos, fica o de nome mais curto (o mais parecido)
    const candidatos = catalogo.filter(c => c.uvas.length && termos.every(t => normaliza(c.nome + ' ' + c.produtor).includes(t)))
      .sort((a, b) => a.nome.length - b.nome.length);
    return candidatos.length ? candidatos[0].uvas : [];
  }

  function resultadoVinho(v, img) {
    const titulo = [v.produtor, v.nome].filter(Boolean).join(' ') || nomesUvas(v);
    const detalhe = [v.safra, v.regiao, TIPOS[v.tipo], v.uvasTexto || nomesUvas(v)].filter(Boolean).map(esc).join(' · ');
    const salvar = ultimaLeitura ? '<button class="btn" data-salvar>Salvar na minha adega</button>' : '';
    if (!v.uvas.length) {
      return mostrarResultado(`${topoRes(img, 'Rótulo identificado', titulo, detalhe)}
        <div class="aviso-uva"><p>Não consegui identificar a uva deste vinho. Escolha a mais próxima para ver as harmonizações:</p>
        <select data-uva-manual><option value="">Escolha a uva</option>${UVAS.map(u => `<option value="${u.id}">${esc(u.nome)}</option>`).join('')}</select></div>
        <div class="res-acoes">${salvar}<button class="btn sec" data-nova>Nova consulta</button></div>`);
    }
    const p = H.perfilVinho(v), lista = H.pratosParaVinho(v);
    contextos = [];
    const ctx = r => ({ vinho: titulo, uvas: nomesUvas(v), prato: r.prato.nome });
    const bons = lista.filter(r => r.nota >= 55).slice(0, 6), ruins = lista.filter(r => r.nota < 40).slice(-3).reverse();
    mostrarResultado(`${topoRes(img, 'Rótulo identificado', titulo, detalhe)}
      ${perfilHtml(p)}
      <h3 class="res-sec">Pratos que combinam</h3>${bloco(bons.map(r => linha(r.nota, esc(r.prato.nome), esc(r.prato.cat), r, ctx(r))).join(''))}
      ${ruins.length ? `<h3 class="res-sec">Melhor evitar</h3>${bloco(ruins.map(r => linha(r.nota, esc(r.prato.nome), esc(r.prato.cat), r, ctx(r))).join(''))}` : ''}
      <div class="res-acoes">${salvar}<button class="btn sec" data-nova>Nova consulta</button></div>`);
  }
  let vinhoAtual = null, imgAtual = null;
  res.addEventListener('change', e => {
    if (!e.target.matches('[data-uva-manual]') || !e.target.value) return;
    vinhoAtual = { ...vinhoAtual, uvas: [e.target.value] };
    resultadoVinho(vinhoAtual, imgAtual);
  });

  function resultadoPrato(prato, img, detalhe) {
    contextos = [];
    const nome = prato.nome;
    const daAdega = adega.filter(v => Number(v.quantidade ?? 1) > 0 && v.uvas?.length)
      .map(v => ({ v, ...H.harmonizar(H.perfilVinho(v), prato) })).filter(r => r.nota >= 55)
      .sort((a, b) => b.nota - a.nota).slice(0, 5);
    const loja = (catalogo || []).filter(c => c.uvas.length)
      .map(c => ({ c, ...H.harmonizar(H.perfilVinho({ uvas: c.uvas, tipo: c.tipo }), prato) }))
      .sort((a, b) => b.nota - a.nota).slice(0, 5);
    const uvas = UVAS.map(u => ({ u, ...H.harmonizar(H.perfilVinho({ uvas: [u.id] }), prato) }))
      .sort((a, b) => b.nota - a.nota).slice(0, 4);
    mostrarResultado(`${topoRes(img, 'Prato identificado', nome, detalhe ? esc(detalhe) : '')}
      <h3 class="res-sec">Da sua adega</h3>${daAdega.length
        ? bloco(daAdega.map(r => linha(r.nota, esc([r.v.produtor, r.v.nome].filter(Boolean).join(' ')) + (r.v.safra ? ' ' + r.v.safra : ''),
            [esc(nomesUvas(r.v)), plural(Number(r.v.quantidade), 'garrafa', 'garrafas')].join(' · '), r, { vinho: r.v.nome, uvas: nomesUvas(r.v), prato: nome })).join(''))
        : `<p class="vazio">${adega.length ? 'Nenhuma garrafa da sua adega vai bem com este prato.' : 'Cadastre seus vinhos na Adega para ver sugestões do que você já tem.'}</p>`}
      ${loja.length ? `<h3 class="res-sec">Na Casa Rio Verde</h3>${bloco(loja.map(r => linha(r.nota, esc(r.c.nome),
        esc([r.c.produtor, r.c.pais, r.c.uvasTexto].filter(Boolean).join(' · ')), r, { vinho: r.c.nome, uvas: r.c.uvasTexto, prato: nome })).join(''))}` : ''}
      <h3 class="res-sec">Uvas que combinam</h3>${bloco(uvas.map(r => linha(r.nota, esc(r.u.nome), TIPOS[r.u.tipo] + ' · ' + esc(r.u.aromas), r,
        { vinho: '(uva) ' + r.u.nome, uvas: r.u.nome, prato: nome })).join(''))}
      <div class="res-acoes"><button class="btn sec" data-nova>Nova consulta</button></div>`);
  }

  res.addEventListener('click', e => {
    if (e.target.closest('[data-nova]')) { res.hidden = true; window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (e.target.closest('[data-salvar]') && ultimaLeitura) salvarLeitura(ultimaLeitura);
  });

  $('#camRotulo').onchange = async e => {
    const arq = e.target.files[0]; e.target.value = '';
    if (!arq) return;
    let img = null;
    try {
      img = await reduzirFoto(arq);
      carregando(img, 'Lendo o rótulo…');
      const [{ rotulo }] = await Promise.all([chamarN8n('ler_rotulo', { imagem: img }), carregarCatalogo().catch(() => null)]);
      ultimaLeitura = rotulo;
      const v = { nome: rotulo.nome, produtor: rotulo.produtor, regiao: rotulo.regiao, safra: rotulo.safra, tipo: rotulo.tipo,
        docura: rotulo.docura, uvasTexto: rotulo.uvas_texto, uvas: rotulo.uvas.length ? rotulo.uvas : [] };
      if (!v.uvas.length) v.uvas = uvasPeloCatalogo(v);
      vinhoAtual = v; imgAtual = img;
      resultadoVinho(v, img);
    } catch (err) { falhou(img, err.message); }
  };

  $('#camPrato').onchange = async e => {
    const arq = e.target.files[0]; e.target.value = '';
    if (!arq) return;
    let img = null;
    try {
      img = await reduzirFoto(arq);
      carregando(img, 'Identificando o prato…');
      const [{ prato: p }] = await Promise.all([chamarN8n('ler_prato', { imagem: img }), carregarCatalogo().catch(() => null)]);
      // Usa o perfil que a IA viu na foto; as tags do prato conhecido mais parecido entram como reforço
      const base = p.prato_id ? H.pratoPorId[p.prato_id] : null;
      const prato = { ...p, cat: base?.cat || '', tags: [...new Set([...(p.tags || []), ...(base?.tags || [])])] };
      resultadoPrato(prato, img, p.observacoes);
    } catch (err) { falhou(img, err.message); }
  };

  // Alternativa sem foto: escolher na lista
  function preencherSelVinho() {
    $('#selVinho').innerHTML = '<option value="">Escolha um vinho ou uma uva</option>' +
      (adega.length ? `<optgroup label="Minha adega">${adega.map(v => `<option value="a:${v.id}">${esc(v.nome)}${v.safra ? ' ' + v.safra : ''}</option>`).join('')}</optgroup>` : '') +
      `<optgroup label="Uvas">${UVAS.map(u => `<option value="u:${u.id}">${esc(u.nome)}</option>`).join('')}</optgroup>`;
  }
  $('#selVinho').onchange = e => {
    const [tipo, id] = e.target.value.split(':'); e.target.value = '';
    if (!id) return;
    ultimaLeitura = null; imgAtual = null;
    vinhoAtual = tipo === 'a' ? adega.find(v => v.id === id) : { uvas: [id], tipo: H.uvaPorId[id].tipo, nome: H.uvaPorId[id].nome };
    resultadoVinho(vinhoAtual, null);
  };
  const cats = [...new Set(PRATOS.map(p => p.cat))];
  $('#selPrato').innerHTML = '<option value="">Escolha o prato</option>' + cats.map(c =>
    `<optgroup label="${esc(c)}">${PRATOS.filter(p => p.cat === c).map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join('')}</optgroup>`).join('');
  $('#selPrato').onchange = e => {
    const id = e.target.value; e.target.value = '';
    if (id) resultadoPrato(H.pratoPorId[id], null, H.pratoPorId[id].cat);
  };
  document.querySelectorAll('[data-abrir]').forEach(b => b.onclick = () => {
    const alvo = $('#' + b.dataset.abrir); alvo.hidden = !alvo.hidden; if (!alvo.hidden) alvo.querySelector('select').focus();
  });

  // Harmonizar a partir da Adega ou do Catálogo leva para o Início com o resultado
  function harmonizarVinho(v) {
    ultimaLeitura = null; imgAtual = null; vinhoAtual = v;
    irPara('inicio');
    resultadoVinho(v, null);
  }

  function salvarLeitura(r) {
    abrirForm();
    for (const k of CAMPOS_IA) if (r[k] != null && r[k] !== '') frm[k].value = r[k];
    uvasSel = new Set(vinhoAtual?.uvas?.length ? vinhoAtual.uvas : r.uvas);
    chips();
    leituraIA = { ...r, uvas: [...r.uvas] };
    $('#iaStatus').textContent = 'Preenchido pela foto do rótulo. Confira os campos antes de salvar.';
  }

  // ---------- Guia de uvas ----------
  $('#listaUvas').innerHTML = UVAS.map(u => {
    const p = H.perfilVinho({ uvas: [u.id] });
    const top = H.pratosParaVinho({ uvas: [u.id] }).slice(0, 3).map(r => r.prato.nome.split(' / ')[0]).join(', ');
    return `<div class="uva"><h3>${esc(u.nome)}</h3>
      <div class="muted">${TIPOS[u.tipo]} · ${esc(u.aromas)}</div>${perfilHtml(p)}
      <div class="muted" style="margin-top:8px">Vai bem com ${esc(top.toLowerCase())}</div></div>`;
  }).join('');

  // ---------- Aba Catálogo ----------
  const POR_PAGINA = 30;
  let catVisiveis = POR_PAGINA, catFiltrados = [];
  $('#catTipo').innerHTML += Object.entries(TIPOS).map(([k, n]) => `<option value="${k}">${n}</option>`).join('');
  function renderCatalogo() {
    if (!catalogo) return;
    const termos = normaliza($('#catBusca').value).split(/\s+/).filter(Boolean);
    const tipo = $('#catTipo').value, pais = $('#catPais').value;
    catFiltrados = catalogo.filter(c => (!tipo || c.tipo === tipo) && (!pais || c.pais === pais) && termos.every(t => c.busca.includes(t)));
    const ver = catFiltrados.slice(0, catVisiveis);
    $('#catLista').innerHTML = catFiltrados.length
      ? `<div class="grupo"><span>${catFiltrados.length.toLocaleString('pt-BR')} ${catFiltrados.length === 1 ? 'rótulo' : 'rótulos'}</span></div>
        <div class="lista">${ver.map(c => `<article class="vinho" style="--cor:var(--${c.tipo || 'tinto'})">
          <div><h3>${esc(c.nome.replace(/\s*\b(19|20)\d{2}\b\s*$/, ''))}</h3>
            <div class="det">${esc([c.produtor, c.pais].filter(Boolean).join(', '))}${c.uvasTexto ? ' · ' + esc(c.uvasTexto) : ''}</div></div>
          <div><div class="safra">${c.safra || 'NV'}</div><div class="qtd">${TIPOS[c.tipo] || ''}</div></div>
          <div class="acoes">
            <button class="link" data-cat-harm="${catalogo.indexOf(c)}" ${c.uvas.length ? '' : 'disabled title="Uva ainda não reconhecida pelo app"'}>Harmonizar</button>
            <button class="link" data-cat-add="${catalogo.indexOf(c)}">Adicionar à adega</button>
          </div></article>`).join('')}</div>
        ${catFiltrados.length > catVisiveis ? '<div class="mais"><button class="btn sec" id="catMais">Mostrar mais</button></div>' : ''}`
      : '<p class="vazio">Nenhum rótulo encontrado.</p>';
  }
  const filtrarCatalogo = () => { catVisiveis = POR_PAGINA; renderCatalogo(); };
  $('#catBusca').oninput = filtrarCatalogo;
  $('#catTipo').onchange = filtrarCatalogo;
  $('#catPais').onchange = filtrarCatalogo;
  $('#catLista').onclick = e => {
    if (e.target.id === 'catMais') { catVisiveis += POR_PAGINA; renderCatalogo(); return; }
    const b = e.target.closest('button'); if (!b) return;
    const c = catalogo[b.dataset.catHarm ?? b.dataset.catAdd];
    if (b.dataset.catHarm != null) {
      harmonizarVinho({ nome: c.nome.replace(/\s*\b(19|20)\d{2}\b\s*$/, ''), produtor: c.produtor, regiao: c.pais, tipo: c.tipo, safra: c.safra, uvas: c.uvas, uvasTexto: c.uvasTexto });
    } else {
      abrirForm(); preencherDoCatalogo(c);
    }
  };
  carregarCatalogo().then(cat => {
    const paises = [...new Set(cat.map(c => c.pais).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
    $('#catPais').innerHTML += paises.map(p => `<option>${esc(p)}</option>`).join('');
    $('#catSub').textContent = `${cat.length.toLocaleString('pt-BR')} rótulos da Casa Rio Verde, em Belo Horizonte. Harmonize qualquer um ou leve para a sua adega.`;
    renderCatalogo();
  }).catch(() => { $('#catLista').innerHTML = '<p class="vazio">Não consegui carregar o catálogo agora. Verifique a conexão e abra a aba de novo.</p>'; });

  render();
})();
