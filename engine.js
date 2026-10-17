// Motor de harmonização: compara o perfil do vinho com o perfil do prato
// e devolve uma nota de 0 a 100 junto com os motivos.
(function (root) {
  const data = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root;
  const { UVAS, PRATOS } = data;

  const uvaPorId = Object.fromEntries(UVAS.map(u => [u.id, u]));
  const pratoPorId = Object.fromEntries(PRATOS.map(p => [p.id, p]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const media = arr => arr.reduce((s, x) => s + x, 0) / arr.length;

  // Ajustes de estilo aplicados sobre a média das uvas
  const AJUSTE_TIPO = {
    tinto: p => p,
    branco: p => ({ ...p, tanino: 1 }),
    rose: p => ({ ...p, tanino: 1, corpo: clamp(p.corpo - 1, 1, 5), acidez: clamp(p.acidez + 1, 1, 5) }),
    espumante: p => ({ ...p, tanino: 1, corpo: clamp(p.corpo - 1, 1, 5), acidez: clamp(p.acidez + 1, 1, 5) }),
    sobremesa: p => ({ ...p, docura: Math.max(p.docura, 4) }),
    fortificado: p => ({ ...p, docura: Math.max(p.docura, 4), corpo: 5 }),
  };

  // Gera o perfil sensorial de um vinho (da adega ou de uma uva isolada)
  function perfilVinho(vinho) {
    const uvas = (vinho.uvas || []).map(id => uvaPorId[id]).filter(Boolean);
    if (!uvas.length) return null;
    const tipo = vinho.tipo || uvas[0].tipo;
    let p = {
      tipo,
      corpo: Math.round(media(uvas.map(u => u.corpo))),
      acidez: Math.round(media(uvas.map(u => u.acidez))),
      tanino: Math.round(media(uvas.map(u => u.tanino))),
      docura: Math.round(media(uvas.map(u => u.docura))),
      combina: [...new Set(uvas.flatMap(u => u.combina))],
      evitar: [...new Set(uvas.flatMap(u => u.evitar))],
      guarda: [Math.min(...uvas.map(u => u.guarda[0])), Math.max(...uvas.map(u => u.guarda[1]))],
    };
    p = (AJUSTE_TIPO[tipo] || AJUSTE_TIPO.tinto)(p);
    if (vinho.docura) p.docura = vinho.docura; // ajuste manual (ex.: espumante demi-sec)
    return p;
  }

  function harmonizar(v, prato) {
    let nota = 60;
    const pros = [], contras = [];
    const pro = (pts, txt) => { nota += pts; pros.push(txt); };
    const contra = (pts, txt) => { nota -= pts; contras.push(txt); };

    // 1. Peso: corpo do vinho x intensidade do prato
    const dif = Math.abs(v.corpo - prato.intensidade);
    if (dif === 0) pro(8, 'Mesmo peso: corpo do vinho e intensidade do prato equilibrados');
    else if (dif >= 2) contra(8 * (dif - 1), v.corpo > prato.intensidade
      ? 'Vinho encorpado demais: vai abafar o prato' : 'Vinho leve demais: o prato vai dominar');

    // 2. Tanino
    if ((prato.proteina === 'peixe' || prato.proteina === 'fruto-mar') && v.tanino >= 3)
      contra(10 * (v.tanino - 2), 'Tanino alto com peixe/fruto do mar deixa gosto metálico');
    if (prato.gordura >= 4 && v.tanino >= 4) pro(8, 'Tanino corta a gordura e a proteína do prato');
    if (prato.proteina === 'vermelha' && v.tanino <= 1 && prato.intensidade >= 4)
      contra(6, 'Falta estrutura (tanino) para carne vermelha');

    // 3. Acidez
    if (prato.acidez > v.acidez) contra(6 * (prato.acidez - v.acidez), 'Prato mais ácido que o vinho: o vinho fica sem graça');
    else if (prato.acidez >= 4 && v.acidez >= 4) pro(6, 'Acidez do vinho acompanha a acidez do prato');
    if (prato.gordura >= 4 && v.acidez >= 4) pro(5, 'Acidez limpa o paladar depois de pratos gordurosos');

    // 4. Doçura: o vinho precisa ser pelo menos tão doce quanto o prato
    if (prato.docura > v.docura + 1) contra(10 * (prato.docura - v.docura - 1), 'Prato mais doce que o vinho: o vinho fica amargo');
    else if (prato.docura >= 4 && v.docura >= 4) pro(12, 'Doçura do vinho à altura da sobremesa');
    if (v.docura >= 4 && prato.docura <= 2 && prato.proteina !== 'queijo') contra(10, 'Vinho doce demais para prato salgado');

    // 5. Picância
    if (prato.picancia >= 3) {
      if (v.tanino >= 4) contra(6 * (v.tanino - 3), 'Tanino amplifica a ardência da pimenta');
      if (v.docura >= 2 && v.docura <= 4) pro(8, 'Leve doçura acalma a pimenta');
      if (v.corpo >= 5) contra(4, 'Vinhos potentes (álcool alto) aumentam a ardência');
    }

    // 6. Afinidades clássicas (tags)
    const afins = prato.tags.filter(t => v.combina.includes(t));
    if (afins.length) pro(Math.min(afins.length, 2) * 10, 'Combinação clássica para este tipo de prato');
    if (prato.tags.some(t => v.evitar.includes(t))) contra(15, 'Combinação que sommeliers costumam evitar');

    // 7. Espumante: coringa para frituras e salgados
    if (v.tipo === 'espumante' && (prato.tags.includes('frituras') || prato.tags.includes('salgadinhos')))
      pro(6, 'Borbulhas e acidez limpam a fritura');

    return { nota: clamp(Math.round(nota), 0, 100), pros, contras };
  }

  function rotulo(nota) {
    if (nota >= 85) return 'Excelente';
    if (nota >= 70) return 'Muito boa';
    if (nota >= 55) return 'Boa';
    if (nota >= 40) return 'Aceitável';
    return 'Evite';
  }

  // Situação da safra pela janela de guarda das uvas
  function janela(vinho, anoAtual = new Date().getFullYear()) {
    const p = perfilVinho(vinho);
    if (!p || !vinho.safra) return null;
    const idade = anoAtual - Number(vinho.safra);
    if (idade < p.guarda[0]) return { status: 'jovem', texto: `Jovem: ideal a partir de ${Number(vinho.safra) + p.guarda[0]}` };
    if (idade > p.guarda[1]) return { status: 'passando', texto: 'Pode estar passando do ponto: beba logo' };
    return { status: 'ponto', texto: `No ponto: beber até ~${Number(vinho.safra) + p.guarda[1]}` };
  }

  function pratosParaVinho(vinho) {
    const p = perfilVinho(vinho);
    if (!p) return [];
    return PRATOS.map(prato => ({ prato, ...harmonizar(p, prato) })).sort((a, b) => b.nota - a.nota);
  }

  function vinhosParaPrato(pratoId, adega) {
    const prato = pratoPorId[pratoId];
    if (!prato) return { adega: [], uvas: [] };
    const daAdega = adega
      .filter(v => (v.quantidade ?? 1) > 0)
      .map(v => ({ vinho: v, ...harmonizar(perfilVinho(v), prato) }))
      .filter(r => r.nota != null)
      .sort((a, b) => b.nota - a.nota || (b.vinho.qualidade || 0) - (a.vinho.qualidade || 0));
    const uvas = UVAS.map(u => ({ uva: u, ...harmonizar(perfilVinho({ uvas: [u.id] }), prato) }))
      .sort((a, b) => b.nota - a.nota);
    return { adega: daAdega, uvas };
  }

  const api = { perfilVinho, harmonizar, rotulo, janela, pratosParaVinho, vinhosParaPrato, uvaPorId, pratoPorId };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Harmonizador = api;
})(this);
