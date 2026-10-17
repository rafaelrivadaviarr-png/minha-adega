# 🍷 Minha Adega

App web para cadastrar os vinhos de casa e harmonizar com comida, nos dois sentidos.
Não precisa instalar nada: basta abrir o `index.html` no navegador (funciona no celular).

## Funções
- **Adega**: cadastro com nome, marca/produtor, região, tipo, safra, uva(s) (inclusive cortes), nota de qualidade, quantidade, preço e doçura.
  Mostra o total de garrafas e o valor em estoque, avisa se a safra está jovem, no ponto ou passando, e tem o botão "Abri uma" para dar baixa no estoque.
- **Vinho → Comida**: os melhores pratos e os que devem ser evitados, para um vinho da adega ou para qualquer uva.
- **Comida → Vinho**: qual vinho da adega abrir para um prato e quais uvas vale comprar.
- **Guia de uvas**: perfil (corpo, acidez, tanino, doçura), aromas e pratos indicados de cerca de 30 uvas.
- **Backup**: exportar/importar a adega em JSON (os dados ficam salvos no navegador).

## Como funciona a harmonização
`engine.js` compara o perfil do vinho (média das uvas, com ajuste pelo tipo) com o do prato e aplica regras clássicas de sommelier:
peso igual com peso, tanino com gordura e proteína (e nunca com peixe), vinho tão ácido e tão doce quanto o prato,
pouco tanino e algum açúcar com pimenta, espumante com fritura, além das combinações clássicas de cada uva.
Cada sugestão traz uma nota de 0 a 100 e os motivos.

Para incluir uvas ou pratos, edite `data.js`.
