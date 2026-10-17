# 🍷 Minha Adega

App web para cadastrar os vinhos de casa e harmonizar com comida, nos dois sentidos.
Não precisa instalar nada: basta abrir o `index.html` no navegador (funciona no celular).

## Funções
- **Início**: duas ações principais. *Fotografar o rótulo* identifica o vinho e mostra os pratos que combinam (e permite salvar na adega). *Fotografar o prato* identifica a comida e indica o vinho, da sua adega, da Casa Rio Verde e as uvas ideais. As duas também funcionam escolhendo na lista, sem foto.
- **Adega**: cadastro com nome, marca/produtor, região, tipo, safra, uva(s) (inclusive cortes), nota de qualidade, quantidade, preço e doçura.
  Mostra o total de garrafas e o valor em estoque, avisa se a safra está jovem, no ponto ou passando, e tem o botão "Abri uma" para dar baixa no estoque.
- **Vinho → Comida**: os melhores pratos e os que devem ser evitados, para um vinho da adega ou para qualquer uva.
- **Comida → Vinho**: qual vinho da adega abrir para um prato e quais uvas vale comprar.
- **Guia de uvas**: perfil (corpo, acidez, tanino, doçura), aromas e pratos indicados de cerca de 30 uvas.
- **Backup**: exportar/importar a adega em JSON (os dados ficam salvos no navegador).
- **Leitura de rótulo com IA**: no cadastro, "📷 Ler rótulo com IA" tira a foto e preenche nome, produtor, região, safra, tipo e uvas.
- **Catálogo**: aba com todos os rótulos da Casa Rio Verde (busca por nome, produtor ou uva e filtros de tipo e país). Cada rótulo pode ser harmonizado ou adicionado à adega, e a aba "Para o prato" também sugere vinhos da loja.
- **Catálogo para busca**: ao digitar o nome no cadastro, o app sugere vinhos do catálogo da Casa Rio Verde (BH) e preenche produtor, país, tipo, safra e uvas. O catálogo fica salvo no aparelho por 7 dias.
- **Feedback do avaliador**: botão "Discordo" em cada harmonização (nota e comentário) e registro automático quando uma leitura da IA é corrigida.

## Integração (n8n)
O app chama o webhook do n8n definido em `config.js` (ações `ler_rotulo`, `ler_prato`, `catalogo` e `feedback`).
- Fluxo: **Minha Adega - Leitura de Rotulo e Feedback** (n8n da GDEL).
- A IA é chamada pelo OpenRouter com a credencial `OpenRouter - minha-adega` (limite de US$ 5). A chave fica só no n8n.
- O feedback vai para a data table `adega_feedback`: `tipo` = `harmonizacao`, `leitura_certa` ou `leitura_corrigida`.
- O catálogo vem da data table `adega_catalogo`, preenchida pelo fluxo **Minha Adega - Importar Catalogo Casa Rio Verde** (só dados técnicos: sem preços, fotos ou textos da loja). O app o recebe pela ação `catalogo` do mesmo webhook.
- O modelo de visão fica no nó "Normalizar Pedido" (campo `modelo`).

## Como funciona a harmonização
`engine.js` compara o perfil do vinho (média das uvas, com ajuste pelo tipo) com o do prato e aplica regras clássicas de sommelier:
peso igual com peso, tanino com gordura e proteína (e nunca com peixe), vinho tão ácido e tão doce quanto o prato,
pouco tanino e algum açúcar com pimenta, espumante com fritura, além das combinações clássicas de cada uva.
Cada sugestão traz uma nota de 0 a 100 e os motivos.

Para incluir uvas ou pratos, edite `data.js`.
