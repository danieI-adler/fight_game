import * as THREE from 'three';
import { FIGHTER_STATE } from '../engine/Fighter';

/**
 * Modelo 3D Procedural PBR de Alta Fidelidade (Estilo Clair Obscur: Expedition 33)
 * Cria malha volumétrica 3D com sobretudos, máscaras de porcelana, armas fiéis,
 * manoplas, botas e luzes dinâmicas Chiaroscuro.
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

    // Criação de Texturas Procedurais Realistas (Pele com sardas, Tecido, Ouro)
    this.proceduralTextures = this.createProceduralTextures(vis);

    // Materiais PBR Aprimorados
    this.materials = {
      skin: new THREE.MeshStandardMaterial({
        color: '#f8d7c1',
        roughness: 0.55,
        metalness: 0.05,
        map: this.proceduralTextures.skinMap || null
      }),
      coat: new THREE.MeshStandardMaterial({
        color: this.coatColor,
        roughness: 0.7,
        metalness: 0.15,
        side: THREE.DoubleSide
      }),
      vest: new THREE.MeshStandardMaterial({
        color: this.vestColor,
        roughness: 0.5,
        metalness: 0.25
      }),
      accent: new THREE.MeshStandardMaterial({
        color: this.accentColor,
        roughness: 0.25,
        metalness: 0.9
      }),
      mask: new THREE.MeshStandardMaterial({
        color: this.maskColor,
        roughness: 0.12,
        metalness: 0.08
      }),
      eyes: new THREE.MeshBasicMaterial({
        color: this.themeColor
      }),
      energyCore: new THREE.MeshBasicMaterial({
        color: this.themeColor
      }),
      pants: new THREE.MeshStandardMaterial({
        color: this.pantColor,
        roughness: 0.75,
        metalness: 0.1
      }),
      boots: new THREE.MeshStandardMaterial({
        color: this.bootColor,
        roughness: 0.35,
        metalness: 0.35
      }),
      gloves: new THREE.MeshStandardMaterial({
        color: this.gloveColor,
        roughness: 0.4,
        metalness: 0.6
      }),
      trail: new THREE.MeshBasicMaterial({
        color: this.themeColor,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      })
    };

    this.buildCharacterMesh(vis);

    // Luz pontual dinâmica própria do lutador (Chiaroscuro)
    this.auraLight = new THREE.PointLight(this.themeColor, 2.0, 14);
    this.auraLight.position.set(0, 1.5, 0.6);
    this.group.add(this.auraLight);
  }

  createProceduralTextures(vis) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return {};

    // Base de pele natural
    ctx.fillStyle = '#edd2bf';
    ctx.fillRect(0, 0, 128, 128);

    // Sardas suaves e sombras
    ctx.fillStyle = 'rgba(180, 120, 90, 0.25)';
    for (let i = 0; i < 40; i++) {
      const rx = 30 + Math.random() * 68;
      const ry = 40 + Math.random() * 48;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const skinTexture = new THREE.CanvasTexture(canvas);
    return { skinMap: skinTexture };
  }

  buildCharacterMesh(vis) {
    // 1. Tronco & Colete
    const isMonoco = vis.isMonoco;
    const torsoScale = isMonoco ? 1.4 : 1.0;
    const torsoGeo = new THREE.CylinderGeometry(0.32 * torsoScale, 0.25 * torsoScale, 0.72, 10);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.materials.vest);
    this.torsoMesh.castShadow = true;
    this.group.add(this.torsoMesh);

    // Botões dourados do colete
    for (let i = 0; i < 3; i++) {
      const btnGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const btnMesh = new THREE.Mesh(btnGeo, this.materials.accent);
      btnMesh.position.set(0.08 * torsoScale, 0.15 - i * 0.12, 0.26 * torsoScale);
      this.torsoMesh.add(btnMesh);
    }

    // Cinturão com Fivela
    const beltGeo = new THREE.CylinderGeometry(0.27 * torsoScale, 0.27 * torsoScale, 0.08, 10);
    const beltMesh = new THREE.Mesh(beltGeo, this.materials.boots);
    beltMesh.position.y = -0.32;
    this.torsoMesh.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
    const buckleMesh = new THREE.Mesh(buckleGeo, this.materials.accent);
    buckleMesh.position.set(0, -0.32, 0.28 * torsoScale);
    this.torsoMesh.add(buckleMesh);

    // 2. Sobretudo / Capa Tridimensional
    this.coatTailsGroup = new THREE.Group();
    const tailGeo = new THREE.PlaneGeometry(0.68 * torsoScale, 0.88, 4, 4);
    this.coatTailMesh = new THREE.Mesh(tailGeo, this.materials.coat);
    this.coatTailMesh.position.set(0, -0.4, -0.2 * torsoScale);
    this.coatTailMesh.rotation.x = 0.15;
    this.coatTailMesh.castShadow = true;
    this.coatTailsGroup.add(this.coatTailMesh);
    this.torsoMesh.add(this.coatTailsGroup);

    // 3. Cabeça & Rosto
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.58, 0);
    this.torsoMesh.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.23, 16, 16);
    headGeo.scale(0.9, 1.1, 1.0);
    this.headMesh = new THREE.Mesh(headGeo, vis.maskStyle && vis.maskStyle !== 'none' ? this.materials.mask : this.materials.skin);
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Olhos com brilho etéreo
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    this.leftEye = new THREE.Mesh(eyeGeo, this.materials.eyes);
    this.leftEye.position.set(-0.07, 0.03, 0.2);
    this.rightEye = new THREE.Mesh(eyeGeo, this.materials.eyes);
    this.rightEye.position.set(0.07, 0.03, 0.2);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // Chapelaria & Auréola 3D
    this.buildHeadgear(vis);

    // 4. Braços e Manoplas
    this.leftArm = this.buildArm(false, vis);
    this.rightArm = this.buildArm(true, vis);
    this.group.add(this.leftArm.root);
    this.group.add(this.rightArm.root);

    // 5. Pernas e Botas
    this.leftLeg = this.buildLeg(false, torsoScale);
    this.rightLeg = this.buildLeg(true, torsoScale);
    this.group.add(this.leftLeg.root);
    this.group.add(this.rightLeg.root);

    // 6. Rastro de Ataque 3D
    const arcGeo = new THREE.TorusGeometry(0.85, 0.07, 8, 32, Math.PI * 0.95);
    this.attackArcMesh = new THREE.Mesh(arcGeo, this.materials.trail);
    this.attackArcMesh.visible = false;
    this.group.add(this.attackArcMesh);
  }

  buildHeadgear(vis) {
    if (vis.maskStyle === 'full_porcelain_halo') {
      // Auréola Solar 3D da Pintora
      const haloGeo = new THREE.TorusGeometry(0.38, 0.03, 8, 24);
      const haloMesh = new THREE.Mesh(haloGeo, this.materials.accent);
      haloMesh.position.set(0, 0.1, -0.05);
      this.headGroup.add(haloMesh);
      return;
    }

    const type = vis.headgear;
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
        const brimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.03, 14);
        const brimMesh = new THREE.Mesh(brimGeo, this.materials.coat);
        brimMesh.position.set(0, 0.18, 0);
        this.headGroup.add(brimMesh);

        const crownGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.22, 14);
        const crownMesh = new THREE.Mesh(crownGeo, this.materials.coat);
        crownMesh.position.set(0, 0.28, 0);
        this.headGroup.add(crownMesh);
        break;
      }

      default: {
        // Cabelo modelado tridimensional
        const hairGeo = new THREE.SphereGeometry(0.24, 12, 12);
        hairGeo.scale(1.0, 0.8, 1.05);
        const hairMat = new THREE.MeshStandardMaterial({
          color: vis.hairColor || '#271810',
          roughness: 0.85
        });
        const hairMesh = new THREE.Mesh(hairGeo, hairMat);
        hairMesh.position.set(0, 0.1, -0.02);
        this.headGroup.add(hairMesh);
        break;
      }
    }
  }

  buildArm(isRight, vis) {
    const root = new THREE.Group();

    // Ombreira metálica
    const pauldronGeo = new THREE.SphereGeometry(0.14, 10, 10);
    const pauldron = new THREE.Mesh(pauldronGeo, this.materials.accent);
    root.add(pauldron);

    // Braço Superior
    const isMechanical = isRight && vis.hasMechanicalArm;
    const upperArmGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.32, 8);
    const upperArm = new THREE.Mesh(upperArmGeo, isMechanical ? this.materials.accent : this.materials.coat);
    upperArm.position.y = -0.16;
    root.add(upperArm);

    // Cotovelo
    const elbowGroup = new THREE.Group();
    elbowGroup.position.y = -0.32;
    root.add(elbowGroup);

    // Antebraço
    const forearmGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.32, 8);
    const forearm = new THREE.Mesh(forearmGeo, isMechanical ? this.materials.accent : this.materials.gloves);
    forearm.position.y = -0.16;
    elbowGroup.add(forearm);

    // Núcleo elétrico de Gustave
    if (isMechanical) {
      const coreGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8);
      const coreMesh = new THREE.Mesh(coreGeo, this.materials.energyCore);
      coreMesh.position.set(0, -0.16, 0.07);
      elbowGroup.add(coreMesh);
    }

    // Punho
    const fistGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const fist = new THREE.Mesh(fistGeo, isMechanical ? this.materials.accent : this.materials.gloves);
    fist.position.y = -0.34;
    elbowGroup.add(fist);

    // Arma acoplada
    if (isRight && vis.weaponType) {
      this.buildWeaponMesh(fist, vis);
    }

    return { root, elbowGroup, fist };
  }

  buildWeaponMesh(parent, vis) {
    switch (vis.weaponType) {
      case 'rapier': {
        // Florete de Maelle
        const bladeGeo = new THREE.CylinderGeometry(0.015, 0.005, 1.2, 6);
        const blade = new THREE.Mesh(bladeGeo, this.materials.accent);
        blade.position.set(0, -0.6, 0);
        parent.add(blade);

        const guardGeo = new THREE.SphereGeometry(0.09, 8, 8);
        const guard = new THREE.Mesh(guardGeo, this.materials.accent);
        guard.position.set(0, -0.05, 0);
        parent.add(guard);
        break;
      }

      case 'gentleman_cane': {
        // Bengala de Renoir
        const caneGeo = new THREE.CylinderGeometry(0.025, 0.02, 1.1, 6);
        const cane = new THREE.Mesh(caneGeo, this.materials.boots);
        cane.position.set(0, -0.55, 0);
        parent.add(cane);

        const pommelGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const pommel = new THREE.Mesh(pommelGeo, this.materials.accent);
        pommel.position.set(0, 0.04, 0);
        parent.add(pommel);
        break;
      }

      case 'gold_saber': {
        // Sabre de Verso
        const bladeGeo = new THREE.BoxGeometry(0.03, 0.9, 0.08);
        const blade = new THREE.Mesh(bladeGeo, this.materials.accent);
        blade.position.set(0, -0.45, 0);
        parent.add(blade);
        break;
      }

      case 'colossal_brush': {
        // Pincel da Pintora
        const shaftGeo = new THREE.CylinderGeometry(0.04, 0.03, 1.6, 8);
        const shaft = new THREE.Mesh(shaftGeo, this.materials.boots);
        shaft.position.set(0, -0.6, 0);
        parent.add(shaft);

        const tipGeo = new THREE.ConeGeometry(0.12, 0.35, 8);
        const tip = new THREE.Mesh(tipGeo, this.materials.accent);
        tip.position.set(0, -1.5, 0);
        tip.rotation.x = Math.PI;
        parent.add(tip);
        break;
      }
    }
  }

  buildLeg(isRight, scaleFactor = 1.0) {
    const root = new THREE.Group();

    // Coxa
    const thighGeo = new THREE.CylinderGeometry(0.13 * scaleFactor, 0.11 * scaleFactor, 0.42, 8);
    const thigh = new THREE.Mesh(thighGeo, this.materials.pants);
    thigh.position.y = -0.21;
    root.add(thigh);

    // Joelho / Canela
    const kneeGroup = new THREE.Group();
    kneeGroup.position.y = -0.42;
    root.add(kneeGroup);

    // Bota
    const shinGeo = new THREE.CylinderGeometry(0.115 * scaleFactor, 0.125 * scaleFactor, 0.42, 8);
    const shin = new THREE.Mesh(shinGeo, this.materials.boots);
    shin.position.y = -0.21;
    kneeGroup.add(shin);

    // Pé
    const footGeo = new THREE.BoxGeometry(0.15 * scaleFactor, 0.1, 0.28);
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
    this.torsoMesh.position.set(0, (-p.chest.y - 40) * scale, 0);
    this.headGroup.position.set(p.head.x * scale * f, (-p.head.y + p.chest.y) * scale, 0);

    // Oscilação do Sobretudo
    const tailSway = -fighter.velocity.x * 0.15 + Math.sin(fighter.stateTime * 6) * 0.12;
    this.coatTailsGroup.rotation.x = 0.15 + Math.max(-0.4, Math.min(0.8, tailSway));

    // Braço Esquerdo (Traseiro)
    this.leftArm.root.position.set(-0.25, (-p.leftShoulder.y - 40) * scale, 0);
    const leftArmAngle = Math.atan2(p.leftElbow.y - p.leftShoulder.y, (p.leftElbow.x - p.leftShoulder.x) * f);
    this.leftArm.root.rotation.z = -leftArmAngle - Math.PI / 2;

    // Braço Direito (Frontal)
    this.rightArm.root.position.set(0.25, (-p.rightShoulder.y - 40) * scale, 0);
    const rightArmAngle = Math.atan2(p.rightElbow.y - p.rightShoulder.y, (p.rightElbow.x - p.rightShoulder.x) * f);
    this.rightArm.root.rotation.z = -rightArmAngle - Math.PI / 2;

    // Perna Esquerda
    this.leftLeg.root.position.set(-0.15, (-p.pelvis.y - 40) * scale, 0);
    const leftLegAngle = Math.atan2(p.leftKnee.y - p.pelvis.y, (p.leftKnee.x - p.pelvis.x) * f);
    this.leftLeg.root.rotation.z = -leftLegAngle - Math.PI / 2;

    // Perna Direita
    this.rightLeg.root.position.set(0.15, (-p.pelvis.y - 40) * scale, 0);
    const rightLegAngle = Math.atan2(p.rightKnee.y - p.pelvis.y, (p.rightKnee.x - p.pelvis.x) * f);
    this.rightLeg.root.rotation.z = -rightLegAngle - Math.PI / 2;

    // Arco de Ataque 3D
    if (fighter.activeHitbox) {
      this.attackArcMesh.visible = true;
      this.attackArcMesh.position.set(0.5, 1.2, 0);
      this.attackArcMesh.rotation.y = f === 1 ? 0 : Math.PI;
    } else {
      this.attackArcMesh.visible = false;
    }

    // Intensidade da Luz Dinâmica
    if (fighter.energy >= 100 || fighter.state === FIGHTER_STATE.SUPER_MOVE) {
      this.auraLight.intensity = 4.0 + Math.sin(fighter.stateTime * 14) * 2.0;
    } else {
      this.auraLight.intensity = 1.6;
    }
  }

  dispose() {
    Object.values(this.materials).forEach((mat) => mat.dispose());
  }
}
