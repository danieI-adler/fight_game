import { FIGHTER_STATE } from './Fighter';

/**
 * FighterAnimator
 * Gerencia a cinemática e posições articulares do esqueleto do lutador,
 * aliviando a classe principal Fighter de centenas de coordenadas hardcoded.
 */
export class FighterAnimator {
  static updatePose(fighter) {
    const t = fighter.stateTime;
    const f = fighter.facing;
    const p = fighter.pose;

    p.head = { x: 0, y: -115 };
    p.chest = { x: 0, y: -80 };
    p.pelvis = { x: 0, y: -50 };

    switch (fighter.state) {
      case FIGHTER_STATE.IDLE: {
        const bounce = Math.sin(t * 7) * 3;
        p.head.y = -115 + bounce;
        p.chest.y = -80 + bounce;
        p.pelvis.y = -50 + bounce * 0.5;

        p.leftShoulder = { x: -8 * f, y: -85 + bounce };
        p.leftElbow = { x: 12 * f, y: -70 + bounce };
        p.leftHand = { x: 22 * f, y: -85 + bounce };

        p.rightShoulder = { x: 8 * f, y: -85 + bounce };
        p.rightElbow = { x: 25 * f, y: -65 + bounce };
        p.rightHand = { x: 35 * f, y: -75 + bounce };

        p.leftHip = { x: -10 * f, y: -50 };
        p.leftKnee = { x: -16 * f, y: -25 };
        p.leftFoot = { x: -18 * f, y: 0 };

        p.rightHip = { x: 10 * f, y: -50 };
        p.rightKnee = { x: 18 * f, y: -25 };
        p.rightFoot = { x: 22 * f, y: 0 };
        break;
      }

      case FIGHTER_STATE.WALK_FORWARD:
      case FIGHTER_STATE.WALK_BACK: {
        const walkCycle = Math.sin(t * 12);
        p.head.y = -115 + Math.abs(walkCycle) * 3;
        p.chest.y = -80 + Math.abs(walkCycle) * 3;

        p.leftFoot = { x: walkCycle * 25 * f, y: Math.max(0, -walkCycle * 15) };
        p.rightFoot = { x: -walkCycle * 25 * f, y: Math.max(0, walkCycle * 15) };
        p.leftKnee = { x: p.leftFoot.x * 0.6, y: -25 };
        p.rightKnee = { x: p.rightFoot.x * 0.6, y: -25 };

        p.leftHand = { x: -walkCycle * 18 * f + 15 * f, y: -80 };
        p.rightHand = { x: walkCycle * 18 * f + 25 * f, y: -80 };
        break;
      }

      case FIGHTER_STATE.CROUCH:
      case FIGHTER_STATE.CROUCH_BLOCK: {
        p.head.y = -75;
        p.chest.y = -50;
        p.pelvis.y = -30;
        p.leftKnee = { x: -15 * f, y: -15 };
        p.leftFoot = { x: -18 * f, y: 0 };
        p.rightKnee = { x: 20 * f, y: -15 };
        p.rightFoot = { x: 22 * f, y: 0 };

        p.leftHand = { x: 15 * f, y: -55 };
        p.rightHand = { x: 28 * f, y: -50 };
        break;
      }

      case FIGHTER_STATE.LIGHT_PUNCH: {
        const ext = Math.sin(Math.min(1, t / 0.22) * Math.PI);
        p.rightShoulder = { x: 10 * f, y: -85 };
        p.rightElbow = { x: (20 + ext * 30) * f, y: -85 };
        p.rightHand = { x: (25 + ext * 55) * f, y: -90 };
        break;
      }

      case FIGHTER_STATE.HEAVY_PUNCH: {
        const ext = Math.sin(Math.min(1, t / 0.38) * Math.PI);
        p.chest.x = (ext * 15) * f;
        p.rightShoulder = { x: 12 * f, y: -85 };
        p.rightElbow = { x: (25 + ext * 40) * f, y: -88 };
        p.rightHand = { x: (30 + ext * 70) * f, y: -92 };
        break;
      }

      case FIGHTER_STATE.LIGHT_KICK: {
        const ext = Math.sin(Math.min(1, t / 0.24) * Math.PI);
        p.rightKnee = { x: (15 + ext * 25) * f, y: -55 };
        p.rightFoot = { x: (20 + ext * 60) * f, y: -65 };
        break;
      }

      case FIGHTER_STATE.HEAVY_KICK: {
        const ext = Math.sin(Math.min(1, t / 0.42) * Math.PI);
        p.head.y = -105;
        p.pelvis.y = -60;
        p.rightKnee = { x: (20 + ext * 35) * f, y: -75 };
        p.rightFoot = { x: (25 + ext * 75) * f, y: -90 };
        break;
      }

      case FIGHTER_STATE.BLOCK: {
        p.leftHand = { x: 18 * f, y: -100 };
        p.rightHand = { x: 22 * f, y: -90 };
        p.leftElbow = { x: 12 * f, y: -75 };
        p.rightElbow = { x: 15 * f, y: -70 };
        break;
      }

      case FIGHTER_STATE.HURT: {
        if (fighter.isWeakenedSway) {
          // Gustave em pé enfraquecido se balançando atordoado (Dizzy Sway)
          const sway = Math.sin(t * 4.5) * 12;
          const bob = Math.sin(t * 9) * 2.5;
          p.head = { x: (sway * 0.7 - 8) * f, y: -108 + bob };
          p.chest = { x: (sway * 0.4 - 4) * f, y: -78 + bob };
          p.pelvis = { x: (sway * 0.15) * f, y: -48 + bob * 0.5 };

          p.leftShoulder = { x: (-10 + sway * 0.3) * f, y: -82 + bob };
          p.leftElbow = { x: (-16 + sway * 0.5) * f, y: -58 + bob };
          p.leftHand = { x: (-12 + sway * 0.6) * f, y: -40 + bob };

          p.rightShoulder = { x: (10 + sway * 0.3) * f, y: -82 + bob };
          p.rightElbow = { x: (18 + sway * 0.5) * f, y: -56 + bob };
          p.rightHand = { x: (22 + sway * 0.6) * f, y: -38 + bob };

          p.leftHip = { x: -10 * f, y: -48 };
          p.leftKnee = { x: -15 * f, y: -24 };
          p.leftFoot = { x: -16 * f, y: 0 };

          p.rightHip = { x: 10 * f, y: -48 };
          p.rightKnee = { x: 17 * f, y: -24 };
          p.rightFoot = { x: 20 * f, y: 0 };
        } else {
          p.head.x = -15 * f;
          p.head.y = -110;
          p.chest.x = -10 * f;
          p.leftHand = { x: -20 * f, y: -60 };
          p.rightHand = { x: -10 * f, y: -55 };
        }
        break;
      }

      case FIGHTER_STATE.KNOCKDOWN:
      case FIGHTER_STATE.DEFEAT: {
        p.head = { x: -40 * f, y: -15 };
        p.chest = { x: -20 * f, y: -15 };
        p.pelvis = { x: 0, y: -10 };
        p.leftHand = { x: -35 * f, y: -5 };
        p.rightHand = { x: -15 * f, y: -5 };
        p.leftFoot = { x: 30 * f, y: 0 };
        p.rightFoot = { x: 45 * f, y: 0 };
        break;
      }

      case FIGHTER_STATE.SUPER_MOVE: {
        if (fighter.superType === 'MAELLE_WALTZ') {
          const lunge = Math.sin(t * 40);
          p.head.y = -100 + lunge * 4;
          p.chest.x = 12 * f;
          p.chest.y = -75;
          p.pelvis.y = -45;
          p.leftHand = { x: -20 * f, y: -75 };
          p.rightShoulder = { x: 12 * f, y: -80 };
          p.rightElbow = { x: 30 * f, y: -82 };
          p.rightHand = { x: (45 + lunge * 18) * f, y: -85 };
          p.leftKnee = { x: -16 * f, y: -25 };
          p.leftFoot = { x: -24 * f, y: 0 };
          p.rightKnee = { x: 22 * f, y: -25 };
          p.rightFoot = { x: 30 * f, y: 0 };
        } else if (fighter.superType === 'RENOIR_FLOWER') {
          // Renoir ergue a bengala solenemente aos céus para conjurar e arremessar a flor negra
          if (t < 1.2) {
            // Postura imponente, erguendo a bengala para o alto
            const castVibe = Math.sin(t * 15) * 1.5;
            p.head.y = -118;
            p.chest.y = -85;
            p.pelvis.y = -50;
            p.leftHand = { x: -16 * f, y: -75 }; // Mão esquerda nas costas ou segurando a lapela
            p.rightShoulder = { x: 10 * f, y: -90 };
            p.rightElbow = { x: 18 * f, y: -130 };
            p.rightHand = { x: 22 * f + castVibe, y: -165 + castVibe }; // Mão e bengala apontando direto para cima
            p.leftKnee = { x: -12 * f, y: -25 };
            p.leftFoot = { x: -18 * f, y: 0 };
            p.rightKnee = { x: 14 * f, y: -25 };
            p.rightFoot = { x: 20 * f, y: 0 };
          } else {
            // Golpeia / aponta a bengala para baixo com força ordenando o esmagamento da flor
            p.head.y = -105;
            p.chest.y = -75;
            p.pelvis.y = -45;
            p.leftHand = { x: -22 * f, y: -65 };
            p.rightShoulder = { x: 16 * f, y: -80 };
            p.rightElbow = { x: 28 * f, y: -70 };
            p.rightHand = { x: 42 * f, y: -45 }; // Bengala apontada para frente/baixo em direção ao alvo
            p.leftKnee = { x: -16 * f, y: -22 };
            p.leftFoot = { x: -22 * f, y: 0 };
            p.rightKnee = { x: 20 * f, y: -22 };
            p.rightFoot = { x: 26 * f, y: 0 };
          }
        } else {
          if (t < 0.5) {
            const chargeVibe = Math.sin(t * 50) * 2;
            p.head.y = -85 + chargeVibe;
            p.chest.y = -60 + chargeVibe;
            p.pelvis.y = -35;
            p.leftHand = { x: 5 * f, y: -65 };
            p.rightShoulder = { x: -6 * f, y: -65 };
            p.rightElbow = { x: -26 * f + chargeVibe, y: -50 };
            p.rightHand = { x: -35 * f + chargeVibe, y: -40 };
            p.leftKnee = { x: -18 * f, y: -20 };
            p.leftFoot = { x: -22 * f, y: 0 };
            p.rightKnee = { x: 22 * f, y: -20 };
            p.rightFoot = { x: 28 * f, y: 0 };
          } else if (t < 0.85) {
            p.head.y = -115;
            p.chest.y = -85;
            p.pelvis.y = -55;
            p.leftHand = { x: -12 * f, y: -55 };
            p.rightShoulder = { x: 16 * f, y: -90 };
            p.rightElbow = { x: 28 * f, y: -125 };
            p.rightHand = { x: 36 * f, y: -155 };
            p.leftKnee = { x: -12 * f, y: -35 };
            p.leftFoot = { x: -16 * f, y: -15 };
            p.rightKnee = { x: 16 * f, y: -30 };
            p.rightFoot = { x: 22 * f, y: -10 };
          } else {
            p.head.y = -70;
            p.chest.y = -45;
            p.pelvis.y = -30;
            p.leftHand = { x: -24 * f, y: -55 };
            p.rightShoulder = { x: 16 * f, y: -50 };
            p.rightElbow = { x: 28 * f, y: -25 };
            p.rightHand = { x: 36 * f, y: 0 };
            p.leftKnee = { x: -22 * f, y: -15 };
            p.leftFoot = { x: -28 * f, y: 0 };
            p.rightKnee = { x: 18 * f, y: -15 };
            p.rightFoot = { x: 24 * f, y: 0 };
          }
        }
        break;
      }
    }
  }
}
