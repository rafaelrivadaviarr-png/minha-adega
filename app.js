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
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
    document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('section').forEach(s => s.classList.toggle('on', s.id === b.dataset.tab));
  });
  function irPara(tab) { document.querySelector(`nav button[data-tab="${tab}"]`).click(); window.scrollTo(0, 0); }

  // ---------- Adega ----------
  function render() {
    const termo = $('#busca').value.trim().toLowerCase();
    const tipo = $('#filtroTipo').value;
    const lista = adega.filter(v => (!tipo || v.tipo === tipo) &&
      (!termo || [v.nome, v.produtor, v.regiao, nomesUvas(v)].join(' ').toLowerCase().includes(termo)));
    const garrafas = adega.reduce((s, v) => s + Number(v.quantidade || 0), 0);
    const valor = adega.reduce((s, v) => s + Number(v.quantidade || 0) * Number(v.preco || 0), 0);
    $('#resumo').innerHTML = adega.length
      ? plural(garrafas, 'garrafa', 'garrafas') + (valor ? `<br>R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '')
      : '';
    const item = v => {
      const j = H.janela(v);
      const top = H.pratosParaVinho(v).slice(0, 3).map(r => r.prato.nome.split(' / ')[0].toLowerCase()).join(', ');
      const qtd = Number(v.quantidade || 0);
      return `<article class="vinho">
        <div><h3>${esc(v.nome)}</h3>
          <div class="det">${esc([v.produtor, v.regiao].filter(Boolean).join(', '))}${v.produtor || v.regiao ? ' · ' : ''}${esc(nomesUvas(v))}</div></div>
        <div><div class="safra">${v.safra || 'NV'}</div><div class="qtd">${qtd ? plural(qtd, 'garrafa', 'garrafas') : 'acabou'}</div></div>
        <div class="extra">${estrelas(Number(v.qualidade))}${v.qualidade && j ? ' &nbsp; ' : ''}${j ? `<span class="est ${j.status}">${j.texto}</span>` : ''}
          <div><i>com ${esc(top)}</i></div></div>
        <div class="acoes">
          <button class="link" data-harm="${v.id}">Harmonizar</button>
          <button class="link" data-edit="${v.id}">Editar</button>
          <button class="link" data-beber="${v.id}" ${qtd > 0 ? '' : 'disabled'}>Abri uma garrafa</button>
        </div></article>`;
    };
    $('#listaAdega').innerHTML = lista.length
      ? Object.keys(GRUPOS).map(t => {
          const doTipo = lista.filter(v => v.tipo === t);
          return doTipo.length ? `<h2 class="grupo"><span>${GRUPOS[t]}</span><span>${doTipo.length}</span></h2>${doTipo.map(item).join('')}` : '';
        }).join('')
      : `<p class="vazio">${adega.length ? 'Nada encontrado com esse filtro.' : 'A adega está vazia. Adicione o primeiro vinho, ou carregue os exemplos para conhecer o app.'}</p>`;
    preencherSelVinho();
  }

  $('#listaAdega').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.edit) abrirForm(adega.find(v => v.id === b.dataset.edit));
    if (b.dataset.harm) { $('#selVinho').value = b.dataset.harm; $('#selUva').value = ''; mostrarVinho(); irPara('vinho'); }
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
  const CHAVE_CAT = 'adega-catalogo-v1';
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
      ({ nome, produtor, pais, tipo, safra, uvas: uvas ? uvas.split(',') : [], uvasTexto, busca: normaliza(nome + ' ' + produtor) }));
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
    const c = achados[b.dataset.i];
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
  });

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
    const b = (n, v) => `<div>${n}<b>${'●'.repeat(v)}${'○'.repeat(5 - v)}</b></div>`;
    return `<div class="perfil">${b('Corpo', p.corpo)}${b('Acidez', p.acidez)}${b('Tanino', p.tanino)}${b('Doçura', p.docura)}</div>`;
  }

  function preencherSelVinho() {
    const atual = $('#selVinho').value;
    $('#selVinho').innerHTML = '<option value="">Escolha</option>' + adega.map(v => `<option value="${v.id}">${esc(v.nome)}${v.safra ? ' ' + v.safra : ''}</option>`).join('');
    $('#selVinho').value = adega.some(v => v.id === atual) ? atual : '';
  }
  $('#selUva').innerHTML = '<option value="">Escolha</option>' + UVAS.map(u => `<option value="${u.id}">${esc(u.nome)}</option>`).join('');
  $('#selVinho').onchange = () => { $('#selUva').value = ''; mostrarVinho(); };
  $('#selUva').onchange = () => { $('#selVinho').value = ''; mostrarVinho(); };

  function mostrarVinho() {
    const v = adega.find(x => x.id === $('#selVinho').value) || ($('#selUva').value ? { uvas: [$('#selUva').value] } : null);
    if (!v) { $('#resVinho').innerHTML = '<p class="vazio">Escolha um vinho da adega, ou uma uva, para ver o que servir.</p>'; return; }
    const p = H.perfilVinho(v), res = H.pratosParaVinho(v);
    contextos = [];
    const ctx = r => ({ vinho: v.nome || nomesUvas(v), uvas: nomesUvas(v), prato: r.prato.nome });
    const bons = res.filter(r => r.nota >= 55), ruins = res.filter(r => r.nota < 40).slice(-4).reverse();
    $('#resVinho').innerHTML = `<div class="ficha"><h3>${esc(v.nome || nomesUvas(v))}</h3>
        <div class="muted">${TIPOS[p.tipo]} · ${esc(nomesUvas(v))}</div>${perfilHtml(p)}</div>
      <h2>Bons acompanhamentos</h2>${bons.slice(0, 8).map(r => linha(r.nota, esc(r.prato.nome), esc(r.prato.cat), r, ctx(r))).join('')}
      ${ruins.length ? `<h2>Melhor evitar</h2>${ruins.map(r => linha(r.nota, esc(r.prato.nome), esc(r.prato.cat), r, ctx(r))).join('')}` : ''}`;
  }

  const cats = [...new Set(PRATOS.map(p => p.cat))];
  $('#selPrato').innerHTML = '<option value="">Escolha o prato</option>' + cats.map(c =>
    `<optgroup label="${esc(c)}">${PRATOS.filter(p => p.cat === c).map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join('')}</optgroup>`).join('');
  $('#selPrato').onchange = mostrarComida;

  function mostrarComida() {
    const id = $('#selPrato').value;
    if (!id) { $('#resComida').innerHTML = '<p class="vazio">Escolha o prato e veja qual garrafa abrir.</p>'; return; }
    const { adega: daAdega, uvas } = H.vinhosParaPrato(id, adega);
    const prato = H.pratoPorId[id].nome;
    contextos = [];
    const bons = daAdega.filter(r => r.nota >= 55);
    $('#resComida').innerHTML = `<h2>Da sua adega</h2>${
      bons.length ? bons.slice(0, 6).map(r => linha(r.nota, esc(r.vinho.nome) + (r.vinho.safra ? ' ' + r.vinho.safra : ''),
        [esc(nomesUvas(r.vinho)), estrelas(Number(r.vinho.qualidade)), plural(Number(r.vinho.quantidade), 'garrafa', 'garrafas')].filter(Boolean).join(' · '), r,
        { vinho: r.vinho.nome, uvas: nomesUvas(r.vinho), prato })).join('')
      : `<p class="vazio">${adega.length ? 'Nenhuma garrafa da adega vai bem com esse prato. Abaixo, o que vale comprar.' : 'Cadastre seus vinhos na Carta para ver sugestões daqui.'}</p>`}
      <h2>Se for comprar</h2>${uvas.slice(0, 5).map(r => linha(r.nota, esc(r.uva.nome), TIPOS[r.uva.tipo] + ' · ' + esc(r.uva.aromas), r,
        { vinho: '(uva) ' + r.uva.nome, uvas: r.uva.nome, prato })).join('')}`;
  }

  // ---------- Guia de uvas ----------
  $('#listaUvas').innerHTML = UVAS.map(u => {
    const p = H.perfilVinho({ uvas: [u.id] });
    const top = H.pratosParaVinho({ uvas: [u.id] }).slice(0, 3).map(r => r.prato.nome.split(' / ')[0]).join(', ');
    return `<div class="uva"><h3>${esc(u.nome)}</h3>
      <div class="muted">${TIPOS[u.tipo]} · ${esc(u.aromas)}</div>${perfilHtml(p)}
      <div class="muted" style="margin-top:6px"><i style="font-family:var(--serif)">com ${esc(top.toLowerCase())}</i></div></div>`;
  }).join('');

  render(); mostrarVinho(); mostrarComida();
})();
