/**
 * Arquitetura Modular de Habilidades Especiais
 * Esta interface foi desenhada para que você e o agente de backend possam
 * adicionar facilmente novas magias, transformações, projéteis e golpes customizados.
 */

export class AbilityBase {
  constructor(name, cost = 25, cooldown = 0.5) {
    this.name = name;
    this.cost = cost;
    this.cooldown = cooldown;
    this.currentCooldown = 0;
  }

  canExecute(fighter) {
    return fighter.energy >= this.cost && this.currentCooldown <= 0 && fighter.canAct();
  }

  update(dt) {
    if (this.currentCooldown > 0) {
      this.currentCooldown -= dt;
    }
  }

  execute(fighter, opponent, engine) {
    if (!this.canExecute(fighter)) return false;

    fighter.energy -= this.cost;
    this.currentCooldown = this.cooldown;
    this.onCast(fighter, opponent, engine);
    return true;
  }

  /**
   * Sobrescreva este método para implementar o efeito visual e físico da habilidade!
   */
  onCast(fighter, opponent, engine) {
    console.log(`Habilidade ${this.name} executada por ${fighter.charData.name}`);
  }
}

/**
 * Registro Global de Habilidades Customizáveis
 */
export class AbilitiesRegistry {
  static abilities = new Map();

  static register(characterId, slot, abilityInstance) {
    const key = `${characterId}_${slot}`;
    this.abilities.set(key, abilityInstance);
  }

  static get(characterId, slot) {
    return this.abilities.get(`${characterId}_${slot}`);
  }
}
