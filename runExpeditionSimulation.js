/**
 * Fast Combat Simulator for Clair Obscur: Expedition 33 Mode
 * Runs 100 fights between every pair of characters in the Expedition 33 roster.
 * Excludes generic 'Personagem 1, 2, 3...' and tests only the official Clair Obscur cast!
 */

import { EXPEDITION_33_CHARACTERS } from './src/game/characters/expedition33Characters.js';
import fs from 'fs';

function simulateExpeditionFight(charA, charB, seed = 0) {
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

  let posA = 650;
  let posB = 1350;

  let busyTimerA = 0;
  let busyTimerB = 0;
  let guardTimerA = 0;
  let guardTimerB = 0;

  // Specific Perks & Mechanics
  let isHulkA = false;
  let isHulkB = false;

  let sparrowDodgeA = 0;
  let sparrowDodgeB = 0;

  let scielCritA = 0;
  let scielCritB = 0;

  let versoRankA = 0; // 0: E(0.75x), 1: D(1.0x), 2: C(1.25x), 3: B(1.5x), 4: A(1.75x), 5: S(2.0x)
  let versoRankB = 0;
  const versoMultipliers = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const isVersoA = (charA.name || '').toLowerCase().includes('verso');
  const isVersoB = (charB.name || '').toLowerCase().includes('verso');

  const isZorroA = charA.cannotBlock || (charA.name || '').toLowerCase().includes('zorro');
  const isZorroB = charB.cannotBlock || (charB.name || '').toLowerCase().includes('zorro');

  const dt = 1 / 60;
  const maxTicks = 60 * 90; // 90 seconds max
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
        const moveStep = spdA * 45 * dt;
        if (posA < posB) posA = Math.min(posB - 60, posA + moveStep);
        else posA = Math.max(posB + 60, posA - moveStep);
      } else if (dist < 65) {
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

    // --- DECISION A ---
    if (busyTimerA <= 0) {
      const rollA = Math.random();
      const effAtkA = (isHulkA ? 2.2 : atkA) * (isVersoA ? versoMultipliers[versoRankA] : 1.0);
      const effDefB = isHulkB ? defB * 1.6 : defB;

      // 1. Super Move
      if (energyA >= 100 && dist < 320) {
        energyA = 0;
        busyTimerA = 0.85;

        const sType = charA.superType || '';
        if (sType === 'HULK_TRANSFORMATION' && !isHulkA) {
          isHulkA = true;
          hpA = Math.min(hpA_max + 500, hpA + 500);
        } else {
          let hitChance = 0.82;
          if (dist > 220) hitChance = 0.65;

          // Character specific super damage
          let baseSuperDmg = 340;
          if (sType === 'MAELLE_WALTZ') baseSuperDmg = 360; // 6 strikes combo
          if (sType === 'RENOIR_FLOWER') baseSuperDmg = 380;
          if (sType === 'SCIEL_DARK_WAVE') baseSuperDmg = 370;
          if (sType === 'VADER_CHOKE') baseSuperDmg = 380;

          if (Math.random() < hitChance) {
            let superDmg = baseSuperDmg * effAtkA / effDefB;
            if (guardTimerB > 0 && !isZorroB) {
              hpB -= Math.round(superDmg * 0.18);
            } else {
              hpB -= Math.round(superDmg);
              busyTimerB = 0.6;
              if (isVersoA && versoRankA < 5) versoRankA++;
            }
          }
        }
      }
      // 2. Special Attack (Q)
      else if (energyA >= 33 && dist < 260 && rollA < 0.32) {
        energyA -= 33;
        busyTimerA = 0.38;

        const charName = (charA.name || '').toLowerCase();
        if (charName.includes('sparrow')) sparrowDodgeA = 2; // drunken dodge 2 charges
        if (charName.includes('sciel')) scielCritA = 3; // 3 critical charges
        if (charName.includes('lune')) hpA = Math.min(hpA_max, hpA + hpA_max * 0.15); // heal 15%

        let specDmg = 120 * effAtkA / effDefB;
        if (charName.includes('gustave')) specDmg = 135 * effAtkA / effDefB; // gun bullet
        if (charName.includes('maelle')) specDmg = 130 * effAtkA / effDefB; // blink dash
        if (charName.includes('renoir')) specDmg = 145 * effAtkA / effDefB; // black hole

        if (scielCritA > 0) {
          specDmg *= 1.85;
          scielCritA--;
        }

        if (Math.random() < 0.76) {
          if (sparrowDodgeB > 0) {
            sparrowDodgeB--;
          } else if (guardTimerB > 0 && !isZorroB) {
            hpB -= Math.round(specDmg * 0.15);
          } else {
            hpB -= Math.round(specDmg);
            energyB = Math.min(100, energyB + 4);
            busyTimerB = 0.25;
            if (isVersoA && versoRankA < 5) versoRankA++;
            if (isVersoB) versoRankB = 0; // hit resets opponent Verso rank
          }
        }
      }
      // 3. Normal Attacks (Punch / Kick)
      else if (dist <= 135 && rollA < 0.44) {
        const isPunch = dist < 90 ? rollA < 0.26 : false;
        const dmgBase = isPunch ? 38 : 58;
        busyTimerA = isPunch ? 0.15 : 0.28;
        energyA = Math.min(100, energyA + (isPunch ? 8 : 5));

        if (!isZorroB && Math.random() < 0.58) {
          guardTimerB = 0.22;
        }

        let finalDmg = (dmgBase * effAtkA) / effDefB;
        if (scielCritA > 0) {
          finalDmg *= 1.85;
          scielCritA--;
        }

        if (sparrowDodgeB > 0) {
          sparrowDodgeB--;
        } else if (isZorroB && busyTimerB > 0 && Math.random() < 0.35) {
          hpA -= Math.round(85 * atkB / defA);
          busyTimerA = 0.35;
        } else if (guardTimerB > 0) {
          hpB -= Math.max(1, Math.round(finalDmg * 0.15));
        } else {
          hpB -= Math.round(finalDmg);
          energyB = Math.min(100, energyB + 3);
          busyTimerB = isPunch ? 0.28 : 0.18;
          if (isVersoA && versoRankA < 5) versoRankA++;
          if (isVersoB) versoRankB = 0;
        }
      }
    }

    // --- DECISION B ---
    if (busyTimerB <= 0 && hpB > 0) {
      const rollB = Math.random();
      const effAtkB = (isHulkB ? 2.2 : atkB) * (isVersoB ? versoMultipliers[versoRankB] : 1.0);
      const effDefA = isHulkA ? defA * 1.6 : defA;

      if (energyB >= 100 && dist < 320) {
        energyB = 0;
        busyTimerB = 0.85;

        const sType = charB.superType || '';
        if (sType === 'HULK_TRANSFORMATION' && !isHulkB) {
          isHulkB = true;
          hpB = Math.min(hpB_max + 500, hpB + 500);
        } else {
          let hitChance = 0.82;
          if (dist > 220) hitChance = 0.65;

          let baseSuperDmg = 340;
          if (sType === 'MAELLE_WALTZ') baseSuperDmg = 360;
          if (sType === 'RENOIR_FLOWER') baseSuperDmg = 380;
          if (sType === 'SCIEL_DARK_WAVE') baseSuperDmg = 370;
          if (sType === 'VADER_CHOKE') baseSuperDmg = 380;

          if (Math.random() < hitChance) {
            let superDmg = baseSuperDmg * effAtkB / effDefA;
            if (guardTimerA > 0 && !isZorroA) {
              hpA -= Math.round(superDmg * 0.18);
            } else {
              hpA -= Math.round(superDmg);
              busyTimerA = 0.6;
              if (isVersoB && versoRankB < 5) versoRankB++;
            }
          }
        }
      } else if (energyB >= 33 && dist < 260 && rollB < 0.32) {
        energyB -= 33;
        busyTimerB = 0.38;

        const charName = (charB.name || '').toLowerCase();
        if (charName.includes('sparrow')) sparrowDodgeB = 2;
        if (charName.includes('sciel')) scielCritB = 3;
        if (charName.includes('lune')) hpB = Math.min(hpB_max, hpB + hpB_max * 0.15);

        let specDmg = 120 * effAtkB / effDefA;
        if (charName.includes('gustave')) specDmg = 135 * effAtkB / effDefA;
        if (charName.includes('maelle')) specDmg = 130 * effAtkB / effDefA;
        if (charName.includes('renoir')) specDmg = 145 * effAtkB / effDefA;

        if (scielCritB > 0) {
          specDmg *= 1.85;
          scielCritB--;
        }

        if (Math.random() < 0.76) {
          if (sparrowDodgeA > 0) {
            sparrowDodgeA--;
          } else if (guardTimerA > 0 && !isZorroA) {
            hpA -= Math.round(specDmg * 0.15);
          } else {
            hpA -= Math.round(specDmg);
            energyA = Math.min(100, energyA + 4);
            busyTimerA = 0.25;
            if (isVersoB && versoRankB < 5) versoRankB++;
            if (isVersoA) versoRankA = 0;
          }
        }
      } else if (dist <= 135 && rollB < 0.44) {
        const isPunch = dist < 90 ? rollB < 0.26 : false;
        const dmgBase = isPunch ? 38 : 58;
        busyTimerB = isPunch ? 0.15 : 0.28;
        energyB = Math.min(100, energyB + (isPunch ? 8 : 5));

        if (!isZorroA && Math.random() < 0.58) {
          guardTimerA = 0.22;
        }

        let finalDmg = (dmgBase * effAtkB) / effDefA;
        if (scielCritB > 0) {
          finalDmg *= 1.85;
          scielCritB--;
        }

        if (sparrowDodgeA > 0) {
          sparrowDodgeA--;
        } else if (isZorroA && busyTimerA > 0 && Math.random() < 0.35) {
          hpB -= Math.round(85 * atkA / defB);
          busyTimerB = 0.35;
        } else if (guardTimerA > 0) {
          hpA -= Math.max(1, Math.round(finalDmg * 0.15));
        } else {
          hpA -= Math.round(finalDmg);
          energyA = Math.min(100, energyA + 3);
          busyTimerA = isPunch ? 0.28 : 0.18;
          if (isVersoB && versoRankB < 5) versoRankB++;
          if (isVersoA) versoRankA = 0;
        }
      }
    }
  }

  if (hpA <= 0 && hpB <= 0) return hpA > hpB ? 'A' : 'B';
  if (hpA <= 0) return 'B';
  if (hpB <= 0) return 'A';
  return (hpA / hpA_max) >= (hpB / hpB_max) ? 'A' : 'B';
}

export function runExpeditionSimulation(fightsPerPair = 100) {
  const startTime = Date.now();
  const characterList = EXPEDITION_33_CHARACTERS;
  const n = characterList.length;

  const matrix = {};
  const totalStats = {};

  characterList.forEach((c) => {
    totalStats[c.id] = {
      id: c.id,
      name: c.name,
      title: c.description ? c.description.slice(0, 60) + '...' : '',
      themeColor: c.themeColor || '#0ea5e9',
      wins: 0,
      losses: 0,
      totalFights: 0,
      winRate: 0,
      matchups: {}
    };
    matrix[c.id] = {};
  });

  let totalMatches = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const charA = characterList[i];
      const charB = characterList[j];

      let winsA = 0;
      let winsB = 0;

      for (let k = 0; k < fightsPerPair; k++) {
        const winner = k % 2 === 0
          ? simulateExpeditionFight(charA, charB, k)
          : (simulateExpeditionFight(charB, charA, k) === 'A' ? 'B' : 'A');

        if (winner === 'A') winsA++;
        else winsB++;
      }

      totalMatches += fightsPerPair;

      matrix[charA.id][charB.id] = { wins: winsA, losses: winsB, winRate: (winsA / fightsPerPair) * 100 };
      matrix[charB.id][charA.id] = { wins: winsB, losses: winsA, winRate: (winsB / fightsPerPair) * 100 };

      totalStats[charA.id].wins += winsA;
      totalStats[charA.id].losses += winsB;
      totalStats[charA.id].totalFights += fightsPerPair;
      totalStats[charA.id].matchups[charB.id] = {
        opponentName: charB.name,
        wins: winsA,
        losses: winsB,
        winRate: Number(((winsA / fightsPerPair) * 100).toFixed(1))
      };

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

  const leaderboard = Object.values(totalStats).map((s) => {
    s.winRate = Number(((s.wins / s.totalFights) * 100).toFixed(1));
    return s;
  });

  leaderboard.sort((a, b) => b.winRate - a.winRate);
  const durationMs = Date.now() - startTime;

  return {
    totalCharacters: n,
    fightsPerPair,
    totalFights: totalMatches,
    durationMs,
    leaderboard,
    matrix
  };
}

console.log('⚡ Executando Simulação Oficial: CLAIR OBSCUR EXPEDITION 33 (100 lutas / par)...');
const res = runExpeditionSimulation(100);
console.log(`✅ Concluído em ${res.durationMs}ms! Total de ${res.totalFights} lutas.`);
console.log('\n🏆 RANKING GERAL CLAIR OBSCUR: EXPEDITION 33:');
res.leaderboard.forEach((c, idx) => {
  console.log(`${String(idx + 1).padStart(2)}. ${c.name.padEnd(20)} | ${c.winRate}% (${c.wins}V / ${c.losses}D)`);
});

fs.writeFileSync('./src/game/expeditionSimulationResults.json', JSON.stringify(res, null, 2));
console.log('📁 Gravado com sucesso em src/game/expeditionSimulationResults.json');
