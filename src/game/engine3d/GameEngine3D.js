import * as THREE from 'three';
import { Fighter3D } from './Fighter3D';

/**
 * Motor Gráfico 3D WebGL (Three.js)
 * Suporta Modo 2.5D (Personagens 3D + Cenário 2D) e Modo Tudo 3D (Arena Completa Next-Gen).
 */
export class GameEngine3D {
  constructor(container, isFull3D = false) {
    this.container = container;
    this.isFull3D = isFull3D;

    this.width = container.clientWidth || 1280;
    this.height = container.clientHeight || 720;

    // Cena
    this.scene = new THREE.Scene();
    if (this.isFull3D) {
      this.scene.background = new THREE.Color('#05070d');
      this.scene.fog = new THREE.FogExp2('#05070d', 0.025);
    }

    // Câmera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 2.8, 14);

    // Renderer WebGL
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: !this.isFull3D, // Transparente no modo 2.5D
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.domElement = this.renderer.domElement;
    this.domElement.style.position = 'absolute';
    this.domElement.style.top = '0';
    this.domElement.style.left = '0';
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
    this.domElement.style.pointerEvents = 'none';

    // Iluminação
    this.setupLighting();

    // Cenário 3D se for Full 3D
    if (this.isFull3D) {
      this.setup3DArena();
    }

    this.fighter1Mesh = null;
    this.fighter2Mesh = null;

    // Resize listener
    this.handleResize = () => {
      if (!this.container) return;
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    };
    window.addEventListener('resize', this.handleResize);
  }

  setupLighting() {
    // Luz Ambiente Belle Époque
    const ambientLight = new THREE.AmbientLight(this.isFull3D ? '#1e293b' : '#ffffff', this.isFull3D ? 0.9 : 1.4);
    this.scene.add(ambientLight);

    // Luz Direcional Principal (Key Light)
    const dirLight = new THREE.DirectionalLight('#fff7ed', 2.0);
    dirLight.position.set(5, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -5;
    dirLight.shadow.bias = -0.001;
    this.scene.add(dirLight);

    // Luz de Preenchimento Azulada (Fill Light)
    const fillLight = new THREE.DirectionalLight('#38bdf8', 0.8);
    fillLight.position.set(-8, 6, 5);
    this.scene.add(fillLight);

    // Rim Light Traseira para Destaque de Silhueta
    const rimLight = new THREE.DirectionalLight('#c084fc', 1.2);
    rimLight.position.set(0, 8, -8);
    this.scene.add(rimLight);
  }

  setup3DArena() {
    // Piso de Mármore Negro Reflexivo
    const floorGeo = new THREE.PlaneGeometry(60, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#0a0d14',
      roughness: 0.25,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Linhas de Demarcação Rúnica na Arena
    const gridGeo = new THREE.RingGeometry(4, 4.08, 64);
    const gridMat = new THREE.MeshBasicMaterial({ color: '#38bdf8', side: THREE.DoubleSide });
    const ring = new THREE.Mesh(gridGeo, gridMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.01, 0);
    this.scene.add(ring);

    // Pilares Belle Époque no Fundo
    for (let i = -4; i <= 4; i++) {
      const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 12, 12);
      const pillarMat = new THREE.MeshStandardMaterial({ color: '#161d2f', roughness: 0.6 });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(i * 5.5, 6, -10);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      // Lamparinas Rúnicas nos Pilares
      const lampLight = new THREE.PointLight('#38bdf8', 0.8, 8);
      lampLight.position.set(i * 5.5, 5, -9.2);
      this.scene.add(lampLight);
    }
  }

  setFighters(char1, char2) {
    if (this.fighter1Mesh) {
      this.scene.remove(this.fighter1Mesh.group);
      this.fighter1Mesh.dispose();
    }
    if (this.fighter2Mesh) {
      this.scene.remove(this.fighter2Mesh.group);
      this.fighter2Mesh.dispose();
    }

    this.fighter1Mesh = new Fighter3D(char1, false);
    this.fighter2Mesh = new Fighter3D(char2, true);

    this.scene.add(this.fighter1Mesh.group);
    this.scene.add(this.fighter2Mesh.group);
  }

  update(p1, p2, dt = 1 / 60) {
    if (this.fighter1Mesh && p1) {
      this.fighter1Mesh.update(p1);
    }
    if (this.fighter2Mesh && p2) {
      this.fighter2Mesh.update(p2);
    }

    // Câmera Dinâmica de Combate (Foco no centro dos 2 lutadores)
    if (p1 && p2) {
      const midX = ((p1.position.x + p2.position.x) / 2 - 1000) * 0.022;
      const dist = Math.abs(p1.position.x - p2.position.x) * 0.022;
      const targetCamZ = Math.max(9, Math.min(16, 7 + dist * 0.6));

      this.camera.position.x += (midX - this.camera.position.x) * 0.08;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;
      this.camera.position.y = 2.4;
      this.camera.lookAt(this.camera.position.x, 1.6, 0);
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.fighter1Mesh) this.fighter1Mesh.dispose();
    if (this.fighter2Mesh) this.fighter2Mesh.dispose();
    this.renderer.dispose();
    if (this.domElement && this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }
  }
}
