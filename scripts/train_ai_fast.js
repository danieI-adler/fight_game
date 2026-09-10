/**
 * Script de Simulação Acelerada Headless (Auto-Treinamento de IA)
 * Executa centenas/milhares de partidas aceleradas sem interface gráfica
 * para mensurar taxa de vitória, calibrar frame-data e validar a IA CRAZY.
 * 
 * Uso: node scripts/train_ai_fast.js [numPartidas]
 */

import { Fighter } from '../src/game/engine/Fighter.js';
import { FighterAI } from '../src/game/ai/FighterAI.js';
import { CollisionSystem } from '../src/game/engine/Collision.js';
import { CHARACTERS } from '../src/game/characters/characterData.js';

const TOTAL_MATCHES = parseInt(process.argv[2], 10) || 50;
const MAX_FRAMES_PER_MATCH = 60 * 99; // 99 segundos virtuais
const FIXED_DT = 1 / 60;

console.log(`\n======================================================`);
console.log(`🚀 INICIANDO SIMULAÇÃO ACELERADA DE COMBATE`);
console.log(`📊 Total de Partidas: ${TOTAL_MATCHES}`);
console.log(`🤖 P1 (IA Teste - CRAZY) vs P2 (IA Base - HARD/BOSS)`);
console.log(`======================================================\n`);

const results = {
  p1Wins: 0,
  p2Wins: 0,
  draws: 0,
  totalDamageP1: 0,
  totalDamageP2: 0,
  avgFrames: 0
};

const startTime = Date.now();

for (let m = 1; m <= TOTAL_MATCHES; m++) {
  // Configuração dos Lutadores
  const charP1 = CHARACTERS[0]; // Personagem 1
  const charP2 = CHARACTERS[1]; // Personagem 2

  const p1 = new Fighter(charP1, false, 560);
  const p2 = new Fighter(charP2, true, 560);
  p1.position.set(400, 560);
  p2.position.set(800, 560);
  p1.setOpponent(p2);
  p2.setOpponent(p1);

  // IA 1 (CRAZY) vs IA 2 (HARD)
  const aiCrazy = new FighterAI('crazy');
  const aiHard = new FighterAI('hard');

  let matchFrame = 0;
  let winner = null;

  while (matchFrame < MAX_FRAMES_PER_MATCH) {
    matchFrame++;

    // 1. Decisão das IAs
    aiCrazy.update(p1, p2, FIXED_DT);
    aiHard.update(p2, p1, FIXED_DT);

    // 2. Física e movimentação
    p1.update(FIXED_DT, 2000, null);
    p2.update(FIXED_DT, 2000, null);

    // 3. Colisões de corpo
    CollisionSystem.resolvePushboxes(p1, p2);

    // 4. Checagem de Hitboxes
    if (p1.activeHitbox && !p1.hasHitCurrentAttack) {
      const hit = CollisionSystem.checkAttackHit(p1, p2);
      if (hit) {
        p2.receiveHit(p1.activeHitbox, hit.point, null);
        p1.hasHitCurrentAttack = true;
      }
    }

    if (p2.activeHitbox && !p2.hasHitCurrentAttack) {
      const hit = CollisionSystem.checkAttackHit(p2, p1);
      if (hit) {
        p1.receiveHit(p2.activeHitbox, hit.point, null);
        p2.hasHitCurrentAttack = true;
      }
    }

    // 5. Checagem de KO
    if (p1.isDead) {
      winner = 'P2';
      break;
    }
    if (p2.isDead) {
      winner = 'P1';
      break;
    }
  }

  if (!winner) {
    winner = p1.health > p2.health ? 'P1' : (p2.health > p1.health ? 'P2' : 'DRAW');
  }

  if (winner === 'P1') results.p1Wins++;
  else if (winner === 'P2') results.p2Wins++;
  else results.draws++;

  results.totalDamageP1 += (1000 - p2.health);
  results.totalDamageP2 += (1000 - p1.health);
  results.avgFrames += matchFrame;

  if (m % 10 === 0 || m === TOTAL_MATCHES) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Luta ${m}/${TOTAL_MATCHES}] CRAZY: ${results.p1Wins} vitórias | HARD: ${results.p2Wins} vitórias | Tempo: ${elapsed}s`);
  }
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
const winRateCrazy = ((results.p1Wins / TOTAL_MATCHES) * 100).toFixed(1);

console.log(`\n================== RESULTADO DO TREINAMENTO ==================`);
console.log(`⚡ Taxa de Vitória da IA CRAZY: ${winRateCrazy}% (${results.p1Wins}/${TOTAL_MATCHES})`);
console.log(`🛡️ Vitórias da IA HARD: ${results.p2Wins}`);
console.log(`⏱️ Tempo total de simulação: ${totalTime}s`);
console.log(`⚔️ Média de frames por duelo: Math.round(${results.avgFrames / TOTAL_MATCHES}) frames (~${((results.avgFrames / TOTAL_MATCHES) / 60).toFixed(1)}s de luta)`);
console.log(`==============================================================\n`);
