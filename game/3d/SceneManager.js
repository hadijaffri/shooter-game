import * as THREE from 'three';
import { GAME, COLORS } from '../../utils/Constants';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.cameraTarget = new THREE.Vector3();
    this.cameraOffset = new THREE.Vector3(0, 350, 220);
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.firstFollow = true;

    this.init();
  }

  init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;
    this.renderer.domElement.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
    this.container.appendChild(this.renderer.domElement);
    console.log('[SceneManager] Three.js canvas added, size:', window.innerWidth, 'x', window.innerHeight);

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 5000);
    this.camera.position.set(100, 350, 100 + 220);
    this.camera.lookAt(100, 0, 100);

    // Scene background
    this.scene.background = new THREE.Color(0x0d0d24);
    this.scene.fog = new THREE.Fog(0x0d0d24, 600, 2000);

    this.setupLighting();
    this.setupGround();

    // Resize
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  setupLighting() {
    // Ambient - bright enough to see everything
    const ambient = new THREE.AmbientLight(0x6688aa, 1.0);
    this.scene.add(ambient);

    // Hemisphere light for natural fill
    const hemiLight = new THREE.HemisphereLight(0x8899bb, 0x223344, 0.8);
    this.scene.add(hemiLight);

    // Main directional light
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    dirLight.position.set(GAME.WIDTH / 2, 500, GAME.HEIGHT / 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -GAME.WIDTH / 2;
    dirLight.shadow.camera.right = GAME.WIDTH / 2;
    dirLight.shadow.camera.top = GAME.HEIGHT / 2;
    dirLight.shadow.camera.bottom = -GAME.HEIGHT / 2;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 1200;
    dirLight.shadow.bias = -0.002;
    this.scene.add(dirLight);

    // Accent lights for neon feel
    const pointLight1 = new THREE.PointLight(0x4ECDC4, 1.5, 800);
    pointLight1.position.set(400, 100, 400);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xFF6B6B, 1.5, 800);
    pointLight2.position.set(GAME.WIDTH - 400, 100, GAME.HEIGHT - 400);
    this.scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x9370DB, 1.0, 600);
    pointLight3.position.set(GAME.WIDTH / 2, 80, GAME.HEIGHT / 2);
    this.scene.add(pointLight3);
  }

  setupGround() {
    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(GAME.WIDTH, GAME.HEIGHT);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x222240,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(GAME.WIDTH / 2, 0, GAME.HEIGHT / 2);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid lines
    const gridHelper = new THREE.GridHelper(GAME.WIDTH, 40, 0x2a3a5e, 0x2a3a5e);
    gridHelper.position.set(GAME.WIDTH / 2, 0.1, GAME.HEIGHT / 2);
    gridHelper.material.opacity = 0.6;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Border glow
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(GAME.WIDTH, 10, GAME.HEIGHT));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x4ECDC4, transparent: true, opacity: 0.4 });
    const border = new THREE.LineSegments(borderGeo, borderMat);
    border.position.set(GAME.WIDTH / 2, 5, GAME.HEIGHT / 2);
    this.scene.add(border);
  }

  followTarget(x, z, dt) {
    this.cameraTarget.set(x, 0, z);
    const desired = new THREE.Vector3(
      x + this.cameraOffset.x,
      this.cameraOffset.y,
      z + this.cameraOffset.z
    );

    // Snap camera instantly on first frame so player is visible immediately
    if (this.firstFollow) {
      this.camera.position.copy(desired);
      this.firstFollow = false;
    } else {
      this.camera.position.lerp(desired, 0.08);
    }

    // Shake
    if (this.shakeIntensity > 0.5) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }

    this.camera.lookAt(this.cameraTarget);
  }

  addShake(intensity) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 25);
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  getScreenPosition(worldX, worldZ) {
    const vec = new THREE.Vector3(worldX, 0, worldZ);
    vec.project(this.camera);
    return {
      x: (vec.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vec.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  getWorldPosition(screenX, screenY) {
    const vec = new THREE.Vector3(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1,
      0.5
    );
    vec.unproject(this.camera);
    const dir = vec.sub(this.camera.position).normalize();
    const t = -this.camera.position.y / dir.y;
    return {
      x: this.camera.position.x + dir.x * t,
      z: this.camera.position.z + dir.z * t,
    };
  }

  getDomElement() {
    return this.renderer.domElement;
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
