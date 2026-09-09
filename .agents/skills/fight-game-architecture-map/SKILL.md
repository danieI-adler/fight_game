---
name: fight-game-architecture-map
description: >-
  Mapa arquitetural e guia de desenvolvimento cirúrgico do Fight Game.
  Orienta o agente de IA a saber exatamente qual arquivo ler e alterar para cada recurso do jogo
  (novos personagens, habilidades, golpes, física, som, cenários, renderização 2D/3D, IA e multiplayer),
  evitando varreduras lentas ou leitura de arquivos desnecessários.
---

# 🗺️ Fight Game Architecture & Modification Map

Este guia é a bússola oficial para qualquer desenvolvedor ou agente de IA que for realizar manutenções, balanceamentos ou novas implementações neste jogo.
**Regra de Ouro:** Não faça buscas cegas no projeto inteiro. Consulte esta tabela para abrir **apenas** o arquivo responsável pelo recurso desejado.

---

## 🧭 Índice Rápido: "Onde mexer se eu quiser..."

| O que você quer alterar / criar? | Arquivo exato a abrir | Descrição da alteração |
| :--- | :--- | :--- |
| **Criar ou editar dados de um personagem** (atributos, visual, cores, nome, voz) | `src/game/characters/expedition33Characters.js` ou `characterData.js` | Adicionar/alterar o objeto com `stats` (vida, velocidade, pulo), `themeColor`, `voiceAbility`, `superType`. |
| **Adicionar ou balancear um Golpe** (dano, startup, active frames, hitbox, knockback) | `src/game/engine/FighterCombat.js` | Modificar/adicionar o caso em `updateAttackStates()` ou ajustar danos de socos, chutes e supers. |
| **Criar um novo Super Golpe / Ultimate cinematográfico** | `src/game/engine/FighterCombat.js` + `src/game/engine/Fighter.js` | No `Fighter.js#superMove` iniciar o tipo e no `FighterCombat.js` criar a máquina de fases (Carga -> Salto -> Impacto). |
| **Ajustar ou criar novas poses/animações esqueléticas** | `src/game/engine/FighterAnimator.js` | Modificar coordenadas de cabeça, ombros, cotovelos, mãos, quadris e pés para cada estado de animação. |
| **Ajustar Física Central** (gravidade, velocidade de caminhada, atrito, cálculo de pulo) | `src/game/engine/Fighter.js` | No método `update(dt, ...)` e `jump()`, onde opera o `timeScale = dt * 60`. |
| **Caixas de Colisão e Dano** (Hurtboxes corporais e Pushbox de colisão entre lutadores) | `src/game/engine/Fighter.js` | Métodos `getHurtboxes()` e `getPushbox()`. |
| **Adicionar novo som ou efeito de voz procedural/áudio** | `src/game/audio/soundManager.js` | Criar método com síntese de áudio Web Audio API (senóides/ruído) ou carregar arquivo MP3. |
| **Renderização e visual 2D dos personagens** (trajes Belle Époque, capas, máscaras, armas) | `src/game/engine/ExpeditionRenderer.js` ou `ExpeditionHDRenderer.js` | Desenho no Canvas 2D dos sobretudos, chapéus, lâminas e efeitos luminosos. |
| **Renderização 3D dos lutadores e cenário WebGL** | `src/game/engine3d/Fighter3D.js` e `GameEngine3D.js` | Modelos Three.js, geometrias, materiais PBR, iluminação e câmera 3D. |
| **Comportamento da Inteligência Artificial (CPU)** | `src/game/ai/FighterAI.js` | Lógica de decisão, checagem de distância, probabilidade de bloqueio, combos e punições. |
| **Criar ou editar Cenários / Arenas de Combate** | `src/game/engine/ExpeditionStages.js` e `Stage.js` | Definição de backgrounds, chão, iluminação e dimensões da arena. |
| **Multiplayer Online e Sincronização P2P** | `src/game/network/NetworkManager.js` e `src/game/engine/GameEngine.js` | Protocolo WebRTC (PeerJS), envio de inputs e método `applyHostStateSnapshot()`. |
| **Menus, HUD e Telas do Jogo (React)** | `src/components/` | Ver seção de UI abaixo para HUD, Seleção de Personagem, Lobby Online e Pause. |
| **Câmera do Jogo e Zoom de Impacto** | `src/game/engine/Camera.js` | Interpolação de foco entre P1 e P2 e efeito de shake. |
| **Efeitos de Partículas** (faíscas, poeira, shockwaves, cortes de espada, raios) | `src/game/engine/Particles.js` | Métodos `emitSparks`, `emitSwordSlash`, `emitShockwave`, `emitElectricArc`. |

---

## 📂 Guia Detalhado por Módulo

### 1. Sistema de Personagens (`src/game/characters/`)
* **`expedition33Characters.js`**: Elenco de *Clair Obscur: Expedition 33* (Gustave, Maelle, Lune, Sciel, Renoir, Verso, Monoco, etc.).
  - Adicione propriedades como `voiceAbility: 'nome_do_som'` ou `superType: 'NOME_DO_SUPER'` aqui.
* **`characterData.js`**: Elenco clássico dos 20 personagens Belle Époque com atributos base.

### 2. Mecânica de Lutador e Combate (`src/game/engine/`)
* **`Fighter.js`** (Entidade do Jogador):
  - Mantém o estado atual (`this.state`), posição (`this.position`), velocidade (`this.velocity`), vida e energia.
  - Possui os métodos de gatilho acionados pelos controles: `lightPunch()`, `heavyPunch()`, `lightKick()`, `heavyKick()`, `special1()`, `special2()`, `superMove()`.
* **`FighterCombat.js`** (Regras de Ataque):
  - Executa a máquina de estados `updateAttackStates(fighter, dt, particles, stageWidth)`.
  - É aqui que se define em qual milissegundo o golpe acerta (`stateTime`), o tamanho da hitbox `createHitbox(x, y, w, h)`, o dano e as sequências de combos.
* **`FighterAnimator.js`** (Cinemática Esquelética):
  - Calcula a posição dinâmica de cada articulação do corpo em função de `stateTime` (ex: balanço ao respirar no `IDLE`, ciclo de pernas no `WALK`, braço esticado no soco).

### 3. Loop do Jogo e Motor (`src/game/engine/GameEngine.js`)
* Coordena o `requestAnimationFrame`.
* Gerencia os rounds, contagem de tempo (99s), hitstop (congelamento dramático no impacto do golpe) e condição de vitória/derrota.
* Se estiver jogando online como Cliente, envia inputs e recebe o estado do Host.

### 4. Interface e Telas React (`src/components/`)
* **`hud/FightHUD.jsx`**: Barras de vida de P1 e P2, barra de energia (Super), timer e contador de vitórias (rounds).
* **`select/CharacterSelect.jsx`**: Tela de escolha de lutador com preview visual.
* **`menu/MainMenu.jsx`**: Menu inicial (Arcade, Versus, Online, Treino, Configurações).
* **`menu/GraphicsSelectorModal.jsx`**: Seletor dos 4 modos gráficos (Boneco Palito, 2D Belle Époque, 2.5D e 3D).
* **`online/OnlineLobby.jsx`**: Criação e entrada em salas via WebRTC/PeerJS.
* **`training/TrainingOverlay.jsx`**: Informações de treino e alternador de hitboxes visíveis.

---

## 🛠️ Passo a Passo: "Como adicionar uma nova Habilidade Especial a um Personagem"

Se você quiser dar uma habilidade única (ex: um projétil de fogo para a personagem Sciel):

1. **No arquivo de dados (`expedition33Characters.js`)**:
   Adicione a tag da habilidade nos dados da Sciel:
   ```javascript
   specialType: 'SCIEL_FIRE_BLAST'
   ```
2. **No disparador do golpe (`Fighter.js`)**:
   No método `special1()`, a energia já é consumida. Se precisar de uma postura inicial específica, defina o estado.
3. **Na máquina de combate (`FighterCombat.js`)**:
   Dentro de `case FIGHTER_STATE.SPECIAL_1:`, verifique se o personagem tem esse especial:
   ```javascript
   if (fighter.charData?.specialType === 'SCIEL_FIRE_BLAST') {
     // Criação da hitbox personalizada, som e partículas de fogo
     fighter.activeHitbox = fighter.createHitbox(30, 70, 120, 60);
     fighter.activeHitbox.damage = 160;
     particles.emitSparks(fighter.position.x, fighter.position.y - 70, '#ff4500', 25, 8);
   }
   ```
4. **No som (`soundManager.js`)**:
   Adicione o método de som correspondente (ex: `sounds.playFireBlast()`).

---

## ⚡ Regras de Performance para IAs que operam neste projeto
1. **Nunca leia mais de 2 arquivos por vez** a menos que seja estritamente necessário.
2. **Sempre use caminhos exatos** baseados nesta tabela.
3. **Execute `npm run build`** via terminal para validar se as alterações não quebraram o bundle do Vite.
