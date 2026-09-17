// Expedition 33
import { gustaveBehavior } from './roster/gustave.js';
import { maelleBehavior } from './roster/maelle.js';
import { luneBehavior } from './roster/lune.js';
import { scielBehavior } from './roster/sciel.js';
import { renoirBehavior } from './roster/renoir.js';
import { versoBehavior } from './roster/verso.js';
import { monocoBehavior } from './roster/monoco.js';
import { paintressBehavior } from './roster/paintress.js';

// Roster Pop & Crossover
import { batmanBehavior } from './roster/batman.js';
import { darthVaderBehavior } from './roster/darthVader.js';
import { palpatineBehavior } from './roster/palpatine.js';
import { jokerBehavior } from './roster/coringa.js';
import { jackSparrowBehavior } from './roster/jackSparrow.js';
import { mcqueenBehavior } from './roster/mcqueen.js';
import { gandalfBehavior } from './roster/gandalf.js';
import { greenArrowBehavior } from './roster/arqueiroVerde.js';
import { bannerBehavior } from './roster/bruceBanner.js';

import {
  zorroBehavior,
  aangBehavior,
  doctorStrangeBehavior,
  walterWhiteBehavior,
  messiBehavior,
  nascimentoBehavior,
  rapunzelBehavior,
  captainAmericaBehavior
} from './roster/heroesBatch1.js';

import {
  sasukeBehavior,
  spongebobBehavior,
  ironmanBehavior,
  spidermanBehavior,
  yoshiBehavior,
  pikachuBehavior,
  sonicBehavior,
  baneBehavior
} from './roster/heroesBatch2.js';

import {
  draculaBehavior,
  kiritoBehavior,
  erenBehavior,
  bruceLeeBehavior,
  yodaBehavior,
  hanSoloBehavior,
  marioBehavior,
  wolverineBehavior,
  kratosBehavior,
  venomBehavior,
  carnageBehavior,
  homelanderBehavior
} from './roster/heroesBatch3.js';

import { narutoBehavior } from './roster/naruto.js';
import { gokuBehavior } from './roster/goku.js';

const rosterRegistry = {
  // Expedition 33 (101-109)
  '101': gustaveBehavior,
  '102': maelleBehavior,
  '103': luneBehavior,
  '104': scielBehavior,
  '105': renoirBehavior,
  '106': versoBehavior,
  '107': monocoBehavior,
  '109': paintressBehavior,

  // Pop & Crossover Expedition 33 IDs (110-148)
  '110': batmanBehavior,
  '111': darthVaderBehavior,
  '112': palpatineBehavior,
  '113': jokerBehavior,
  '114': jackSparrowBehavior,
  '115': mcqueenBehavior,
  '116': gandalfBehavior,
  '117': greenArrowBehavior,
  '118': bannerBehavior,
  '119': zorroBehavior,
  '120': aangBehavior,
  '121': doctorStrangeBehavior,
  '122': walterWhiteBehavior,
  '123': messiBehavior,
  '124': nascimentoBehavior,
  '125': rapunzelBehavior,
  '126': captainAmericaBehavior,
  '127': narutoBehavior,
  '128': sasukeBehavior,
  '129': spongebobBehavior,
  '130': ironmanBehavior,
  '131': spidermanBehavior,
  '132': yoshiBehavior,
  '133': pikachuBehavior,
  '134': sonicBehavior,
  '135': baneBehavior,
  '136': draculaBehavior,
  '137': kiritoBehavior,
  '138': erenBehavior,
  '139': bruceLeeBehavior,
  '140': gokuBehavior,
  '141': yodaBehavior,
  '142': hanSoloBehavior,
  '143': marioBehavior,
  '144': wolverineBehavior,
  '145': kratosBehavior,
  '146': venomBehavior,
  '147': carnageBehavior,
  '148': homelanderBehavior,

  // Standard Character Data IDs (21-59)
  '21': batmanBehavior,
  '22': darthVaderBehavior,
  '23': palpatineBehavior,
  '24': jokerBehavior,
  '25': jackSparrowBehavior,
  '26': mcqueenBehavior,
  '27': gandalfBehavior,
  '28': greenArrowBehavior,
  '29': bannerBehavior,
  '30': zorroBehavior,
  '31': aangBehavior,
  '32': doctorStrangeBehavior,
  '33': walterWhiteBehavior,
  '34': messiBehavior,
  '35': nascimentoBehavior,
  '36': rapunzelBehavior,
  '37': captainAmericaBehavior,
  '38': narutoBehavior,
  '39': sasukeBehavior,
  '40': spongebobBehavior,
  '41': ironmanBehavior,
  '42': spidermanBehavior,
  '43': yoshiBehavior,
  '44': pikachuBehavior,
  '45': sonicBehavior,
  '46': baneBehavior,
  '47': draculaBehavior,
  '48': kiritoBehavior,
  '49': erenBehavior,
  '50': bruceLeeBehavior,
  '51': gokuBehavior,
  '52': yodaBehavior,
  '53': hanSoloBehavior,
  '54': marioBehavior,
  '55': wolverineBehavior,
  '56': kratosBehavior,
  '57': venomBehavior,
  '58': carnageBehavior,
  '59': homelanderBehavior,

  // Expedition 33 Names
  gustave: gustaveBehavior,
  maelle: maelleBehavior,
  lune: luneBehavior,
  sciel: scielBehavior,
  renoir: renoirBehavior,
  verso: versoBehavior,
  monoco: monocoBehavior,
  paintress: paintressBehavior,
  peintresse: paintressBehavior,

  // Pop & Crossover Names (normalizados sem acento)
  batman: batmanBehavior,
  vader: darthVaderBehavior,
  'darth vader': darthVaderBehavior,
  palpatine: palpatineBehavior,
  coringa: jokerBehavior,
  joker: jokerBehavior,
  sparrow: jackSparrowBehavior,
  'jack sparrow': jackSparrowBehavior,
  mcqueen: mcqueenBehavior,
  relampago: mcqueenBehavior,
  gandalf: gandalfBehavior,
  arqueiro: greenArrowBehavior,
  'green arrow': greenArrowBehavior,
  banner: bannerBehavior,
  hulk: bannerBehavior,
  zorro: zorroBehavior,
  aang: aangBehavior,
  estranho: doctorStrangeBehavior,
  strange: doctorStrangeBehavior,
  walter: walterWhiteBehavior,
  heisenberg: walterWhiteBehavior,
  messi: messiBehavior,
  nascimento: nascimentoBehavior,
  rapunzel: rapunzelBehavior,
  america: captainAmericaBehavior,
  'capitao america': captainAmericaBehavior,
  'capitao': captainAmericaBehavior,
  naruto: narutoBehavior,
  sasuke: sasukeBehavior,
  esponja: spongebobBehavior,
  spongebob: spongebobBehavior,
  ferro: ironmanBehavior,
  ironman: ironmanBehavior,
  aranha: spidermanBehavior,
  spiderman: spidermanBehavior,
  yoshi: yoshiBehavior,
  pikachu: pikachuBehavior,
  sonic: sonicBehavior,
  bane: baneBehavior,
  dracula: draculaBehavior,
  kirito: kiritoBehavior,
  eren: erenBehavior,
  'bruce lee': bruceLeeBehavior,
  goku: gokuBehavior,
  yoda: yodaBehavior,
  solo: hanSoloBehavior,
  'han solo': hanSoloBehavior,
  mario: marioBehavior,
  wolverine: wolverineBehavior,
  logan: wolverineBehavior,
  kratos: kratosBehavior,
  venom: venomBehavior,
  carnificina: carnageBehavior,
  carnage: carnageBehavior,
  patria: homelanderBehavior,
  homelander: homelanderBehavior,
};

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getCharacterBehavior(fighter) {
  const id = String(fighter.charData?.id || '').toLowerCase();
  if (rosterRegistry[id]) return rosterRegistry[id];

  const rawName = String(fighter.charData?.name || '').toLowerCase();
  const cleanName = normalizeText(rawName);

  for (const [key, behavior] of Object.entries(rosterRegistry)) {
    const normKey = normalizeText(key);
    if (cleanName.includes(normKey) || rawName.includes(key)) {
      return behavior;
    }
  }

  return null;
}
