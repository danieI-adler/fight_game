/**
 * Sistema de Colisão: Hitbox, Hurtbox, Pushbox
 * Utilizado para precisão de golpes, detecção de dano e empurrão entre lutadores.
 */

export class Box {
  constructor(x, y, width, height, type = 'hurtbox') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'hurtbox', 'hitbox', 'pushbox', 'shield'
  }

  intersects(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }

  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }
}

export class CollisionSystem {
  /**
   * Verifica se o hitbox do atacante colide com a hurtbox do defensor
   */
  static checkAttackHit(attacker, defender) {
    if (!attacker.activeHitbox || defender.isDead || defender.isInvulnerable) {
      return null;
    }

    const hitboxes = Array.isArray(attacker.activeHitbox) ? attacker.activeHitbox : [attacker.activeHitbox];
    const hurtboxes = defender.getHurtboxes();

    for (const hb of hitboxes) {
      for (const hurt of hurtboxes) {
        if (hb.intersects(hurt)) {
          const hitCenter = hb.getCenter();
          return {
            hit: true,
            point: hitCenter,
            hitbox: hb,
            hurtbox: hurt
          };
        }
      }
    }

    return null;
  }

  /**
   * Evita que lutadores atravessem um ao outro (Pushbox overlap resolution)
   */
  static resolvePushboxes(f1, f2) {
    const b1 = f1.getPushbox();
    const b2 = f2.getPushbox();

    if (b1.intersects(b2)) {
      const overlapX = Math.min(b1.x + b1.width - b2.x, b2.x + b2.width - b1.x);
      const pushAmount = overlapX / 2;

      if (f1.position.x < f2.position.x) {
        f1.position.x -= pushAmount;
        f2.position.x += pushAmount;
      } else {
        f1.position.x += pushAmount;
        f2.position.x -= pushAmount;
      }
    }
  }
}
