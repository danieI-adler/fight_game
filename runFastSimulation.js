/**
 * Fast Combat Simulator
 * Runs 100 fights between every pair of characters.
 * Implements the core combat dynamics, AI decision-making, hitboxes, ranges,
 * supers, defense/chip, and unique perks in an accelerated, headless discrete event loop.
 */

import { CHARACTERS } from './src/game/characters/characterData.js';
import { EXPEDITION_33_CHARACTERS } from './src/game/characters/expedition33Characters.js';
import fs from 'fs';

// Simulates a single round/fight between charA and charB
function simulateFight(charA, charB, seed = 0) {
  // Stats
  const hpA_max = charA.stats?.health || 1000;
  const hpB_max = charB.stats?.health || 1000;
  let hpA = hpA_max;
  let hpB = hpB_max;

  const spdA = charA.stats?.speed || 7.0;
  const spdB = charB.stats?.speed || 7.0;

  const atkA = charA.stats?.attackPower || 1.0;
  const atkB = charB.stats?.attackPower || 1.0;

  const defA = charA.stats?.defense || 1.0;
  const defB = charB.stats?.defense || 1.0;

  let energyA = 0;
  let energyB = 0;

  // Arena bounds: 0 to 2000
  let posA = 650;
  let posB = 1350;

  // Cooldowns & States
  let busyTimerA = 0; // if > 0, fighter is in attack/recovery/hitstun
  let busyTimerB = 0;
  let guardTimerA = 0;
  let guardTimerB = 0;

  let isHulkA = false;
  let isHulkB = false;

  let sparrowDodgeA = 0;
  let sparrowDodgeB = 0;

  let scielCritA = 0;
  let scielCritB = 0;

  let zorroA = charA.cannotBlock || (charA.name || '').toLowerCase().includes('zorro');
  let zorroB = charB.cannotBlock || (charB.name || '').toLowerCase().includes('zorro');

  const dt = 1 / 60; // 60 ticks per simulated second
  const maxTicks = 60 * 90; // 90 seconds timeout
  let currentTick = 0;

  while (hpA > 0 && hpB > 0 && currentTick < maxTicks) {
    currentTick++;

    if (busyTimerA > 0) busyTimerA -= dt;
    if (busyTimerB > 0) busyTimerB -= dt;
    if (guardTimerA > 0) guardTimerA -= dt;
    if (guardTimerB > 0) guardTimerB -= dt;

    const dist = Math.abs(posA - posB);

    // AI movement A
    if (busyTimerA <= 0) {
      if (dist > 110) {
        // Move towards opponent
        const moveStep = spdA * 45 * dt;
        if (posA < posB) posA = Math.min(posB - 60, posA + moveStep);
        else posA = Math.max(posB + 60, posA - moveStep);
      } else if (dist < 65) {
        // Small spacing retreat
        if (posA < posB) posA = Math.max(60, posA - spdA * 20 * dt);
        else posA = Math.min(1940, posA + spdA * 20 * dt);
      }
    }

    // AI movement B
    if (busyTimerB <= 0) {
      if (dist > 110) {
        const moveStep = spdB * 45 * dt;
        if (posB > posA) posB = Math.max(posA + 60, posB - moveStep);
        else posB = Math.min(posA - 60, posB + moveStep);
      } else if (dist < 65) {
        if (posB > posA) posB = Math.min(1940, posB + spdB * 20 * dt);
        else posB = Math.max(60, posB - spdB * 20 * dt);
      }
    }

    // Decision A
    if (busyTimerA <= 0) {
      const rollA = Math.random();

      // Super move check
      if (energyA >= 100 && dist < 320) {
        energyA = 0;
        busyTimerA = 0.85; // super commitment
        if (charA.superType === 'HULK_TRANSFORMATION' && !isHulkA) {
          isHulkA = true;
          hpA = Math.min(hpA_max + 500, hpA + 500);
        } else {
          // Super hit resolution
          let hitChance = 0.82;
          if (dist > 220) hitChance = 0.65;
          if (Math.random() < hitChance) {
            let superDmg = 340 * (isHulkA ? 2.2 : atkA) / (isHulkB ? 1.6 : defB);
            if (guardTimerB > 0 && !zorroB) {
              hpB -= Math.round(superDmg * 0.18);
            } else {
              hpB -= Math.round(superDmg);
              busyTimerB = 0.6; // heavy hitstun
            }
          }
        }
      } else if (energyA >= 33 && dist < 260 && rollA < 0.28) {
        // Special attack
        energyA -= 33;
        busyTimerA = 0.38;
        const specName = (charA.name || '').toLowerCase();
        if (specName.includes('sparrow')) sparrowDodgeA = 3;
        if (specName.includes('sciel')) scielCritA = 3;
        if (specName.includes('lune')) hpA = Math.min(hpA_max, hpA + hpA_max * 0.15);

        // Projectile or special strike
        let specDmg = 115 * atkA / defB;
        if (scielCritA > 0) {
          specDmg *= 1.85;
          scielCritA--;
        }
        if (Math.random() < 0.75) {
          if (sparrowDodgeB > 0) {
            sparrowDodgeB--;
          } else if (guardTimerB > 0 && !zorroB) {
            hpB -= Math.round(specDmg * 0.15);
          } else {
            hpB -= Math.round(specDmg);
            energyB = Math.min(100, energyB + 4);
            busyTimerB = 0.25;
          }
        }
      } else if (dist <= 135 && rollA < 0.42) {
        // Normal attack: Light Punch (fast) or Kick (longer range)
        const isPunch = dist < 90 ? rollA < 0.25 : false;
        const dmgBase = isPunch ? 38 : 58;
        const startup = isPunch ? 0.03 : 0.08;
        const totalDuration = isPunch ? 0.15 : 0.28;
        busyTimerA = totalDuration;
        energyA = Math.min(100, energyA + (isPunch ? 8 : 5));

        // Opponent guard decision
        if (!zorroB && Math.random() < 0.58) {
          guardTimerB = 0.22;
        }

        let atkPowerEffective = isHulkA ? atkA * 2.2 : atkA;
        if (scielCritA > 0) {
          atkPowerEffective *= 1.85;
          scielCritA--;
        }
        const finalDmg = (dmgBase * atkPowerEffective) / (isHulkB ? defB * 1.6 : defB);

        if (sparrowDodgeB > 0) {
          sparrowDodgeB--;
        } else if (zorroB && busyTimerB > 0 && Math.random() < 0.4) {
          // Zorro clash counter nullification!
          hpA -= Math.round(85 * atkB / defA);
          busyTimerA = 0.35;
        } else if (guardTimerB > 0) {
          // Blocked: Chip damage
          hpB -= Math.max(1, Math.round(finalDmg * 0.15));
        } else {
          // Clean hit
          hpB -= Math.round(finalDmg);
          energyB = Math.min(100, energyB + 3);
          busyTimerB = isPunch ? 0.28 : 0.18;
        }
      }
    }

    // Decision B
    if (busyTimerB <= 0 && hpB > 0) {
      const rollB = Math.random();

      if (energyB >= 100 && dist < 320) {
        energyB = 0;
        busyTimerB = 0.85;
        if (charB.superType === 'HULK_TRANSFORMATION' && !isHulkB) {
          isHulkB = true;
          hpB = Math.min(hpB_max + 500, hpB + 500);
        } else {
          let hitChance = 0.82;
          if (dist > 220) hitChance = 0.65;
          if (Math.random() < hitChance) {
            let superDmg = 340 * (isHulkB ? 2.2 : atkB) / (isHulkA ? 1.6 : defA);
            if (guardTimerA > 0 && !zorroA) {
              hpA -= Math.round(superDmg * 0.18);
            } else {
              hpA -= Math.round(superDmg);
              busyTimerA = 0.6;
            }
          }
        }
      } else if (energyB >= 33 && dist < 260 && rollB < 0.28) {
        energyB -= 33;
        busyTimerB = 0.38;
        const specName = (charB.name || '').toLowerCase();
        if (specName.includes('sparrow')) sparrowDodgeB = 3;
        if (specName.includes('sciel')) scielCritB = 3;
        if (specName.includes('lune')) hpB = Math.min(hpB_max, hpB + hpB_max * 0.15);

        let specDmg = 115 * atkB / defA;
        if (scielCritB > 0) {
          specDmg *= 1.85;
          scielCritB--;
        }
        if (Math.random() < 0.75) {
          if (sparrowDodgeA > 0) {
            sparrowDodgeA--;
          } else if (guardTimerA > 0 && !zorroA) {
            hpA -= Math.round(specDmg * 0.15);
          } else {
            hpA -= Math.round(specDmg);
            energyA = Math.min(100, energyA + 4);
            busyTimerA = 0.25;
          }
        }
      } else if (dist <= 135 && rollB < 0.42) {
        const isPunch = dist < 90 ? rollB < 0.25 : false;
        const dmgBase = isPunch ? 38 : 58;
        const totalDuration = isPunch ? 0.15 : 0.28;
        busyTimerB = totalDuration;
        energyB = Math.min(100, energyB + (isPunch ? 8 : 5));

        if (!zorroA && Math.random() < 0.58) {
          guardTimerA = 0.22;
        }

        let atkPowerEffective = isHulkB ? atkB * 2.2 : atkB;
        if (scielCritB > 0) {
          atkPowerEffective *= 1.85;
          scielCritB--;
        }
        const finalDmg = (dmgBase * atkPowerEffective) / (isHulkA ? defA * 1.6 : defA);

        if (sparrowDodgeA > 0) {
          sparrowDodgeA--;
        } else if (zorroA && busyTimerA > 0 && Math.random() < 0.4) {
          hpB -= Math.round(85 * atkA / defB);
          busyTimerB = 0.35;
        } else if (guardTimerA > 0) {
          hpA -= Math.max(1, Math.round(finalDmg * 0.15));
        } else {
          hpA -= Math.round(finalDmg);
          energyA = Math.min(100, energyA + 3);
          busyTimerA = isPunch ? 0.28 : 0.18;
        }
      }
    }
  }

  if (hpA <= 0 && hpB <= 0) {
    return hpA > hpB ? 'A' : 'B';
  }
  if (hpA <= 0) return 'B';
  if (hpB <= 0) return 'A';
  // Time out: highest remaining HP %
  return (hpA / hpA_max) >= (hpB / hpB_max) ? 'A' : 'B';
}

export function runFullSimulation(characterList, fightsPerPair = 100) {
  const startTime = Date.now();
  const n = characterList.length;
  const matrix = {}; // [idA][idB] = { winsA, winsB, total }
  const totalStats = {}; // [id] = { id, name, wins, losses, totalFights, winRate }

  characterList.forEach((c) => {
    totalStats[c.id] = {
      id: c.id,
      name: c.name,
      title: c.title || '',
      themeColor: c.themeColor || '#0ea5e9',
      wins: 0,
      losses: 0,
      totalFights: 0,
      winRate: 0,
      matchups: {} // targetId -> { wins, losses, winRate }
    };
    matrix[c.id] = {};
  });

  let totalPairMatches = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const charA = characterList[i];
      const charB = characterList[j];

      let winsA = 0;
      let winsB = 0;

      for (let k = 0; k < fightsPerPair; k++) {
        // In alternate fights, swap left/right initial orientation
        const winner = k % 2 === 0
          ? simulateFight(charA, charB, k)
          : (simulateFight(charB, charA, k) === 'A' ? 'B' : 'A');

        if (winner === 'A') winsA++;
        else winsB++;
      }

      totalPairMatches += fightsPerPair;

      // Register matrix
      matrix[charA.id][charB.id] = { wins: winsA, losses: winsB, winRate: (winsA / fightsPerPair) * 100 };
      matrix[charB.id][charA.id] = { wins: winsB, losses: winsA, winRate: (winsB / fightsPerPair) * 100 };

      // Register stats A
      totalStats[charA.id].wins += winsA;
      totalStats[charA.id].losses += winsB;
      totalStats[charA.id].totalFights += fightsPerPair;
      totalStats[charA.id].matchups[charB.id] = {
        opponentName: charB.name,
        wins: winsA,
        losses: winsB,
        winRate: Number(((winsA / fightsPerPair) * 100).toFixed(1))
      };

      // Register stats B
      totalStats[charB.id].wins += winsB;
      totalStats[charB.id].losses += winsA;
      totalStats[charB.id].totalFights += fightsPerPair;
      totalStats[charB.id].matchups[charA.id] = {
        opponentName: charA.name,
        wins: winsB,
        losses: winsA,
        winRate: Number(((winsB / fightsPerPair) * 100).toFixed(1))
      };
    }
  }

  // Calculate final winRates
  const leaderboard = Object.values(totalStats).map((s) => {
    s.winRate = Number(((s.wins / s.totalFights) * 100).toFixed(1));
    return s;
  });

  leaderboard.sort((a, b) => b.winRate - a.winRate);

  const durationMs = Date.now() - startTime;

  return {
    totalCharacters: n,
    fightsPerPair,
    totalFights: totalPairMatches,
    durationMs,
    leaderboard,
    matrix
  };
}

// If run directly via node
if (process.argv[1]?.includes('runFastSimulation.js') || process.argv[1]?.endsWith('runFastSimulation.js')) {
  console.log('⚡ Iniciando Simulação Ultra Rápida (100 lutas por par)...');
  const results = runFullSimulation(CHARACTERS, 100);
  console.log(`✅ Concluído em ${results.durationMs}ms! Total de ${results.totalFights} lutas.`);
  console.log('\n🏆 TOP 10 RANKING GERAL (% de Vitória):');
  results.leaderboard.slice(0, 10).forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.name.padEnd(22)} | Taxa de Vitória: ${c.winRate}% (${c.wins}V / ${c.losses}D)`);
  });

  fs.writeFileSync('./src/game/simulationResults.json', JSON.stringify(results, null, 2));
  console.log('📁 Dados gravados em src/game/simulationResults.json');
}
