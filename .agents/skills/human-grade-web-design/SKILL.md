---
name: human-grade-web-design
description: >-
  Diretrizes definitivas e princípios operacionais para criar websites, landing pages e
  aplicações web com acabamento de produto de nível sênior (direção de arte com 20 anos de experiência).
  Elimina o "slop" de IA: emojis cafonas, botões brilhantes, gradientes roxos, caos tipográfico,
  parallax gratuito, falta de SEO/domínio real, cantos hiper-arredondados, falta de responsividade e console.logs esquecidos.
  Inspirado no padrão Godly, React Bits e Motion Primitives.
---

# Human-Grade Web Design: Manual de Artesania Digital (Nível Diretor de Arte Sênior)

Este manual é o guia definitivo e inegociável para a concepção e implementação de interfaces web. Ele foi construído para erradicar todos os "dead giveaways" (vícios denunciadores) que gritam que um site foi gerado por IA preguiçosa, elevando a execução ao padrão dos melhores estúdios globais de design e curadorias de ponta ([Godly](https://godly.design), [React Bits](https://reactbits.dev), [Motion Primitives](https://motion-primitives.com), [Haikei](https://haikei.app)).

---

## 1. O Catálogo dos "Dead Giveaways" (Vícios Denunciadores de IA)

Qualquer pessoa com olho treinado ou cliente qualificado identifica um site de IA em 3 segundos se ele contiver qualquer um destes vícios:

| ❌ O Vício Típico de IA ("Slop") | Por que destrói a credibilidade | ✔️ A Regra do Designer Sênior |
| :--- | :--- | :--- |
| **Infestação de Emojis** (🚀, ✨, 🤖, 🔥, 💡 em títulos, badges e botões) | Parece trabalho amador, post de rede social de baixo escalão ou gerador de prompt automático. | **Banimento de Emojis decorativos**. Use tipografia com hierarquia, ícones SVG vetoriais precisos (com traço 1.5px calibrado) ou micro-badges de texto mono. |
| **A "Prisão do Roxo e Preto"** (Dark mode com roxo, azul índigo e ciano fluorescente) | 90% dos templates de IA usam a mesma paleta repetitiva (`#0B0F19` com `purple-500` / `indigo-600`). | Paletas sofisticadas com contrastes orgânicos: carvão mineral, ardósia, off-whites aquecidos, sálvia, terracota, mostarda desaturada ou Klein Blue. |
| **Botões "Shiny" & Glows Cegantes** (Botões com feixe de luz passando, borda neon giratória ou gradiente excessivo) | Gimmick visual vazio de 2023 que distrai da ação e transmite amadorismo. | Superfícies sólidas com contraste tátil rigoroso, micro-press no clique (`active:scale-[0.98]`), borda nítida de 1px e sombra em camadas físicas. |
| **Caos Tipográfico (4 a 5 fontes competindo)** | Misturar fontes aleatórias sem escala, criando poluição e falta de coesão. | **No máximo 2 famílias tipográficas** (1 para display/título, 1 para texto corrido e metadados com variante tabular/mono). |
| **"Cantos Hiper-Arredondados" em Tudo (`rounded-3xl` indiscriminado)** | O vício de colocar pílula gigante em cada card, imagem e container dá aspecto de brinquedo infantil. | Raios de curvatura calculados e contidos (`rounded-lg` a `rounded-xl`), ou até bordas vivas e técnicas com cantos secos (`rounded-none` ou `rounded-sm`) no estilo neo-brutalist/industrial. |
| **Parallax Gratuito & Scroll-Jacking** | Efeitos de rolagem pesados que causam engasgo (stutter), desorientam a leitura e não agregam valor. | Scroll nativo de 60fps/120fps liso. O movimento deve ser sutil e em resposta a micro-interações, nunca forçando o controle do scroll do usuário. |
| **Falta de Contato com Domínio Real & CNPJ** | Formulários "falsos" sem e-mail institucional visível, telefone, termos legais ou identificação jurídica. | Rodapés completos com e-mail corporativo (`contato@dominio.com`), CNPJ/Company ID, link para Status de Sistema, Política de Privacidade e Termos de Uso reais. |
| **SEO Amador & Falta de Metadados** | Falta de tags Open Graph (`og:image`, `og:title`), favicon genérico, ausência de `<meta name="description">` e títulos sem hierarquia semântica (`<h1>` a `<h6>`). | Pacote completo de SEO semântico, schema JSON-LD, Twitter Cards, tags canônicas e hierarquia lógica estrita. |
| **Console.logs Esquecidos no Código** | `console.log('test')`, `console.log(data)` no bundle de produção. | Limpeza absoluta de logs de debug antes de qualquer entrega. Zero alertas ou erros no DevTools. |
| **Modais Intrusivos & Bloqueios de Tela** | Pop-ups agressivos pulando na cara do usuário antes de ele ver o valor da página. | Contexto inline, drawers deslizantes não-bloqueantes ou notificações discretas (toasts). |
| **Quebra de Responsividade / Overflow Horizontal** | Quebra em mobile pequeno (320px-375px), tablets (768px-1024px) ou ultrawide (>1440px), gerando barra de rolagem lateral horrível. | Fluidez elástica com `clamp()`, `min-w-0`, `overflow-x-hidden` estrutural e testes do menor smartphone até monitores 4K. |
| **Primitivas Shadcn/Tailwind sem Personalização Lógica** | Copiar o componente padrão cru sem adaptar tipografia, espaçamento, estados vazios ou tratamento de erros. | Componentes esculpidos com lógica de estado madura (loading, error, empty, active, disabled) e customização profunda do design system. |

---

## 2. As Quatro Fontes de Inspiração & Referência do Padrão Sênior

Ao projetar qualquer tela, tome como régua os seguintes padrões de excelência internacional:

1. **[Godly.design](https://godly.design)** (A Curadoria Máxima):
   - Estude a assimetria intencional, ritmo visual, uso de espaços negativos generosos e elegância editorial.
   - Observe como as melhores marcas do mundo contam uma história funcional sem encher a tela de firulas.
2. **[React Bits](https://reactbits.dev)** & **[Motion Primitives](https://motion-primitives.com)** (Física & Movimento):
   - Micro-interações táteis e suaves usando curvas de bezier naturais (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - Componentes vivos: spotlight de cursor sutil, cards com profundidade física 3D contida, transições de layout fluidas sem sobressaltos.
3. **[Haikei](https://haikei.app)** (Geometria Vetorial Autêntica):
   - Em vez de fundos borrados genéricos com gradiente de IA, use formas vetoriais SVG nítidas, grids isométricos matemáticos, divisores de seção com curvas limpas e padrões geométricos com baixa opacidade.

---

## 3. Direção de Arte & Tipografia de Alto Calibre

### 3.1 Regra de Ouro da Tipografia: No Máximo 2 Famílias
Evite a salada tipográfica amadora. Escolha uma combinação deliberada:

* **Combinação A: Editorial Contemporâneo (SaaS Premium / Agência)**
  - Títulos: *Instrument Serif* (itálico pontual para ênfase sofisticada) ou *Newsreader*.
  - Corpo & Metadados: *Plus Jakarta Sans* ou *Inter Tight*.
* **Combinação B: Engenharia & Utilitário de Alta Precisão (Developer Tools / Fintech)**
  - Títulos: *Space Grotesk* ou *Cabinet Grotesk*.
  - Corpo & Dados: *Geist Sans* / *Inter* + *JetBrains Mono* (para números e metadados).
* **Combinação C: Neo-Brutalist Suíço (Moderno, Seco, Autoritativo)**
  - Família Única: *General Sans* ou *Satoshi* em pesos contrastantes (Extrabold 800 para títulos, Regular 400 para leitura, Medium 500 para botões).

### 3.2 Micro-Ajustes Ópticos Fundamentais
```css
/* 1. Títulos com tracking negativo e sem quebras órfãs */
h1, h2, .display-title {
  letter-spacing: -0.03em;
  text-wrap: balance;
  line-height: 1.1;
}

/* 2. Parágrafos com respiro e largura humana (máximo 68 caracteres) */
p, .lead-text {
  max-width: 68ch;
  line-height: 1.65;
  text-wrap: pretty;
  color: var(--text-secondary);
}

/* 3. Números e valores sempre com largura tabular (não oscilam) */
.data-metric, .price-display, table td {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

/* 4. Labels técnicas sofisticadas (substituem emojis) */
.tech-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem; /* 11px */
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--text-muted);
}
```

---

## 4. Teoria da Cor e Superfícies Físicas (Adeus ao Roxo de IA)

### 4.1 Paletas Alternativas e Autênticas
Fuja do combo `#0B0F19` + `purple-600`. Escolha paletas com personalidade autêntica:

1. **Atelier / Warm Stone (Light Mode Nobre)**:
   - Fundo base: `#F9F8F6` (papel linho/warm white).
   - Superfície dos cards: `#FFFFFF` com borda fina `#E7E5E4` (`stone-200`).
   - Tipografia: `#1C1917` (`stone-900`) e `#78716C` (`stone-500`).
   - Acento: Terracota `#C2410C` ou Oliva `#3F6212`.
2. **Obsidian & Emerald (Dark Mode Técnico / Finanças)**:
   - Fundo base: `#090A0C` (preto carvão mineral profundo, sem azul).
   - Superfície dos cards: `#121418` com borda nítida de 1px `#1E222A`.
   - Tipografia: `#F3F4F6` e `#9CA3AF`.
   - Acento: Verde Sinal Esmeralda `#10B981` (associado a uptime, precisão, liquidez).
3. **Swiss Monochrome & International Klein Blue**:
   - Monocromático de alto contraste (Preto `#000000`, Branco `#FFFFFF`, Cinza neutro `#6B7280`).
   - Um único ponto focal de impacto elétrico: Azul Klein `#002FA7` em botões de conversão e estados ativos.

### 4.2 Cantos e Geometria: Controle de Raios (Border-Radius)
- ❌ Não use `rounded-3xl` em todos os botões e cartões.
- ✔️ Estabeleça uma escala harmônica de raios:
  - Containers mestres: `rounded-xl` (12px) ou `rounded-2xl` (16px).
  - Cards e painéis: `rounded-lg` (8px) ou `rounded-xl` (12px).
  - Botões e inputs: `rounded-md` (6px) ou cantos secos (`rounded-sm` / `rounded-none`).
  - Badges: `rounded-full` apenas para tags pequenas de status mono.

---

## 5. Engenharia de Layout, Responsividade e Escala

### 5.1 Eliminação do Overflow Horizontal (Anti-Broken Mobile)
Todo container de layout deve respeitar a disciplina de fluxo:
```css
/* Proteção contra quebra de layout lateral */
html, body {
  max-width: 100%;
  overflow-x: hidden;
}

/* Imagens e mídias nunca transbordam o container pai */
img, video, canvas, svg {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Prevenção de quebra em strings longas ou código */
pre, code, table {
  max-width: 100%;
  overflow-x: auto;
}
```

### 5.2 Breakpoints Testados Obrigatoriamente
Nenhum site pode ser considerado pronto sem verificação nos 5 breakpoints canônicos:
1. **Mobile Ultra-Compacto (`320px` - `375px`)**: iPhone SE e Androids compactos. O padding lateral deve cair para `16px` (`px-4`), fontes escaladas para baixo sem quebrar palavras.
2. **Mobile Padrão (`390px` - `430px`)**: iPhone Pro / Pixel.
3. **Tablet Portrait (`768px`)**: Grid de 2 colunas, menus colapsáveis ou tabs horizontais.
4. **Desktop Compacto / Laptop (`1024px` - `1280px`)**: Bento Grids completos e layouts 60/40.
5. **Widescreen / 4K (`1440px` a `1920px+`)**: Conteúdo centralizado com `max-w-7xl` ou `max-w-6xl` e margens `mx-auto`, garantindo que o design não fique esticado e desengonçado.

---

## 6. SEO Técnico, Metadados & Rodapé com Domínio Real

### 6.1 O Cabeçalho de Metadados Obrigatório (SEO de Nível Sênior)
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nome da Empresa — Proposta de Valor Concreta e Curta</title>
  <meta name="description" content="Descrição técnica e persuasiva de 140-160 caracteres explicando a solução real sem jargões genéricos." />
  
  <!-- Open Graph / Redes Sociais -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://suaempresa.com.br/" />
  <meta property="og:title" content="Nome da Empresa — Proposta de Valor" />
  <meta property="og:description" content="Descrição objetiva de valor do produto." />
  <meta property="og:image" content="https://suaempresa.com.br/og-image.png" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@suaempresa" />
  <meta name="twitter:image" content="https://suaempresa.com.br/og-image.png" />

  <!-- Favicons Reais (Não use ícone padrão do framework) -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

  <!-- Schema Markup JSON-LD (Autoridade no Google) -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NomeDoProduto",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    }
  }
  </script>
</head>
```

### 6.2 O Rodapé Confiável (Anti-Fake SaaS)
Um rodapé profissional precisa demonstrar presença jurídica e contato real:
- **E-mail de domínio corporativo real**: `contato@suaempresa.com.br` ou `suporte@suaempresa.com.br` (com link direto `mailto:`).
- **Dados societários**: CNPJ ou número de registro de empresa, endereço físico/sede ou indicação clara de empresa remota.
- **Páginas de governança**: Termos de Uso, Política de Privacidade (LGPD/GDPR compliance), Status do Sistema (`● 99.98% operacional`).
- **Redes sociais ativas**: Links para GitHub oficial, Discord da comunidade, X/Twitter ou LinkedIn corporativo.

---

## 7. Higiene de Código e Engenharia de Estados

### 7.1 Varredura de Console e Higiene
- **Zero console.logs**: Nunca deixe `console.log`, `console.warn` de teste ou comentários como `// TODO: fix this later` expostos no código de produção.
- **Zero Inline Event Handlers Sujos**: Evite scripts desorganizados misturados com CSS em linha sem abstração.

### 7.2 Tratamento de Estados Profundo (Além do Happy Path)
Toda funcionalidade que carrega dados deve cobrir:
1. **Estado de Carregamento**: Skeleton harmônico com mesma altura/largura dos dados reais, evitando pulo de layout (Cumulative Layout Shift = 0).
2. **Estado Vazio**: Mensagem contextual com ação de primeira etapa ("Nenhum webhook cadastrado ainda. Configure seu primeiro endpoint em 2 minutos.").
3. **Estado de Erro com Recuperação**: Explicação compreensível e botão claro de reteste ("Falha na conexão com o gateway de telemetria. [Tentar novamente]").

---

## 8. Checklist de Auditoria Final "20 Anos de Experiência"

Antes de declarar qualquer site pronto, execute mentalmente e no código esta bateria de testes:

- [ ] **1. Teste Anti-Emoji**: O site contém emojis decorativos em títulos, botões ou cards? *(Se sim, delete todos. Substitua por ícones de traço vetorial de 1.5px ou micro-badges de texto).*
- [ ] **2. Teste da Paleta**: Há gradientes roxos/azul neon sem razão de branding? *(Se sim, ajuste para uma paleta sóbria: Ardósia, Charcoal mineral, Warm Stone ou Klein Blue).*
- [ ] **3. Teste do Botão "Shiny"**: Os botões parecem peças de um cassino neon? *(Se sim, use superfícies sólidas com clique tátil `active:scale-[0.98]` e foco nítido).*
- [ ] **4. Teste de Fontes**: Há mais de 2 famílias tipográficas na página? *(Se sim, unifique em no máximo 2 famílias harmonizadas).*
- [ ] **5. Teste dos Cantos Arredondados**: Há componentes com raios gigantes desproporcionais? *(Se sim, reduza para `rounded-lg` ou `rounded-xl`, mantendo a solidez estrutural).*
- [ ] **6. Teste do Scroll & Parallax**: A página engasga ou rouba o scroll do usuário? *(Se sim, elimine o parallax gratuito e garanta 60fps/120fps liso).*
- [ ] **7. Teste de Contato Real**: O rodapé possui e-mail corporativo com domínio próprio, termos e identificação?
- [ ] **8. Teste de Responsividade (320px a 1440px+)**: Redimensione a janela até 320px de largura. Apareceu alguma barra de rolagem horizontal? *(Se sim, corrija o container causador do overflow imediatamente).*
- [ ] **9. Teste de Limpeza de Console**: Abra o DevTools (F12). Há algum `console.log` de debug ou erro vermelho? *(Se sim, remova todos os logs).*
- [ ] **10. Teste de SEO & Metadados**: As meta tags Open Graph, favicon customizado e hierarquia `<h1>` a `<h6>` estão implementadas?

---

*Aplicando este manual, o resultado final se afasta por completo da mediocridade sintética e atinge o nível de arte e acabamento dos melhores produtos digitais do mundo.*
