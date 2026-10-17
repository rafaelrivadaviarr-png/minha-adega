(function () {
  const H = window.Harmonizador;
  const CHAVE = 'minha-adega-v1';
  const TIPOS = { tinto: 'Tinto', branco: 'Branco', rose: 'Rosé', espumante: 'Espumante', sobremesa: 'Sobremesa', fortificado: 'Fortificado' };
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const estrelas = n => n ? '<span class="stars">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</span>' : '';
  const corNota = n => n >= 85 ? 'var(--ok)' : n >= 70 ? '#4f8a3a' : n >= 55 ? 'var(--warn)' : n >= 40 ? '#c0632a' : 'var(--bad)';
  const nomesUvas = v => (v.uvas || []).map(id => H.uvaPorId[id]?.nome || id).join(', ');

  // ---------- Persistência (localStorage + backup em JSON) ----------
  let adega = [];
  try { adega = JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { adega = []; }
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(adega)); } catch { /* armazenamento indisponível */ } render(); };
  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

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
    $('#resumo').textContent = adega.length
      ? `${adega.length} rótulo(s) · ${garrafas} garrafa(s)` + (valor ? ` · R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em estoque` : '')
      : '';
    $('#listaAdega').innerHTML = lista.length ? lista.map(v => {
      const j = H.janela(v);
      const top = H.pratosParaVinho(v).slice(0, 3).map(r => r.prato.nome.split(' / ')[0]).join(', ');
      return `<div class="card">
        <h3><span class="dot" style="background:var(--${v.tipo})"></span>${esc(v.nome)}</h3>
        <div class="muted">${esc([v.produtor, v.regiao, v.safra].filter(Boolean).join(' · '))}</div>
        <div style="margin:6px 0">${estrelas(Number(v.qualidade))}</div>
        <div><span class="tag">${TIPOS[v.tipo]}</span><span class="tag">${esc(nomesUvas(v))}</span>
          <span class="tag">${Number(v.quantidade || 0)} garrafa(s)</span>${j ? `<span class="tag ${j.status}">${j.texto}</span>` : ''}</div>
        <p class="muted" style="margin-top:8px">🍽️ Vai bem com: ${esc(top)}</p>
        <div class="row" style="margin:10px 0 0">
          <button class="btn sm" data-harm="${v.id}">Harmonizar</button>
          <button class="btn sec sm" data-edit="${v.id}">Editar</button>
          <button class="btn sec sm" data-beber="${v.id}" ${Number(v.quantidade) > 0 ? '' : 'disabled'}>Abri uma 🍾</button>
        </div></div>`;
    }).join('') : `<div class="empty card" style="grid-column:1/-1">${adega.length ? 'Nenhum vinho encontrado com esse filtro.' : 'Sua adega está vazia. Clique em <b>+ Adicionar vinho</b> ou em <b>Carregar exemplos</b>.'}</div>`;
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
  let editando = null, uvasSel = new Set();

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
  function linha(nota, titulo, sub, r) {
    return `<div class="res"><div class="score" style="background:${corNota(nota)}">${nota}<small>${H.rotulo(nota)}</small></div>
      <div><strong>${titulo}</strong>${sub ? `<div class="muted">${sub}</div>` : ''}
      <ul class="why">${r.pros.slice(0, 3).map(t => `<li class="p">${esc(t)}</li>`).join('')}${r.contras.slice(0, 2).map(t => `<li class="c">${esc(t)}</li>`).join('')}</ul></div></div>`;
  }
  function perfilHtml(p) {
    const b = (n, v) => `<span>${n}</span><div class="bar"><i style="width:${v * 20}%"></i></div>`;
    return `<div class="prof">${b('Corpo', p.corpo)}${b('Acidez', p.acidez)}${b('Tanino', p.tanino)}${b('Doçura', p.docura)}</div>`;
  }

  function preencherSelVinho() {
    const atual = $('#selVinho').value;
    $('#selVinho').innerHTML = '<option value="">— escolha —</option>' + adega.map(v => `<option value="${v.id}">${esc(v.nome)}${v.safra ? ' ' + v.safra : ''}</option>`).join('');
    $('#selVinho').value = adega.some(v => v.id === atual) ? atual : '';
  }
  $('#selUva').innerHTML = '<option value="">— escolha —</option>' + UVAS.map(u => `<option value="${u.id}">${esc(u.nome)}</option>`).join('');
  $('#selVinho').onchange = () => { $('#selUva').value = ''; mostrarVinho(); };
  $('#selUva').onchange = () => { $('#selVinho').value = ''; mostrarVinho(); };

  function mostrarVinho() {
    const v = adega.find(x => x.id === $('#selVinho').value) || ($('#selUva').value ? { uvas: [$('#selUva').value] } : null);
    if (!v) { $('#resVinho').innerHTML = '<div class="empty card">Escolha um vinho da adega ou uma uva para ver as harmonizações.</div>'; return; }
    const p = H.perfilVinho(v), res = H.pratosParaVinho(v);
    const bons = res.filter(r => r.nota >= 55), ruins = res.filter(r => r.nota < 40).slice(-4).reverse();
    $('#resVinho').innerHTML = `<div class="card"><h3>${esc(v.nome || nomesUvas(v))}</h3>
        <div class="muted">${TIPOS[p.tipo]} · ${esc(nomesUvas(v))}</div>${perfilHtml(p)}</div>
      <h2>Melhores pratos</h2><div class="card">${bons.slice(0, 8).map(r => linha(r.nota, esc(r.prato.nome), esc(r.prato.cat), r)).join('')}</div>
      ${ruins.length ? `<h2>Evite</h2><div class="card">${ruins.map(r => linha(r.nota, esc(r.prato.nome), esc(r.prato.cat), r)).join('')}</div>` : ''}`;
  }

  const cats = [...new Set(PRATOS.map(p => p.cat))];
  $('#selPrato').innerHTML = '<option value="">— escolha o prato —</option>' + cats.map(c =>
    `<optgroup label="${esc(c)}">${PRATOS.filter(p => p.cat === c).map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join('')}</optgroup>`).join('');
  $('#selPrato').onchange = mostrarComida;

  function mostrarComida() {
    const id = $('#selPrato').value;
    if (!id) { $('#resComida').innerHTML = '<div class="empty card">Escolha um prato para ver qual vinho abrir.</div>'; return; }
    const { adega: daAdega, uvas } = H.vinhosParaPrato(id, adega);
    const bons = daAdega.filter(r => r.nota >= 55);
    $('#resComida').innerHTML = `<h2>Da sua adega</h2><div class="card">${
      bons.length ? bons.slice(0, 6).map(r => linha(r.nota, esc(r.vinho.nome) + (r.vinho.safra ? ' ' + r.vinho.safra : ''),
        [esc(nomesUvas(r.vinho)), estrelas(Number(r.vinho.qualidade)), `${r.vinho.quantidade} garrafa(s)`].filter(Boolean).join(' · '), r)).join('')
      : `<p class="muted">${adega.length ? 'Nenhum vinho da adega combina bem com esse prato. Veja abaixo o que vale comprar.' : 'Cadastre seus vinhos na aba Adega para ver sugestões daqui.'}</p>`}</div>
      <h2>Uvas ideais (para comprar)</h2><div class="card">${uvas.slice(0, 5).map(r => linha(r.nota, esc(r.uva.nome), TIPOS[r.uva.tipo] + ' · ' + esc(r.uva.aromas), r)).join('')}</div>`;
  }

  // ---------- Guia de uvas ----------
  $('#listaUvas').innerHTML = UVAS.map(u => {
    const p = H.perfilVinho({ uvas: [u.id] });
    const top = H.pratosParaVinho({ uvas: [u.id] }).slice(0, 4).map(r => r.prato.nome.split(' / ')[0]).join(', ');
    return `<div class="card"><h3><span class="dot" style="background:var(--${u.tipo})"></span>${esc(u.nome)}</h3>
      <div class="muted">${TIPOS[u.tipo]} · ${esc(u.aromas)}</div>${perfilHtml(p)}
      <p class="muted" style="margin-top:8px">🍽️ ${esc(top)}</p></div>`;
  }).join('');

  render(); mostrarVinho(); mostrarComida();
})();
