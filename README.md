# Fight Game

Jogo de luta 2D/3D para navegador com 20 personagens, 4 modos gráficos selecionáveis e multiplayer online P2P via WebRTC.

---

## 🎨 4 Modos Gráficos Selecionáveis

1. **Modo 1: Boneco Palito** (*2D Retrô Clássico*):
   - Visual geométrico minimalista e nostálgico.
2. **Modo 2: 2D Belle Époque** (*Ilustrado & Encorpado*):
   - Sobretudos esvoaçantes, máscaras de porcelana venezianas, tricornes, física de tecidos e pinceladas de tinta luminosa inspiradas em *Clair Obscur: Expedition 33*.
3. **Modo 3: 2.5D** (*Lutadores 3D + Cenário 2D*):
   - Personagens renderizados em **Three.js / WebGL 3D** com materiais PBR projetados sobre o cenário 2D.
4. **Modo 4: Tudo 3D Next-Gen** (*Arena 3D Completa*):
   - Arena tridimensional com piso reflexivo, iluminação dinâmica dramática com sombras em tempo real, névoa volumétrica e câmera cinematográfica.

---

## 🌐 Modos de Jogo

- **Modo Arcade**: Enfrente o computador com IA em 4 níveis de dificuldade.
- **Versus Local**: 2 jogadores no mesmo teclado ou controles USB.
- **Jogar Online (Salas P2P)**: Crie uma sala com código ou compartilhe o link direto para jogar remotamente com qualquer pessoa via WebRTC.
- **Modo Treino**: Prática de combos com visualizador de hitboxes.

---

## 🎮 Controles

### Jogador 1 (P1) / Jogador Local Online
- **Mover**: `A` / `D`
- **Pulo**: `Espaço` ou `W`
- **Agachar**: `S`
- **Bloqueio (Defesa)**: `E` ou `Shift Esquerdo`
- **Socos (Fraco/Forte)**: `F` / `R` (ou `J` / `U`)
- **Chutes (Fraco/Forte)**: `G` / `T` (ou `K` / `I`)
- **Habilidade Especial**: `Q`
- **Super Golpe**: `Enter` (ao atingir 100% de energia)

### Jogador 2 (P2) - Versus Local
- **Mover**: `←` / `→`
- **Pulo**: `↑`
- **Agachar**: `↓`
- **Bloqueio (Defesa)**: `Num 0` ou `Ctrl Direito`
- **Soco Fraco / Forte**: `Num 4` / `Num 7`
- **Chute Fraco / Forte**: `Num 5` / `Num 8`
- **Habilidade Especial**: `Num 9`
- **Super Golpe**: `Num Enter`

---

## ⚡ Regras de Energia
- **+5%** ao desferir golpe com sucesso no adversário.
- **+2,5%** ao levar golpe sem defender.
- **0%** ao bloquear (defender não dá energia).
- **0%** passivo por tempo.

---

## 👥 20 Personagens Belle Époque

- Personagem 1 ao Personagem 20 (cada um com trajes, máscaras e auras exclusivas).

---

## 🚀 Executar Localmente

```bash
npm install
npm run dev
```
