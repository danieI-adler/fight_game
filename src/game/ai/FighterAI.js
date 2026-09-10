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
    const isHighTournament = this.difficulty === 'tournament' && this.tournamentLevel >= 6;
    const isTournament = this.difficulty === 'tournament';
    const profile = this.playerProfile;

    // Detecta se o oponente está executando ataque agora
    const opponentState = opponent.state;
    const isOpponentInAttackState = [
      'LIGHT_KICK', 'HEAVY_KICK', 'LIGHT_PUNCH', 'HEAVY_PUNCH',
      'CROUCH_KICK', 'CROUCH_PUNCH', 'JUMP_KICK', 'JUMP_PUNCH'
    ].includes(opponentState);

    // Detecta padrão de spam de kick (seja pelo histórico do torneio ou pelo estado atual)
    const isKickSpammer = Boolean(
      (profile && (profile.raw?.attacks?.lightKick > 8 || profile.raw?.attacks?.crouchKick > 8) &&
        (profile.raw?.attacks?.lightKick + (profile.raw?.attacks?.crouchKick || 0)) / Math.max(1, profile.raw?.totalActions) > 0.35) ||
      (opponentState === 'LIGHT_KICK' || opponentState === 'CROUCH_KICK')
    );

    // =========================================================================
    // 1. REAÇÃO PRIORITÁRIA ANTI-SPAM DE KICK & FRAME-TRAP (CRAZY & HIGH TOURNAMENT)
    // =========================================================================
    if ((isCrazy || isHighTournament) && isOpponentInAttackState) {
      // (A) Startup Interruption: Oponente está no início do golpe (stateTime < 0.07 para chutes)
      // O soco (punch) tem startup de 0.03s, superando o chute de 0.07s instantaneamente!
      if (opponent.stateTime < 0.07 && dist < 85) {
        if (fighter.energy >= 100) {
          fighter.superMove();
          return;
        } else if (fighter.energy >= 33 && rng < 0.7) {
          fighter.specialAttack();
          return;
        } else {
          fighter.punch();
          return;
        }
      }

      // (B) Whiff & Recovery Punish: Oponente terminou a janela ativa e está se recuperando (stateTime >= 0.18s)
      if (opponent.stateTime >= 0.18 && dist < 130) {
        if (fighter.isBlocking) fighter.block(false);

        if (fighter.energy >= 100) {
          fighter.superMove();
          return;
        } else if (fighter.energy >= 33 && rng < 0.85) {
          fighter.specialAttack();
          return;
        } else {
          // Punição com soco rápido que gera frame advantage
          fighter.punch();
          return;
        }
      }

      // (C) Spacing Trap: Se o oponente spamma chutes mas está entre 75px e 140px
      // A IA dá um backdash para fazer o chute errar (whiff) ou pula aplicando jump-attack
      if (isKickSpammer && dist >= 70 && dist <= 140 && rng < 0.6) {
        if (rng < 0.35) {
          // Salta por cima do chute baixo
          fighter.jump(opponent.position.x > fighter.position.x ? 1 : -1);
          return;
        } else {
          // Recua com dash invulnerável e imediatamente pune
          fighter.dash(opponent.position.x > fighter.position.x ? -1 : 1);
          return;
        }
      }
    }

    // =========================================================================
    // 2. DEFESA ADAPTATIVA E BLOQUEIO DE HITBOXES ATIVAS
    // =========================================================================
    if (isOpponentAttacking && dist < 170) {
      let blockChance = 0.5;
      if (isCrazy) {
        blockChance = 0.998; // 99.8% de bloqueio
      } else if (isTournament) {
        blockChance = Math.min(0.96, 0.25 + (this.tournamentLevel - 1) * 0.08);
      } else {
        blockChance = {
          easy: 0.2,
          medium: 0.55,
          hard: 0.85,
          boss: 0.95,
          crazy: 0.998
        }[this.difficulty] || 0.5;
      }

      if (rng < blockChance) {
        fighter.block(true);

        // Agacha na defesa se o golpe for baixo ou oponente crouch
        const isLowAttack = opponent.state === 'CROUCH_KICK' || opponent.isCrouching ||
          (profile && profile.lowAttackRatio > 0.4 && rng < 0.8);
        if (isLowAttack) {
          fighter.crouch(true);
        }

        // GUARD CANCEL IMEDIATO PARA CRAZY / LVL 10:
        // No momento em que o ataque atinge ou logo em seguida, se a IA tiver energia, contra-ataca!
        if (isCrazy && fighter.energy >= 33 && rng < 0.45) {
          fighter.block(false);
          fighter.specialAttack();
          return;
        }
        return;
      }
    } else {
      // Libera bloqueio imediatamente se o oponente parou de atacar para nunca ficar travado!
      if (fighter.isBlocking) {
        fighter.block(false);
      }
    }

    // =========================================================================
    // 3. ANTI-AIR IMPLACÁVEL (Punição de pulo)
    // =========================================================================
    if (!opponent.isGrounded && dist < 155) {
      const antiAirChance = isCrazy
        ? 0.99
        : (isTournament
            ? Math.min(0.96, 0.35 + (this.tournamentLevel - 1) * 0.08 + (profile?.jumpSpamRatio || 0) * 0.3)
            : (this.difficulty === 'boss' ? 0.88 : (this.difficulty === 'hard' ? 0.75 : 0.25)));

      if (rng < antiAirChance) {
        if (fighter.energy >= 33 && rng < 0.6) {
          fighter.specialAttack();
        } else {
          fighter.punch();
        }
        return;
      }
    }

    // =========================================================================
    // 4. PUNIÇÃO IMEDIATA DE WHIFF & PRESSÃO CONSTANTE
    // =========================================================================
    if (isCrazy && !isOpponentAttacking && dist < 130) {
      if (fighter.energy >= 100) {
        fighter.superMove();
        return;
      } else if (fighter.energy >= 33 && Math.random() < 0.8) {
        fighter.specialAttack();
        return;
      } else {
        if (Math.random() < 0.65) fighter.punch();
        else fighter.kick();
        return;
      }
    }

    // =========================================================================
    // 5. SUPER MOVE OTIMIZADO
    // =========================================================================
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

    // =========================================================================
    // 6. ATAQUE ESPECIAL / PROJÉTIL
    // =========================================================================
    if (fighter.energy >= 33 && dist < 240 && dist > 55) {
      const specialChance = isCrazy ? 0.94 : (isTournament ? 0.25 + (this.tournamentLevel * 0.07) : 0.5);
      if (rng < specialChance) {
        fighter.specialAttack();
        return;
      }
    }

    // 7. Curta Distância (< 100px) - Agressão Máxima
    if (dist < 100) {
      if (isCrazy) {
        if (fighter.energy >= 33 && Math.random() < 0.5) {
          fighter.specialAttack();
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
