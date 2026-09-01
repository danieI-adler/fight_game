/**
 * Sistema de Entrada de Teclado, Gamepad e Ações Disparadas
 */

export class InputHandler {
  constructor() {
    this.keysDown = {};
    this.keyPressTime = {};

    // Mapeamento Jogador 1 (WASD / Espaço para Pular / Enter para Especial)
    this.p1Binds = {
      up: ['KeyW', 'Space'],
      down: ['KeyS'],
      left: ['KeyA'],
      right: ['KeyD'],
      block: ['KeyE', 'ShiftLeft'],
      lightPunch: ['KeyF', 'KeyJ'],
      heavyPunch: ['KeyR', 'KeyU'],
      lightKick: ['KeyG', 'KeyK'],
      heavyKick: ['KeyT', 'KeyI'],
      special1: ['KeyQ', 'KeyO'],
      superMove: ['Enter'],
    };

    // Mapeamento Jogador 2 (Setas + Teclado Numérico ou B/N/H/M/L)
    this.p2Binds = {
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
      block: ['Numpad0', 'ControlRight'],
      lightPunch: ['Numpad4', 'KeyB'],
      heavyPunch: ['Numpad7', 'KeyH'],
      lightKick: ['Numpad5', 'KeyN'],
      heavyKick: ['Numpad8', 'KeyM'],
      special1: ['Numpad9', 'KeyL'],
      superMove: ['NumpadEnter'],
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.keysDown = {};
  }

  onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code)) {
      e.preventDefault();
    }
    this.keysDown[e.code] = true;
    this.keyPressTime[e.code] = performance.now();
  }

  onKeyUp(e) {
    this.keysDown[e.code] = false;
  }

  isPressed(codeList) {
    if (!codeList) return false;
    return codeList.some(code => this.keysDown[code]);
  }

  // --- POLING DO GAMEPAD ---
  getGamepadState(playerIndex = 0) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[playerIndex];
    if (!gp) return null;

    const stickX = gp.axes[0] || 0;
    const stickY = gp.axes[1] || 0;
    const dpadUp = gp.buttons[12] && gp.buttons[12].pressed;
    const dpadDown = gp.buttons[13] && gp.buttons[13].pressed;
    const dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
    const dpadRight = gp.buttons[15] && gp.buttons[15].pressed;

    return {
      left: dpadLeft || stickX < -0.4,
      right: dpadRight || stickX > 0.4,
      up: dpadUp || stickY < -0.5,
      down: dpadDown || stickY > 0.5,
      lightPunch: gp.buttons[2] && gp.buttons[2].pressed,
      heavyPunch: gp.buttons[3] && gp.buttons[3].pressed,
      lightKick: gp.buttons[0] && gp.buttons[0].pressed,
      heavyKick: gp.buttons[1] && gp.buttons[1].pressed,
      block: (gp.buttons[4] && gp.buttons[4].pressed) || (gp.buttons[6] && gp.buttons[6].pressed),
      special1: (gp.buttons[5] && gp.buttons[5].pressed) || (gp.buttons[7] && gp.buttons[7].pressed),
      superMove: (gp.buttons[8] && gp.buttons[8].pressed) || (gp.buttons[9] && gp.buttons[9].pressed),
    };
  }

  // --- ATUALIZAR ENTRADAS DOS LUTADORES ---
  updateFighterInput(fighter, binds, gpIndex = null, justPressed = {}) {
    const gp = gpIndex !== null ? this.getGamepadState(gpIndex) : null;

    const left = this.isPressed(binds.left) || (gp && gp.left);
    const right = this.isPressed(binds.right) || (gp && gp.right);
    const down = this.isPressed(binds.down) || (gp && gp.down);
    const block = this.isPressed(binds.block) || (gp && gp.block);

    // Agachamento
    fighter.crouch(down);

    // Bloqueio
    fighter.block(block);

    // Movimentação horizontal
    if (!down && !block) {
      if (left && !right) {
        fighter.move(-1);
      } else if (right && !left) {
        fighter.move(1);
      } else {
        fighter.stopMoving();
      }
    }

    // Pulo (Disparo Único por clique, sem loop de repetição)
    if (justPressed.jump || (gp && gp.up)) {
      const dirX = left ? -1 : (right ? 1 : 0);
      fighter.jump(dirX);
    }

    // Golpes (Disparo Único)
    if (justPressed.superMove) fighter.superMove();
    else if (justPressed.special1) fighter.special1();
    else if (justPressed.heavyPunch) fighter.heavyPunch();
    else if (justPressed.lightPunch) fighter.lightPunch();
    else if (justPressed.heavyKick) fighter.heavyKick();
    else if (justPressed.lightKick) fighter.lightKick();
  }
}
