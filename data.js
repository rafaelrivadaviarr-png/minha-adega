// Base de conhecimento: uvas e pratos.
// Escalas de 1 a 5 (picancia de 0 a 5). As tags ligam as uvas aos pratos.
(function (root) {
  const UVAS = [
    // ---------- Tintas ----------
    { id: 'cabernet-sauvignon', nome: 'Cabernet Sauvignon', tipo: 'tinto', corpo: 5, acidez: 3, tanino: 5, docura: 1,
      aromas: 'cassis, pimentão, cedro, tabaco', guarda: [4, 15],
      combina: ['carne-vermelha', 'churrasco', 'cordeiro', 'queijo-duro', 'ensopado'], evitar: ['peixe-magro', 'frutos-do-mar', 'sobremesa-fruta'] },
    { id: 'merlot', nome: 'Merlot', tipo: 'tinto', corpo: 4, acidez: 3, tanino: 3, docura: 1,
      aromas: 'ameixa, cereja, chocolate', guarda: [2, 10],
      combina: ['carne-vermelha', 'massa-tomate', 'cogumelos', 'porco', 'frango', 'pizza'], evitar: ['peixe-magro'] },
    { id: 'malbec', nome: 'Malbec', tipo: 'tinto', corpo: 5, acidez: 3, tanino: 4, docura: 1,
      aromas: 'amora, violeta, ameixa, cacau', guarda: [2, 10],
      combina: ['churrasco', 'carne-vermelha', 'defumado', 'embutidos'], evitar: ['peixe-magro', 'frutos-do-mar'] },
    { id: 'pinot-noir', nome: 'Pinot Noir', tipo: 'tinto', corpo: 2, acidez: 4, tanino: 2, docura: 1,
      aromas: 'cereja, framboesa, terra, cogumelo', guarda: [2, 10],
      combina: ['cogumelos', 'frango', 'peixe-gordo', 'porco', 'queijo-macio', 'pato'], evitar: ['comida-apimentada'] },
    { id: 'syrah', nome: 'Syrah / Shiraz', tipo: 'tinto', corpo: 5, acidez: 3, tanino: 4, docura: 1,
      aromas: 'amora, pimenta-do-reino, defumado', guarda: [3, 12],
      combina: ['churrasco', 'defumado', 'cordeiro', 'ensopado', 'embutidos'], evitar: ['peixe-magro'] },
    { id: 'tannat', nome: 'Tannat', tipo: 'tinto', corpo: 5, acidez: 4, tanino: 5, docura: 1,
      aromas: 'amora, alcaçuz, tostado', guarda: [5, 20],
      combina: ['churrasco', 'carne-vermelha', 'mineira', 'queijo-duro', 'ensopado'], evitar: ['peixe-magro', 'frutos-do-mar', 'salada'] },
    { id: 'carmenere', nome: 'Carménère', tipo: 'tinto', corpo: 4, acidez: 3, tanino: 3, docura: 1,
      aromas: 'pimentão, frutas vermelhas, especiarias', guarda: [2, 8],
      combina: ['carne-vermelha', 'comida-mexicana', 'porco', 'ensopado'], evitar: ['peixe-magro'] },
    { id: 'tempranillo', nome: 'Tempranillo', tipo: 'tinto', corpo: 4, acidez: 3, tanino: 4, docura: 1,
      aromas: 'cereja, couro, baunilha', guarda: [3, 15],
      combina: ['cordeiro', 'embutidos', 'porco', 'queijo-duro', 'defumado'], evitar: ['peixe-magro'] },
    { id: 'sangiovese', nome: 'Sangiovese', tipo: 'tinto', corpo: 3, acidez: 5, tanino: 4, docura: 1,
      aromas: 'cereja azeda, tomate, ervas', guarda: [3, 12],
      combina: ['massa-tomate', 'pizza', 'carne-vermelha', 'queijo-duro', 'embutidos'], evitar: ['comida-apimentada'] },
    { id: 'nebbiolo', nome: 'Nebbiolo', tipo: 'tinto', corpo: 4, acidez: 5, tanino: 5, docura: 1,
      aromas: 'rosa, alcatrão, cereja, trufa', guarda: [6, 25],
      combina: ['cogumelos', 'carne-vermelha', 'massa-creme', 'queijo-duro', 'ensopado'], evitar: ['peixe-magro', 'comida-apimentada'] },
    { id: 'grenache', nome: 'Grenache / Garnacha', tipo: 'tinto', corpo: 4, acidez: 2, tanino: 2, docura: 1,
      aromas: 'morango, framboesa, especiarias', guarda: [2, 8],
      combina: ['churrasco', 'porco', 'comida-apimentada', 'embutidos'], evitar: [] },
    { id: 'zinfandel', nome: 'Zinfandel / Primitivo', tipo: 'tinto', corpo: 5, acidez: 3, tanino: 3, docura: 2,
      aromas: 'geleia de frutas, pimenta, passas', guarda: [2, 8],
      combina: ['churrasco', 'defumado', 'pizza', 'comida-apimentada', 'porco'], evitar: ['peixe-magro'] },
    { id: 'touriga-nacional', nome: 'Touriga Nacional', tipo: 'tinto', corpo: 5, acidez: 3, tanino: 4, docura: 1,
      aromas: 'violeta, amora, bergamota', guarda: [4, 15],
      combina: ['carne-vermelha', 'cordeiro', 'bacalhau', 'queijo-duro', 'ensopado'], evitar: ['peixe-magro'] },
    { id: 'cabernet-franc', nome: 'Cabernet Franc', tipo: 'tinto', corpo: 3, acidez: 4, tanino: 3, docura: 1,
      aromas: 'framboesa, pimentão, grafite', guarda: [3, 12],
      combina: ['porco', 'frango', 'cogumelos', 'queijo-macio', 'vegetariano'], evitar: [] },
    { id: 'gamay', nome: 'Gamay (Beaujolais)', tipo: 'tinto', corpo: 2, acidez: 4, tanino: 1, docura: 1,
      aromas: 'morango, banana, flores', guarda: [0, 4],
      combina: ['embutidos', 'frango', 'salada', 'queijo-macio', 'peixe-gordo', 'porco'], evitar: [] },
    { id: 'barbera', nome: 'Barbera', tipo: 'tinto', corpo: 3, acidez: 5, tanino: 2, docura: 1,
      aromas: 'cereja, ameixa, ervas', guarda: [1, 8],
      combina: ['massa-tomate', 'pizza', 'embutidos', 'cogumelos'], evitar: [] },
    { id: 'bonarda', nome: 'Bonarda', tipo: 'tinto', corpo: 3, acidez: 3, tanino: 2, docura: 1,
      aromas: 'ameixa, cereja, especiarias suaves', guarda: [1, 5],
      combina: ['pizza', 'massa-tomate', 'churrasco', 'mineira'], evitar: [] },

    // ---------- Brancas ----------
    { id: 'chardonnay', nome: 'Chardonnay', tipo: 'branco', corpo: 4, acidez: 3, tanino: 1, docura: 1,
      aromas: 'maçã, manteiga, baunilha (com barrica)', guarda: [1, 8],
      combina: ['massa-creme', 'frango', 'peixe-gordo', 'frutos-do-mar', 'cogumelos'], evitar: ['comida-apimentada'] },
    { id: 'sauvignon-blanc', nome: 'Sauvignon Blanc', tipo: 'branco', corpo: 2, acidez: 5, tanino: 1, docura: 1,
      aromas: 'maracujá, limão, grama cortada', guarda: [0, 3],
      combina: ['salada', 'peixe-magro', 'frutos-do-mar', 'queijo-macio', 'vegetariano', 'asiatica'], evitar: ['carne-vermelha'] },
    { id: 'riesling', nome: 'Riesling', tipo: 'branco', corpo: 2, acidez: 5, tanino: 1, docura: 2,
      aromas: 'lima, pêssego, mel, petróleo', guarda: [1, 15],
      combina: ['comida-apimentada', 'asiatica', 'porco', 'peixe-magro', 'frutos-do-mar'], evitar: ['carne-vermelha'] },
    { id: 'pinot-grigio', nome: 'Pinot Grigio', tipo: 'branco', corpo: 2, acidez: 3, tanino: 1, docura: 1,
      aromas: 'pera, limão, amêndoa', guarda: [0, 3],
      combina: ['peixe-magro', 'salada', 'frutos-do-mar', 'massa-leve'], evitar: ['carne-vermelha'] },
    { id: 'alvarinho', nome: 'Alvarinho / Albariño', tipo: 'branco', corpo: 2, acidez: 5, tanino: 1, docura: 1,
      aromas: 'pêssego, flor de laranjeira, salinidade', guarda: [0, 4],
      combina: ['frutos-do-mar', 'peixe-magro', 'bacalhau', 'asiatica', 'salada'], evitar: ['carne-vermelha'] },
    { id: 'gewurztraminer', nome: 'Gewürztraminer', tipo: 'branco', corpo: 4, acidez: 2, tanino: 1, docura: 2,
      aromas: 'lichia, rosa, gengibre', guarda: [1, 6],
      combina: ['asiatica', 'comida-apimentada', 'queijo-macio', 'queijo-azul'], evitar: ['carne-vermelha'] },
    { id: 'viognier', nome: 'Viognier', tipo: 'branco', corpo: 4, acidez: 2, tanino: 1, docura: 1,
      aromas: 'damasco, pêssego, flores brancas', guarda: [0, 4],
      combina: ['frango', 'asiatica', 'frutos-do-mar', 'comida-apimentada'], evitar: ['carne-vermelha'] },
    { id: 'chenin-blanc', nome: 'Chenin Blanc', tipo: 'branco', corpo: 3, acidez: 5, tanino: 1, docura: 2,
      aromas: 'maçã, marmelo, mel', guarda: [1, 10],
      combina: ['porco', 'frango', 'asiatica', 'queijo-macio', 'frutos-do-mar'], evitar: ['carne-vermelha'] },
    { id: 'torrontes', nome: 'Torrontés', tipo: 'branco', corpo: 2, acidez: 3, tanino: 1, docura: 1,
      aromas: 'flores, pêssego, cítricos', guarda: [0, 2],
      combina: ['asiatica', 'comida-apimentada', 'salada', 'frutos-do-mar'], evitar: ['carne-vermelha'] },

    // ---------- Espumantes / Sobremesa ----------
    { id: 'espumante-tradicional', nome: 'Espumante método tradicional (Champagne/Cava)', tipo: 'espumante', corpo: 2, acidez: 5, tanino: 1, docura: 1,
      aromas: 'brioche, maçã verde, limão', guarda: [0, 8],
      combina: ['frituras', 'frutos-do-mar', 'queijo-macio', 'salgadinhos', 'peixe-magro', 'mineira'], evitar: ['sobremesa-chocolate'] },
    { id: 'prosecco', nome: 'Prosecco (Glera)', tipo: 'espumante', corpo: 1, acidez: 4, tanino: 1, docura: 2,
      aromas: 'pera, maçã, flores brancas', guarda: [0, 2],
      combina: ['salgadinhos', 'frituras', 'salada', 'asiatica', 'embutidos'], evitar: ['carne-vermelha'] },
    { id: 'moscatel', nome: 'Moscatel / Moscato', tipo: 'sobremesa', corpo: 2, acidez: 3, tanino: 1, docura: 4,
      aromas: 'uva fresca, flor de laranjeira, pêssego', guarda: [0, 3],
      combina: ['sobremesa-fruta', 'comida-apimentada', 'doce-de-leite'], evitar: ['carne-vermelha'] },
    { id: 'porto', nome: 'Vinho do Porto (tawny/ruby)', tipo: 'fortificado', corpo: 5, acidez: 3, tanino: 3, docura: 5,
      aromas: 'frutas secas, caramelo, nozes', guarda: [0, 30],
      combina: ['sobremesa-chocolate', 'queijo-azul', 'queijo-duro', 'doce-de-leite'], evitar: ['peixe-magro', 'salada'] },
  ];

  // proteina: base do prato (usada nas regras de tanino)
  const PRATOS = [
    // Carnes vermelhas
    { id: 'picanha', nome: 'Picanha / churrasco', cat: 'Carnes', proteina: 'vermelha', intensidade: 5, gordura: 5, acidez: 1, docura: 1, picancia: 0, tags: ['churrasco', 'carne-vermelha'] },
    { id: 'file-mignon', nome: 'Filé mignon ao molho madeira', cat: 'Carnes', proteina: 'vermelha', intensidade: 4, gordura: 3, acidez: 2, docura: 2, picancia: 0, tags: ['carne-vermelha', 'cogumelos'] },
    { id: 'costela', nome: 'Costela no bafo', cat: 'Carnes', proteina: 'vermelha', intensidade: 5, gordura: 5, acidez: 1, docura: 1, picancia: 0, tags: ['churrasco', 'carne-vermelha', 'defumado'] },
    { id: 'hamburguer', nome: 'Hambúrguer artesanal', cat: 'Carnes', proteina: 'vermelha', intensidade: 4, gordura: 4, acidez: 2, docura: 2, picancia: 1, tags: ['carne-vermelha', 'churrasco'] },
    { id: 'cordeiro', nome: 'Cordeiro assado com ervas', cat: 'Carnes', proteina: 'vermelha', intensidade: 5, gordura: 4, acidez: 1, docura: 1, picancia: 0, tags: ['cordeiro', 'carne-vermelha'] },
    { id: 'carne-panela', nome: 'Carne de panela / ensopado', cat: 'Carnes', proteina: 'vermelha', intensidade: 4, gordura: 3, acidez: 2, docura: 1, picancia: 0, tags: ['ensopado', 'carne-vermelha'] },
    { id: 'chili', nome: 'Chili / comida mexicana', cat: 'Carnes', proteina: 'vermelha', intensidade: 4, gordura: 3, acidez: 2, docura: 1, picancia: 3, tags: ['comida-mexicana', 'comida-apimentada'] },

    // Porco e mineira
    { id: 'feijoada', nome: 'Feijoada', cat: 'Mineira / Brasileira', proteina: 'porco', intensidade: 5, gordura: 5, acidez: 1, docura: 1, picancia: 0, tags: ['ensopado', 'embutidos', 'mineira', 'defumado'] },
    { id: 'tropeiro', nome: 'Feijão tropeiro', cat: 'Mineira / Brasileira', proteina: 'porco', intensidade: 4, gordura: 4, acidez: 1, docura: 1, picancia: 0, tags: ['mineira', 'embutidos', 'frituras'] },
    { id: 'frango-quiabo', nome: 'Frango com quiabo', cat: 'Mineira / Brasileira', proteina: 'branca', intensidade: 3, gordura: 3, acidez: 2, docura: 1, picancia: 0, tags: ['frango', 'mineira', 'ensopado'] },
    { id: 'lombo', nome: 'Lombo de porco assado', cat: 'Mineira / Brasileira', proteina: 'porco', intensidade: 3, gordura: 3, acidez: 1, docura: 1, picancia: 0, tags: ['porco', 'mineira'] },
    { id: 'torresmo', nome: 'Torresmo / pururuca', cat: 'Mineira / Brasileira', proteina: 'porco', intensidade: 4, gordura: 5, acidez: 1, docura: 1, picancia: 0, tags: ['frituras', 'porco', 'mineira'] },
    { id: 'pao-de-queijo', nome: 'Pão de queijo', cat: 'Mineira / Brasileira', proteina: 'queijo', intensidade: 2, gordura: 3, acidez: 1, docura: 1, picancia: 0, tags: ['salgadinhos', 'queijo-macio', 'mineira'] },
    { id: 'moqueca', nome: 'Moqueca de peixe', cat: 'Mineira / Brasileira', proteina: 'peixe', intensidade: 4, gordura: 4, acidez: 3, docura: 1, picancia: 2, tags: ['peixe-gordo', 'frutos-do-mar', 'comida-apimentada'] },
    { id: 'linguica', nome: 'Linguiça / embutidos', cat: 'Petiscos', proteina: 'porco', intensidade: 4, gordura: 4, acidez: 1, docura: 1, picancia: 1, tags: ['embutidos', 'churrasco', 'defumado'] },
    { id: 'costelinha-bbq', nome: 'Costelinha ao barbecue', cat: 'Carnes', proteina: 'porco', intensidade: 4, gordura: 4, acidez: 2, docura: 3, picancia: 1, tags: ['porco', 'defumado', 'churrasco'] },

    // Aves
    { id: 'frango-assado', nome: 'Frango assado', cat: 'Aves', proteina: 'branca', intensidade: 3, gordura: 3, acidez: 1, docura: 1, picancia: 0, tags: ['frango'] },
    { id: 'frango-cremoso', nome: 'Frango ao molho cremoso / strogonoff', cat: 'Aves', proteina: 'branca', intensidade: 3, gordura: 4, acidez: 2, docura: 1, picancia: 0, tags: ['frango', 'massa-creme', 'cogumelos'] },
    { id: 'pato', nome: 'Pato / magret', cat: 'Aves', proteina: 'branca', intensidade: 4, gordura: 4, acidez: 2, docura: 2, picancia: 0, tags: ['pato', 'cogumelos'] },

    // Peixes e frutos do mar
    { id: 'peixe-grelhado', nome: 'Peixe branco grelhado (tilápia, linguado)', cat: 'Peixes e frutos do mar', proteina: 'peixe', intensidade: 2, gordura: 1, acidez: 2, docura: 1, picancia: 0, tags: ['peixe-magro'] },
    { id: 'salmao', nome: 'Salmão grelhado', cat: 'Peixes e frutos do mar', proteina: 'peixe', intensidade: 3, gordura: 4, acidez: 1, docura: 1, picancia: 0, tags: ['peixe-gordo'] },
    { id: 'bacalhau', nome: 'Bacalhau à portuguesa', cat: 'Peixes e frutos do mar', proteina: 'peixe', intensidade: 4, gordura: 4, acidez: 2, docura: 1, picancia: 0, tags: ['bacalhau', 'peixe-gordo'] },
    { id: 'camarao', nome: 'Camarão na manteiga e alho', cat: 'Peixes e frutos do mar', proteina: 'fruto-mar', intensidade: 3, gordura: 4, acidez: 1, docura: 1, picancia: 1, tags: ['frutos-do-mar'] },
    { id: 'ostras', nome: 'Ostras / ceviche', cat: 'Peixes e frutos do mar', proteina: 'fruto-mar', intensidade: 2, gordura: 1, acidez: 5, docura: 1, picancia: 1, tags: ['frutos-do-mar', 'peixe-magro'] },
    { id: 'sushi', nome: 'Sushi / sashimi', cat: 'Peixes e frutos do mar', proteina: 'peixe', intensidade: 2, gordura: 2, acidez: 2, docura: 2, picancia: 1, tags: ['asiatica', 'peixe-magro', 'frutos-do-mar'] },

    // Massas e pizzas
    { id: 'massa-bolonhesa', nome: 'Massa à bolonhesa', cat: 'Massas e pizzas', proteina: 'vermelha', intensidade: 4, gordura: 3, acidez: 4, docura: 1, picancia: 0, tags: ['massa-tomate'] },
    { id: 'massa-pomodoro', nome: 'Massa ao pomodoro', cat: 'Massas e pizzas', proteina: 'vegetal', intensidade: 2, gordura: 2, acidez: 4, docura: 1, picancia: 0, tags: ['massa-tomate', 'vegetariano'] },
    { id: 'carbonara', nome: 'Carbonara / quatro queijos', cat: 'Massas e pizzas', proteina: 'porco', intensidade: 3, gordura: 5, acidez: 1, docura: 1, picancia: 0, tags: ['massa-creme', 'queijo-duro'] },
    { id: 'risoto-cogumelos', nome: 'Risoto de cogumelos', cat: 'Massas e pizzas', proteina: 'vegetal', intensidade: 3, gordura: 4, acidez: 1, docura: 1, picancia: 0, tags: ['cogumelos', 'massa-creme', 'vegetariano'] },
    { id: 'lasanha', nome: 'Lasanha', cat: 'Massas e pizzas', proteina: 'vermelha', intensidade: 4, gordura: 4, acidez: 3, docura: 1, picancia: 0, tags: ['massa-tomate', 'queijo-duro'] },
    { id: 'pizza-marguerita', nome: 'Pizza marguerita / calabresa', cat: 'Massas e pizzas', proteina: 'queijo', intensidade: 3, gordura: 4, acidez: 3, docura: 1, picancia: 1, tags: ['pizza', 'massa-tomate'] },

    // Asiática / picante
    { id: 'tailandesa', nome: 'Curry tailandês / comida apimentada', cat: 'Asiática e picante', proteina: 'branca', intensidade: 3, gordura: 3, acidez: 3, docura: 2, picancia: 4, tags: ['asiatica', 'comida-apimentada'] },
    { id: 'yakisoba', nome: 'Yakisoba / agridoce chinês', cat: 'Asiática e picante', proteina: 'branca', intensidade: 3, gordura: 3, acidez: 3, docura: 3, picancia: 1, tags: ['asiatica'] },
    { id: 'indiana', nome: 'Comida indiana (tikka masala)', cat: 'Asiática e picante', proteina: 'branca', intensidade: 4, gordura: 4, acidez: 2, docura: 2, picancia: 3, tags: ['asiatica', 'comida-apimentada'] },

    // Queijos e petiscos
    { id: 'queijo-canastra', nome: 'Queijo Canastra / parmesão curado', cat: 'Queijos e petiscos', proteina: 'queijo', intensidade: 4, gordura: 4, acidez: 2, docura: 1, picancia: 0, tags: ['queijo-duro', 'mineira'] },
    { id: 'brie', nome: 'Brie / Camembert / queijo frescal', cat: 'Queijos e petiscos', proteina: 'queijo', intensidade: 2, gordura: 4, acidez: 2, docura: 1, picancia: 0, tags: ['queijo-macio'] },
    { id: 'gorgonzola', nome: 'Gorgonzola / Roquefort', cat: 'Queijos e petiscos', proteina: 'queijo', intensidade: 5, gordura: 5, acidez: 2, docura: 1, picancia: 0, tags: ['queijo-azul'] },
    { id: 'tabua-frios', nome: 'Tábua de frios (presunto cru, salame)', cat: 'Queijos e petiscos', proteina: 'porco', intensidade: 3, gordura: 4, acidez: 1, docura: 1, picancia: 1, tags: ['embutidos', 'salgadinhos'] },
    { id: 'frituras', nome: 'Petiscos fritos (pastel, coxinha, batata)', cat: 'Queijos e petiscos', proteina: 'vegetal', intensidade: 2, gordura: 5, acidez: 1, docura: 1, picancia: 0, tags: ['frituras', 'salgadinhos'] },

    // Vegetariano
    { id: 'salada', nome: 'Salada verde com vinagrete', cat: 'Vegetariano', proteina: 'vegetal', intensidade: 1, gordura: 1, acidez: 5, docura: 1, picancia: 0, tags: ['salada', 'vegetariano'] },
    { id: 'legumes-assados', nome: 'Legumes assados / berinjela', cat: 'Vegetariano', proteina: 'vegetal', intensidade: 3, gordura: 2, acidez: 2, docura: 2, picancia: 0, tags: ['vegetariano', 'cogumelos'] },

    // Sobremesas
    { id: 'chocolate', nome: 'Sobremesa de chocolate / brownie', cat: 'Sobremesas', proteina: 'doce', intensidade: 4, gordura: 4, acidez: 1, docura: 5, picancia: 0, tags: ['sobremesa-chocolate'] },
    { id: 'torta-frutas', nome: 'Torta de frutas / salada de frutas', cat: 'Sobremesas', proteina: 'doce', intensidade: 2, gordura: 2, acidez: 3, docura: 4, picancia: 0, tags: ['sobremesa-fruta'] },
    { id: 'doce-de-leite', nome: 'Doce de leite / goiabada com queijo', cat: 'Sobremesas', proteina: 'doce', intensidade: 4, gordura: 3, acidez: 1, docura: 5, picancia: 0, tags: ['doce-de-leite', 'mineira', 'queijo-macio'] },
  ];

  const data = { UVAS, PRATOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else Object.assign(root, data);
})(this);
