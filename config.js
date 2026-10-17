// Integração com o n8n (leitura de rótulo e feedback).
// O token só evita chamadas aleatórias; a chave da IA fica no n8n, nunca aqui.
window.ADEGA_CONFIG = {
  webhook: 'https://gdel-n8n.duckdns.org/webhook/minha-adega',
  token: '8GmbAkwPqkt9ycaW',
};
