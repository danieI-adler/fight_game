import * as THREE from 'three';
import { FIGHTER_STATE } from '../engine/Fighter';

/**
 * Modelo 3D Procedural PBR de Alta Fidelidade (Estilo Clair Obscur: Expedition 33)
 * Cria a malha volumétrica 3D com sobretudos, máscaras de porcelana, tricornes,
 * manoplas, botas e luzes dinâmicas.
 */
export class Fighter3D {
  constructor(charData, isPlayer2 = false) {
    this.charData = charData;
    this.isPlayer2 = isPlayer2;
    this.group = new THREE.Group();

    const vis = charData.visual || {};
    this.themeColor = new THREE.Color(charData.themeColor || '#0ea5e9');
    this.coatColor = new THREE.Color(vis.coatColor || charData.secondaryColor || '#0f2942');
    this.accentColor = new THREE.Color(vis.accentColor || '#d4af37');
    this.vestColor = new THREE.Color(vis.vestColor || '#1e293b');
    this.pantColor = new THREE.Color(vis.pantColor || '#091522');
    this.bootColor = new THREE.Color(vis.bootColor || '#1c1917');
    this.gloveColor = new THREE.Color(vis.gloveColor || charData.themeColor || '#0284c7');
    this.maskColor = new THREE.Color(vis.maskColor || '#f8fafc');

    // Materiais PBR
    this.materials = {
      coat: new THREE.MeshStandardMaterial({
        color: this.coatColor,
        roughness: 0.65,
        metalness: 0.1,
        side: THREE.DoubleSide
      }),
      vest: new THREE.MeshStandardMaterial({
        color: this.vestColor,
        roughness: 0.5,
        metalness: 0.2
      }),
      accent: new THREE.MeshStandardMaterial({
        color: this.accentColor,
        roughness: 0.3,
        metalness: 0.85
      }),
      mask: new THREE.MeshStandardMaterial({
        color: this.maskColor,
        roughness: 0.15,
        metalness: 0.05
      }),
      eyes: new THREE.MeshBasicMaterial({
        color: this.themeColor
      }),
      pants: new THREE.MeshStandardMaterial({
        color: this.pantColor,
        roughness: 0.7,
        metalness: 0.1
      }),
      boots: new THREE.MeshStandardMaterial({
        color: this.bootColor,
        roughness: 0.4,
        metalness: 0.3
      }),
      gloves: new THREE.MeshStandardMaterial({
        color: this.gloveColor,
        roughness: 0.4,
        metalness: 0.6
      }),
      trail: new THREE.MeshBasicMaterial({
        color: this.themeColor,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
    };

    this.buildCharacterMesh(vis);

    // Luz pontual dinâmica própria do lutador
    this.auraLight = new THREE.PointLight(this.themeColor, 1.8, 12);
    this.auraLight.position.set(0, 1.5, 0.5);
    this.group.add(this.auraLight);
  }

  buildCharacterMesh(vis) {
    // 1. Tronco & Colete
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.25, 0.7, 8);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.materials.vest);
    this.torsoMesh.castShadow = true;
    this.group.add(this.torsoMesh);

    // Botões dourados do colete
    for (let i = 0; i < 3; i++) {
      const btnGeo = new THREE.SphereGeometry(0.035, 6, 6);
      const btnMesh = new THREE.Mesh(btnGeo, this.materials.accent);
      btnMesh.position.set(0.08, 0.15 - i * 0.12, 0.26);
      this.torsoMesh.add(btnMesh);
    }

    // Cinturão com Fivela
    const beltGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.08, 8);
    const beltMesh = new THREE.Mesh(beltGeo, this.materials.boots);
    beltMesh.position.y = -0.32;
    this.torsoMesh.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
    const buckleMesh = new THREE.Mesh(buckleGeo, this.materials.accent);
    buckleMesh.position.set(0, -0.32, 0.28);
    this.torsoMesh.add(buckleMesh);

    // 2. Sobretudo / Capa Tridimensional
    this.coatTailsGroup = new THREE.Group();
    const tailGeo = new THREE.PlaneGeometry(0.65, 0.85, 3, 3);
    this.coatTailMesh = new THREE.Mesh(tailGeo, this.materials.coat);
    this.coatTailMesh.position.set(0, -0.4, -0.2);
    this.coatTailMesh.rotation.x = 0.15;
    this.coatTailMesh.castShadow = true;
    this.coatTailsGroup.add(this.coatTailMesh);
    this.torsoMesh.add(this.coatTailsGroup);

    // 3. Cabeça & Máscara de Porcelana
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.55, 0);
    this.torsoMesh.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.22, 12, 12);
    headGeo.scale(0.9, 1.1, 1.0);
    this.headMesh = new THREE.Mesh(headGeo, this.materials.mask);
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Olhos com brilho etéreo
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    this.leftEye = new THREE.Mesh(eyeGeo, this.materials.eyes);
    this.leftEye.position.set(-0.07, 0.03, 0.19);
    this.rightEye = new THREE.Mesh(eyeGeo, this.materials.eyes);
    this.rightEye.position.set(0.07, 0.03, 0.19);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // Chapelaria 3D
    this.buildHeadgear(vis.headgear);

    // 4. Braços e Manoplas
    this.leftArm = this.buildArm(false);
    this.rightArm = this.buildArm(true);
    this.group.add(this.leftArm.root);
    this.group.add(this.rightArm.root);

    // 5. Pernas e Botas de Cano Alto
    this.leftLeg = this.buildLeg(false);
    this.rightLeg = this.buildLeg(true);
    this.group.add(this.leftLeg.root);
    this.group.add(this.rightLeg.root);

    // 6. Rastro de Ataque / Pincelada 3D
    const arcGeo = new THREE.TorusGeometry(0.8, 0.06, 8, 24, Math.PI * 0.9);
    this.attackArcMesh = new THREE.Mesh(arcGeo, this.materials.trail);
    this.attackArcMesh.visible = false;
    this.group.add(this.attackArcMesh);
  }

  buildHeadgear(type) {
    switch (type) {
      case 'tricorne': {
        const brimGeo = new THREE.ConeGeometry(0.48, 0.18, 3);
        const brimMesh = new THREE.Mesh(brimGeo, this.materials.coat);
        brimMesh.rotation.x = Math.PI;
        brimMesh.position.set(0, 0.22, 0);
        this.headGroup.add(brimMesh);

        const goldTrim = new THREE.TorusGeometry(0.35, 0.025, 6, 3);
        const goldMesh = new THREE.Mesh(goldTrim, this.materials.accent);
        goldMesh.rotation.x = Math.PI / 2;
        goldMesh.position.set(0, 0.22, 0);
        this.headGroup.add(goldMesh);
        break;
      }

      case 'fedora': {
        const brimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.03, 12);
        const brimMesh = new THREE.Mesh(brimGeo, this.materials.coat);
        brimMesh.position.set(0, 0.18, 0);
        this.headGroup.add(brimMesh);

        const crownGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.22, 12);
        const crownMesh = new THREE.Mesh(crownGeo, this.materials.coat);
        crownMesh.position.set(0, 0.28, 0);
        this.headGroup.add(crownMesh);
        break;
      }

      case 'feather_cap': {
        const capGeo = new THREE.CylinderGeometry(0.26, 0.3, 0.18, 12);
        const capMesh = new THREE.Mesh(capGeo, this.materials.coat);
        capMesh.position.set(0, 0.22, 0);
        this.headGroup.add(capMesh);

        const featherGeo = new THREE.ConeGeometry(0.04, 0.5, 5);
        const featherMesh = new THREE.Mesh(featherGeo, this.materials.eyes);
        featherMesh.rotation.z = -0.6;
        featherMesh.position.set(-0.2, 0.35, -0.05);
        this.headGroup.add(featherMesh);
        break;
      }

      case 'gilded_visor': {
        const helmGeo = new THREE.SphereGeometry(0.25, 12, 12);
        const helmMesh = new THREE.Mesh(helmGeo, this.materials.accent);
        helmMesh.position.set(0, 0.05, 0);
        this.headGroup.add(helmMesh);
        break;
      }

      default: {
        // Boina / Capa simples
        const beretGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.12, 12);
        const beretMesh = new THREE.Mesh(beretGeo, this.materials.coat);
        beretMesh.position.set(-0.04, 0.2, 0);
        beretMesh.rotation.z = -0.15;
        this.headGroup.add(beretMesh);
        break;
      }
    }
  }

  buildArm(isRight) {
    const root = new THREE.Group();

    // Ombreira metálica
    const pauldronGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const pauldron = new THREE.Mesh(pauldronGeo, this.materials.accent);
    root.add(pauldron);

    // Braço Superior (Manga)
    const upperArmGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.32, 6);
    const upperArm = new THREE.Mesh(upperArmGeo, this.materials.coat);
    upperArm.position.y = -0.16;
    root.add(upperArm);

    // Cotovelo / Articulação
    const elbowGroup = new THREE.Group();
    elbowGroup.position.y = -0.32;
    root.add(elbowGroup);

    // Antebraço / Manopla de Duelo
    const forearmGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.32, 6);
    const forearm = new THREE.Mesh(forearmGeo, this.materials.gloves);
    forearm.position.y = -0.16;
    elbowGroup.add(forearm);

    // Punho Fechado
    const fistGeo = new THREE.SphereGeometry(0.1, 6, 6);
    const fist = new THREE.Mesh(fistGeo, this.materials.gloves);
    fist.position.y = -0.34;
    elbowGroup.add(fist);

    return { root, elbowGroup, fist };
  }

  buildLeg(isRight) {
    const root = new THREE.Group();

    // Coxa (Calça)
    const thighGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.42, 6);
    const thigh = new THREE.Mesh(thighGeo, this.materials.pants);
    thigh.position.y = -0.21;
    root.add(thigh);

    // Joelho / Canela
    const kneeGroup = new THREE.Group();
    kneeGroup.position.y = -0.42;
    root.add(kneeGroup);

    // Bota de Cano Alto de Couro
    const shinGeo = new THREE.CylinderGeometry(0.115, 0.125, 0.42, 6);
    const shin = new THREE.Mesh(shinGeo, this.materials.boots);
    shin.position.y = -0.21;
    kneeGroup.add(shin);

    // Pé da Bota com Salto
    const footGeo = new THREE.BoxGeometry(0.15, 0.1, 0.28);
    const foot = new THREE.Mesh(footGeo, this.materials.boots);
    foot.position.set(0, -0.44, 0.06);
    kneeGroup.add(foot);

    return { root, kneeGroup };
  }

  // --- SINCRONIZAÇÃO EM TEMPO REAL COM O MOTOR DE FÍSICA ---
  update(fighter, timeScale = 1.0) {
    if (!fighter) return;

    const scale = 0.022;
    const f = fighter.facing;
    const p = fighter.pose;

    // Posição base centralizada (X normalizado, Y invertido para Three.js)
    const posX = (fighter.position.x - 1000) * scale;
    const posY = (fighter.groundY - fighter.position.y) * scale;
    this.group.position.set(posX, posY, 0);

    // Orientação do Lutador (Facing)
    this.group.rotation.y = f === 1 ? Math.PI / 2 : -Math.PI / 2;

    // Tronco e Cabeça
    this.torsoMesh.position.set(0, ( -p.chest.y - 40) * scale, 0);
    this.headGroup.position.set(p.head.x * scale * f, ( -p.head.y + p.chest.y) * scale, 0);

    // Oscilação do Sobretudo baseada na velocidade horizontal
    const tailSway = -fighter.velocity.x * 0.15 + Math.sin(fighter.stateTime * 6) * 0.12;
    this.coatTailsGroup.rotation.x = 0.15 + Math.max(-0.4, Math.min(0.8, tailSway));

    // Braço Esquerdo (Traseiro)
    this.leftArm.root.position.set(-0.25, ( -p.leftShoulder.y - 40) * scale, 0);
    const leftArmAngle = Math.atan2(p.leftElbow.y - p.leftShoulder.y, (p.leftElbow.x - p.leftShoulder.x) * f);
    this.leftArm.root.rotation.z = -leftArmAngle - Math.PI / 2;

    // Braço Direito (Frontal)
    this.rightArm.root.position.set(0.25, ( -p.rightShoulder.y - 40) * scale, 0);
    const rightArmAngle = Math.atan2(p.rightElbow.y - p.rightShoulder.y, (p.rightElbow.x - p.rightShoulder.x) * f);
    this.rightArm.root.rotation.z = -rightArmAngle - Math.PI / 2;

    // Perna Esquerda
    this.leftLeg.root.position.set(-0.15, ( -p.pelvis.y - 40) * scale, 0);
    const leftLegAngle = Math.atan2(p.leftKnee.y - p.pelvis.y, (p.leftKnee.x - p.pelvis.x) * f);
    this.leftLeg.root.rotation.z = -leftLegAngle - Math.PI / 2;

    // Perna Direita
    this.rightLeg.root.position.set(0.15, ( -p.pelvis.y - 40) * scale, 0);
    const rightLegAngle = Math.atan2(p.rightKnee.y - p.pelvis.y, (p.rightKnee.x - p.pelvis.x) * f);
    this.rightLeg.root.rotation.z = -rightLegAngle - Math.PI / 2;

    // Arco de Pincelada 3D nos Ataques
    if (fighter.activeHitbox) {
      this.attackArcMesh.visible = true;
      this.attackArcMesh.position.set(0.5, 1.2, 0);
      this.attackArcMesh.rotation.y = f === 1 ? 0 : Math.PI;
    } else {
      this.attackArcMesh.visible = false;
    }

    // Intensidade da Luz Dinâmica
    if (fighter.energy >= 100 || fighter.state === FIGHTER_STATE.SUPER_MOVE) {
      this.auraLight.intensity = 3.5 + Math.sin(fighter.stateTime * 12) * 1.5;
    } else {
      this.auraLight.intensity = 1.2;
    }
  }

  dispose() {
    Object.values(this.materials).forEach((mat) => mat.dispose());
  }
}
