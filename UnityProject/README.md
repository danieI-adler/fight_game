# 🎮 Transição para Unity: Guia Completo do Projeto

Este diretório contém a base arquitetural em **C# (Unity 2022.3 LTS ou 2023/6000 URP/HDRP)** portando 100% da lógica e balanceamento do jogo de luta.

---

## 📁 Estrutura dos Scripts C# Criados

```
UnityProject/Assets/Scripts/
├── Combat/
│   ├── FighterState.cs          # Máquina de estados completa (Idle, Ataques, Bloqueio, Dano)
│   ├── AttackData.cs            # Estrutura com frame data (Startup, Active, Recovery, Knockback)
│   ├── Hitbox.cs                # Gatilho de acerto com sincronização direcional (facing)
│   ├── Hurtbox.cs               # Detecção de acerto e absorção de bloqueio
│   ├── FighterController.cs     # Controlador de física 2.5D, movimentação e energia
│   └── CombatInputHandler.cs    # Mapeamento de teclado e gamepads para P1 e P2
├── Data/
│   └── CharacterData.cs         # ScriptableObject para atributos dos lutadores de Clair Obscur
├── Camera/
│   └── CombatCamera.cs          # Câmera cinemática dinâmica com enquadramento e Shake
├── UI/
│   └── CombatHUD.cs             # Interface de barras de vida, energia, combos e timer
└── Managers/
    └── GameManager.cs           # Gerenciador de fluxo de partida, rounds e K.O.
```

---

## 🚀 Como Importar e Executar no Unity

1. **Abrir o Unity Hub**:
   - Clique em **"Add"** (Adicionar projeto) e selecione a pasta `UnityProject`.
   - Escolha o template **3D (URP)** ou **3D (HDRP)** para gráficos cinematográficos fotorrealistas.
2. **Criar a Cena de Combate**:
   - Crie um chão com colisor (`BoxCollider`).
   - Instancie dois GameObjects com o componente `FighterController` (um para P1 e outro para P2).
   - Adicione o `CombatInputHandler` em um GameObject vazio.
   - Adicione o `CombatCamera` na Main Camera e atribua os dois lutadores.
   - Adicione o `GameManager` e o `CombatHUD`.
3. **Pressione Play**:
   - Os controles funcionarão imediatamente com detecção precisa de hitboxes, bloqueios e sistema de energia.
