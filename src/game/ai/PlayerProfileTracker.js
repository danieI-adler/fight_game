/**
 * PlayerProfileTracker
 * Monitora em tempo real os hábitos, preferências e padrões de combate
 * do jogador durante o torneio para alimentar a IA evolutiva.
 */
export class PlayerProfileTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalActions = 0;
    this.jumps = 0;
    this.crouches = 0;
    this.blocks = 0;
    this.dashes = 0;

    // Métricas de ataque
    this.attacks = {
      lightPunch: 0,
      heavyPunch: 0,
      lightKick: 0,
      heavyKick: 0,
      crouchKick: 0,
      special: 0,
      super: 0
    };

    // Padrões posicionais
    this.prefersCloseRange = 0; // < 120px
    this.prefersMidRange = 0;   // 120px - 260px
    this.prefersLongRange = 0;  // > 260px
    this.panicCornerEscapes = 0;

    // Janelas de punição
    this.whiffsDetected = 0;
    this.wasCounteredOnJump = 0;
  }

  /**
   * Chamado a cada frame em que o jogador executa ou mantém uma ação
   */
  trackPlayerFrame(player, opponent, dist) {
    if (!player || player.isDead) return;

    if (dist < 120) this.prefersCloseRange++;
    else if (dist <= 260) this.prefersMidRange++;
    else this.prefersLongRange++;

    if (player.isBlocking) this.blocks++;
    if (player.isCrouching) this.crouches++;
  }

  /**
   * Registra ação direta disparada pelo jogador
   */
  recordAction(actionType) {
    this.totalActions++;
    if (actionType === 'JUMP') this.jumps++;
    else if (actionType === 'DASH') this.dashes++;
    else if (this.attacks[actionType] !== undefined) {
      this.attacks[actionType]++;
    }
  }

  /**
   * Retorna os coeficientes de hábito calculados (0.0 a 1.0)
   */
  getHabitProfile() {
    const totalAttacks = Object.values(this.attacks).reduce((a, b) => a + b, 0) || 1;
    const totalPos = (this.prefersCloseRange + this.prefersMidRange + this.prefersLongRange) || 1;

    return {
      // 1. Tendência de Pulo (Jump-in spammer)
      jumpSpamRatio: Math.min(1.0, this.jumps / Math.max(5, this.totalActions * 0.35)),

      // 2. Tendência de Golpes Baixos (Crouch/Low spammer)
      lowAttackRatio: (this.attacks.crouchKick || 0) / totalAttacks,

      // 3. Golpe mais frequente do jogador
      mostFrequentAttack: Object.entries(this.attacks).sort((a, b) => b[1] - a[1])[0][0],

      // 4. Tendência agressiva vs defensiva
      aggressionRatio: totalAttacks / Math.max(1, this.totalActions || 1),
      blockRatio: Math.min(1.0, this.blocks / Math.max(10, totalPos * 0.15)),

      // 5. Preferência de Distância
      preferredDistance: this.prefersCloseRange >= this.prefersMidRange && this.prefersCloseRange >= this.prefersLongRange
        ? 'CLOSE'
        : (this.prefersMidRange >= this.prefersLongRange ? 'MID' : 'LONG'),

      raw: {
        totalActions: this.totalActions,
        jumps: this.jumps,
        attacks: { ...this.attacks }
      }
    };
  }
}

export const playerTracker = new PlayerProfileTracker();
