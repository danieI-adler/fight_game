/**
 * Sistema de Entrada de Teclado, Gamepad e Histórico de Comandos
 */

export class InputHandler {
  constructor() {
    this.keysDown = {};
    this.keyPressTime = {};
    this.p1History = [];
    this.p2History = [];

    // Mapeamento Padrão Teclado Jogador 1 (WASD + F/G/R/T/E/Space)
    this.p1Binds = {
      up: ['KeyW'],
      down: ['KeyS'],
      left: ['KeyA'],
      right: ['KeyD'],
      block: ['KeyE', 'ShiftLeft'],
      lightPunch: ['KeyF', 'KeyJ'],
      heavyPunch: ['KeyR', 'KeyU'],
      lightKick: ['KeyG', 'KeyK'],
      heavyKick: ['KeyT', 'KeyI'],
      special1: ['KeyQ', 'KeyO'],
      superMove: ['Space'],
    };

    // Mapeamento Padrão Teclado Jogador 2 (Setas + Teclado Numérico ou B/N/H/M/L/Enter)
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
      superMove: ['NumpadEnter', 'Enter'],
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
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    this.keysDown[e.code] = true;
    this.keyPressTime[e.code] = performance.now();
  }

  onKeyUp(e) {
    this.keysDown[e.code] = false;
  }

  isPressed(codeList) {
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
      lightPunch: gp.buttons[2] && gp.buttons[2].pressed, // X (Xbox) / Square (PS)
      heavyPunch: gp.buttons[3] && gp.buttons[3].pressed, // Y / Triangle
      lightKick: gp.buttons[0] && gp.buttons[0].pressed,  // A / Cross
      heavyKick: gp.buttons[1] && gp.buttons[1].pressed,  // B / Circle
      block: (gp.buttons[4] && gp.buttons[4].pressed) || (gp.buttons[6] && gp.buttons[6].pressed), // LB/LT
      special1: (gp.buttons[5] && gp.buttons[5].pressed) || (gp.buttons[7] && gp.buttons[7].pressed), // RB/RT
      superMove: (gp.buttons[8] && gp.buttons[8].pressed) || (gp.buttons[9] && gp.buttons[9].pressed),
    };
  }

  // --- ATUALIZAR ENTRADAS DOS LUTADORES ---
  updateFighterInput(fighter, binds, gpIndex = null, justPressed = {}) {
    const gp = gpIndex !== null ? this.getGamepadState(gpIndex) : null;

    const left = this.isPressed(binds.left) || (gp && gp.left);
    const right = this.isPressed(binds.right) || (gp && gp.right);
    const up = this.isPressed(binds.up) || (gp && gp.up);
    const down = this.isPressed(binds.down) || (gp && gp.down);
    const block = this.isPressed(binds.block) || (gp && gp.block);

    // Agachamento
    fighter.crouch(down);

    // Bloqueio
    fighter.block(block);

    // Movimentação
    if (!down && !block) {
      if (left && !right) {
        fighter.move(-1);
      } else if (right && !left) {
        fighter.move(1);
      } else {
        fighter.stopMoving();
      }
    }

    // Pulo
    if (up && fighter.isGrounded) {
      const dirX = left ? -1 : (right ? 1 : 0);
      fighter.jump(dirX);
    }

    // Golpes (Com checagem de evento de disparo único/justPressed)
    if (justPressed.superMove) fighter.superMove();
    else if (justPressed.special1) fighter.special1();
    else if (justPressed.heavyPunch) fighter.heavyPunch();
    else if (justPressed.lightPunch) fighter.lightPunch();
    else if (justPressed.heavyKick) fighter.heavyKick();
    else if (justPressed.lightKick) fighter.lightKick();
  }
}
