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
  // Expedition 33
  '101': gustaveBehavior,
  '102': maelleBehavior,
  '103': luneBehavior,
  '104': scielBehavior,
  '105': renoirBehavior,
  '106': versoBehavior,
  '107': monocoBehavior,
  '109': paintressBehavior,

  gustave: gustaveBehavior,
  maelle: maelleBehavior,
  lune: luneBehavior,
  sciel: scielBehavior,
  renoir: renoirBehavior,
  verso: versoBehavior,
  monoco: monocoBehavior,
  paintress: paintressBehavior,
  peintresse: paintressBehavior,

  // Pop & Crossover
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
  'capitão américa': captainAmericaBehavior,
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

export function getCharacterBehavior(fighter) {
  const id = String(fighter.charData?.id || '').toLowerCase();
  const name = String(fighter.charData?.name || '').toLowerCase();

  if (rosterRegistry[id]) return rosterRegistry[id];

  for (const [key, behavior] of Object.entries(rosterRegistry)) {
    if (name.includes(key)) {
      return behavior;
    }
  }

  return null;
}
