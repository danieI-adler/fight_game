export class BaseCharacter {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  // Inicializa propriedades exclusivas no lutador
  init(fighter) {}

  // Chamado no Fighter.reset()
  reset(fighter, startX, keepEnergy) {}

  // Retorna true se executou especial próprio
  onSpecial(fighter, level) {
    fighter.extraType = 'GENERIC_EXTRA';
    return true;
  }

  // Retorna true se executou super próprio
  onSuper(fighter) {
    fighter.superType = 'GUSTAVE_SMASH';
    fighter.superPhase = 'CHARGE';
    return true;
  }

  // Atualização por frame de projéteis, timers e colisões específicas
  update(fighter, dt, stageWidth, particles) {}

  // Desenha efeitos, projéteis ou ícones de status no Canvas
  draw(fighter, ctx) {}

  // Hook chamado quando este lutador acerta um golpe
  onHitGiven(fighter, opponent, hitData) {}

  // Hook chamado quando este lutador recebe um golpe
  onHitTaken(fighter, attackData) {}
}
