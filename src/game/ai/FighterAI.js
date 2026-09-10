/**
 * Inteligência Artificial para Luta
 * Suporta dificuldades: 'easy', 'medium', 'hard', 'boss', 'crazy' e 'dummy'
 * Também suporta modo 'tournament' adaptativo (níveis 1 a 10)
 */

export class FighterAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty;
    this.tournamentLevel = 1;
    this.playerProfile = null;
    this.decisionTimer = 0;
    this.nextActionTime = 0.2;
    this.currentAction = null;
    this.actionDuration = 0;
  }

  setDifficulty(difficulty, tournamentLevel = 1, playerProfile = null) {
    this.difficulty = difficulty;
    this.tournamentLevel = tournamentLevel;
    this.playerProfile = playerProfile;
  }

  update(fighter, opponent, dt = 1 / 60) {
    if (!fighter || !opponent || fighter.isDead || !fighter.canAct()) return;

    this.decisionTimer += dt;
    this.actionDuration -= dt;

    if (this.difficulty === 'dummy') {
      fighter.stopMoving();
      return;
    }

    let decisionInterval = 0.18;
    if (this.difficulty === 'crazy') {
      decisionInterval = 0.016; // 1 frame / 60 FPS (Reação perfeita sobre-humana)
    } else if (this.difficulty === 'tournament') {
      // Escala suave do nível 1 (0.35s - Fácil) até o nível 10 (0.016s - Crazy)
      decisionInterval = Math.max(0.016, 0.35 - (this.tournamentLevel - 1) * 0.037);
    } else {
      decisionInterval = {
        easy: 0.35,
        medium: 0.18,
        hard: 0.08,
        boss: 0.04,
        crazy: 0.016
      }[this.difficulty] || 0.18;
    }

    if (this.decisionTimer >= decisionInterval) {
      this.decisionTimer = 0;
      try {
        this.makeDecision(fighter, opponent);
      } catch (err) {
        console.error('AI error prevented:', err);
      }
    }
  }

  makeDecision(fighter, opponent) {
    const dist = Math.abs(fighter.position.x - opponent.position.x);
    const isOpponentAttacking = opponent.activeHitbox !== null;
    const rng = Math.random();

    // Nível de precisão / dificuldade
    const isCrazy = this.difficulty === 'crazy' || (this.difficulty === 'tournament' && this.tournamentLevel === 10);
    const isTournament = this.difficulty === 'tournament';
    const profile = this.playerProfile;

    // 1. Reação a Ataques do Oponente (Defesa Perfeita / Adaptativa)
    if (isOpponentAttacking && dist < 170) {
      let blockChance = 0.5;
      if (isCrazy) {
        blockChance = 0.995; // 99.5% de bloqueio
      } else if (isTournament) {
        blockChance = Math.min(0.95, 0.25 + (this.tournamentLevel - 1) * 0.08);
      } else {
        blockChance = {
          easy: 0.2,
          medium: 0.55,
          hard: 0.85,
          boss: 0.95,
          crazy: 0.995
        }[this.difficulty] || 0.5;
      }

      if (rng < blockChance) {
        fighter.block(true);

        const shouldCrouchBlock = opponent.isCrouching || (profile && profile.lowAttackRatio > 0.45 && Math.random() < 0.8);
        if (shouldCrouchBlock) {
          fighter.crouch(true);
        }
        return;
      }
    } else {
      // Libera bloqueio imediatamente se o oponente parou de atacar para poder bater
      if (fighter.isBlocking) {
        fighter.block(false);
      }
    }

    // 2. Anti-Air Implacável (Punição de pulo)
    if (!opponent.isGrounded && dist < 150) {
      const antiAirChance = isCrazy
        ? 0.98
        : (isTournament
            ? Math.min(0.95, 0.3 + (this.tournamentLevel - 1) * 0.08 + (profile?.jumpSpamRatio || 0) * 0.3)
            : (this.difficulty === 'boss' ? 0.85 : (this.difficulty === 'hard' ? 0.7 : 0.2)));

      if (rng < antiAirChance) {
        if (fighter.energy >= 25 && rng < 0.5) {
          fighter.special1();
        } else {
          fighter.punch();
        }
        return;
      }
    }

    // 3. Punição Imediata de Whiff & Pressão Constante
    if (isCrazy && !isOpponentAttacking && dist < 125) {
      if (fighter.energy >= 100) {
        fighter.superMove();
        return;
      } else if (fighter.energy >= 25 && Math.random() < 0.75) {
        fighter.special1();
        return;
      } else {
        if (Math.random() < 0.6) fighter.punch();
        else fighter.kick();
        return;
      }
    }

    // 4. Super Move Otimizado
    if (fighter.energy >= 100 && dist < 260) {
      const superChance = isCrazy
        ? 0.99
        : (isTournament
            ? Math.min(0.98, 0.4 + (this.tournamentLevel - 1) * 0.07)
            : ({ easy: 0.3, medium: 0.6, hard: 0.85, boss: 0.95, crazy: 0.99 }[this.difficulty] || 0.6));

      if (rng < superChance) {
        fighter.superMove();
        return;
      }
    }

    // 5. Ataque Especial / Projétil
    if (fighter.energy >= 25 && dist < 220 && dist > 50) {
      const specialChance = isCrazy ? 0.92 : (isTournament ? 0.2 + (this.tournamentLevel * 0.06) : 0.45);
      if (rng < specialChance) {
        fighter.special1();
        return;
      }
    }

    // 6. Curta Distância (< 100px) - Agressão Máxima
    if (dist < 100) {
      if (isCrazy) {
        if (fighter.energy >= 25 && Math.random() < 0.5) {
          fighter.special1();
        } else if (Math.random() < 0.55) {
          fighter.punch();
        } else {
          fighter.kick();
        }
        return;
      }

      const attackType = Math.random();
      if (attackType < 0.5) {
        fighter.punch();
      } else {
        fighter.kick();
      }
      return;
    }

    // 7. Média Distância (95px - 260px)
    if (dist >= 95 && dist <= 260) {
      const dir = opponent.position.x > fighter.position.x ? 1 : -1;

      // No modo CRAZY, fecha espaço com dash agressivo
      if (isCrazy && Math.random() < 0.4) {
        fighter.dash(dir);
        return;
      }

      const moveChoice = Math.random();
      if (moveChoice < 0.6) {
        fighter.move(dir);
      } else if (moveChoice < 0.75) {
        fighter.jump(dir);
      } else if (moveChoice < 0.88) {
        fighter.dash(dir);
      } else {
        fighter.stopMoving();
      }
      return;
    }

    // 8. Longa Distância (> 260px)
    if (dist > 260) {
      const dir = opponent.position.x > fighter.position.x ? 1 : -1;
      if (isCrazy && Math.random() < 0.35) {
        fighter.dash(dir);
      } else {
        fighter.move(dir);
      }
    }
  }
}
