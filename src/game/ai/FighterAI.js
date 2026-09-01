/**
 * Inteligência Artificial para Luta
 * Suporta dificuldades: 'easy', 'medium', 'hard', 'boss' e 'dummy'
 */

export class FighterAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.decisionTimer = 0;
    this.nextActionTime = 0.2;
    this.currentAction = null;
    this.actionDuration = 0;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  update(fighter, opponent, dt = 1 / 60) {
    if (!fighter || !opponent || fighter.isDead || !fighter.canAct()) return;

    this.decisionTimer += dt;
    this.actionDuration -= dt;

    if (this.difficulty === 'dummy') {
      fighter.stopMoving();
      return;
    }

    // Intervalo de decisão baseado na dificuldade
    const decisionInterval = {
      easy: 0.35,
      medium: 0.18,
      hard: 0.08,
      boss: 0.04,
    }[this.difficulty] || 0.18;

    if (this.decisionTimer >= decisionInterval) {
      this.decisionTimer = 0;
      this.makeDecision(fighter, opponent);
    }
  }

  makeDecision(fighter, opponent) {
    const dist = Math.abs(fighter.position.x - opponent.position.x);
    const isOpponentAttacking = opponent.activeHitbox !== null;
    const rng = Math.random();

    // 1. Reação a Ataques do Oponente (Defesa Inteligente)
    if (isOpponentAttacking && dist < 160) {
      const blockChance = {
        easy: 0.2,
        medium: 0.55,
        hard: 0.85,
        boss: 0.95,
      }[this.difficulty] || 0.5;

      if (rng < blockChance) {
        fighter.block(true);
        if (opponent.isCrouching) {
          fighter.crouch(true);
        }
        return;
      }
    } else {
      fighter.block(false);
    }

    // 2. Se o oponente estiver no ar e perto (Anti-Air)
    if (!opponent.isGrounded && dist < 120 && (this.difficulty === 'hard' || this.difficulty === 'boss')) {
      if (rng < 0.7) {
        fighter.heavyPunch(); // Uppercut
        return;
      }
    }

    // 3. Super Move quando energia estiver cheia
    if (fighter.energy >= 100 && dist < 220) {
      const superChance = {
        easy: 0.3,
        medium: 0.6,
        hard: 0.85,
        boss: 0.98,
      }[this.difficulty] || 0.6;

      if (rng < superChance) {
        fighter.superMove();
        return;
      }
    }

    // 4. Ataque Especial
    if (fighter.energy >= 25 && dist < 180 && dist > 70) {
      if (rng < 0.4) {
        fighter.special1();
        return;
      }
    }

    // 5. Combate Corpo a Corpo (Curta Distância: < 95px)
    if (dist < 95) {
      const attackType = Math.random();
      if (attackType < 0.3) {
        fighter.lightPunch();
      } else if (attackType < 0.55) {
        fighter.heavyPunch();
      } else if (attackType < 0.8) {
        fighter.lightKick();
      } else if (attackType < 0.95) {
        fighter.heavyKick();
      } else {
        fighter.crouch(true);
        fighter.crouchKick();
      }
      return;
    }

    // 6. Média Distância (95px - 260px)
    if (dist >= 95 && dist <= 260) {
      const moveChoice = Math.random();
      if (moveChoice < 0.6) {
        // Avançar em direção ao oponente
        const dir = opponent.position.x > fighter.position.x ? 1 : -1;
        fighter.move(dir);
      } else if (moveChoice < 0.75) {
        // Pulo para frente
        const dir = opponent.position.x > fighter.position.x ? 1 : -1;
        fighter.jump(dir);
      } else if (moveChoice < 0.88) {
        // Dash
        const dir = opponent.position.x > fighter.position.x ? 1 : -1;
        fighter.dash(dir);
      } else {
        fighter.stopMoving();
      }
      return;
    }

    // 7. Longa Distância (> 260px)
    if (dist > 260) {
      const dir = opponent.position.x > fighter.position.x ? 1 : -1;
      fighter.move(dir);
    }
  }
}
