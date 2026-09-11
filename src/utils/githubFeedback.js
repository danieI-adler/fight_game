/**
 * Utilitário para gerar URLs de criação de Issue pré-formatadas no GitHub
 */
const GITHUB_REPO_URL = 'https://github.com/danieI-adler/fight_game';

export const openGitHubIssue = (type = 'bug', extraContext = {}) => {
  const isBug = type === 'bug';
  
  const title = isBug
    ? '[BUG] '
    : '[SUGESTÃO] ';

  const systemInfo = typeof navigator !== 'undefined' ? `${navigator.userAgent}` : 'N/A';
  const screenInfo = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A';

  const body = isBug
    ? `### 🐛 Descrição do Problema
Descreva claramente o que aconteceu:

### 🎮 Passos para Reproduzir
1. Personagem utilizado: ${extraContext.character || '...'}
2. O que você fez:
3. O que era esperado:

### 💻 Informações do Sistema
- Navegador: ${systemInfo}
- Resolução da Tela: ${screenInfo}
${extraContext.mode ? `- Modo de Jogo: ${extraContext.mode}` : ''}
${extraContext.graphics ? `- Modo Gráfico: ${extraContext.graphics}` : ''}
`
    : `### 💡 Sugestão ou Ideia de Balanceamento
Descreva sua ideia para o jogo (novo personagem, golpe, balanceamento, etc.):

### 🎯 Motivo / Benefício
Como isso tornaria o jogo mais divertido ou equilibrado?
`;

  const url = `${GITHUB_REPO_URL}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
