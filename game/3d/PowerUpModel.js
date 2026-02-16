import * as THREE from 'three';
import { POWERUPS } from '../../utils/Constants';

export class PowerUpModel {
  constructor(type, x, z) {
    this.group = new THREE.Group();
    this.type = type;
    this.config = POWERUPS[type];
    this.baseY = 20;
    this.rotationSpeed = 0.03;
    this.bobSpeed = 0.002;
    this.bobAmount = 8;
    this.time = Math.random() * Math.PI * 2;

    this.innerMesh = null;
    this.outerMesh = null;
    this.glowLight = null;
    this.particles = [];

    this.build();
    this.group.position.set(x, this.baseY, z);
  }

  build() {
    const color = new THREE.Color(this.config.color);

    switch (this.type) {
      case 'health':
        this.buildHealth(color);
        break;
      case 'speed':
        this.buildSpeed(color);
        break;
      case 'shield':
        this.buildShield(color);
        break;
      case 'damage':
        this.buildDamage(color);
        break;
      default:
        this.buildDefault(color);
    }

    // Glow light
    this.glowLight = new THREE.PointLight(color, 2.5, 180);
    this.glowLight.position.y = 5;
    this.group.add(this.glowLight);

    // Ground ring
    const ringGeo = new THREE.RingGeometry(18, 22, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -this.baseY + 1;
    this.group.add(ring);
    this.ring = ring;
  }

  buildHealth(color) {
    // Red cross made of two boxes
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.4,
    });

    const h1 = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 6), mat);
    const h2 = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 6), mat);
    this.innerMesh = new THREE.Group();
    this.innerMesh.add(h1, h2);
    this.group.add(this.innerMesh);

    // Outer glow sphere
    const outerMat = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.15,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    this.outerMesh = new THREE.Mesh(new THREE.SphereGeometry(14, 12, 8), outerMat);
    this.group.add(this.outerMesh);
  }

  buildSpeed(color) {
    // Lightning bolt - elongated octahedron
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.6,
    });

    this.innerMesh = new THREE.Mesh(new THREE.OctahedronGeometry(10, 0), mat);
    this.innerMesh.scale.set(0.6, 1.2, 0.6);
    this.group.add(this.innerMesh);

    // Speed rings
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      wireframe: true,
    });
    this.outerMesh = new THREE.Mesh(new THREE.TorusGeometry(12, 1.5, 6, 12), ringMat);
    this.group.add(this.outerMesh);
  }

  buildShield(color) {
    // Shield - icosahedron wireframe
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9,
    });

    this.innerMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(9, 0), mat);
    this.group.add(this.innerMesh);

    const wireMat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.outerMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(14, 1), wireMat);
    this.group.add(this.outerMesh);
  }

  buildDamage(color) {
    // Spiky star - dodecahedron
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.7,
    });

    this.innerMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(9, 0), mat);
    this.group.add(this.innerMesh);

    // Outer aura
    const auraMat = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.2,
      emissive: color,
      emissiveIntensity: 0.4,
    });
    this.outerMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(14, 0), auraMat);
    this.group.add(this.outerMesh);
  }

  buildDefault(color) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
    });
    this.innerMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), mat);
    this.group.add(this.innerMesh);
  }

  update(dt) {
    this.time += this.bobSpeed * dt * 16;

    // Bobbing
    this.group.position.y = this.baseY + Math.sin(this.time) * this.bobAmount;

    // Rotation on all axes for the inner shape
    if (this.innerMesh) {
      this.innerMesh.rotation.y += this.rotationSpeed * dt;
      this.innerMesh.rotation.x += this.rotationSpeed * 0.5 * dt;
      this.innerMesh.rotation.z += this.rotationSpeed * 0.3 * dt;
    }

    // Counter-rotate outer mesh
    if (this.outerMesh) {
      this.outerMesh.rotation.y -= this.rotationSpeed * 0.7 * dt;
      this.outerMesh.rotation.z += this.rotationSpeed * 0.4 * dt;

      // Pulse scale
      const pulse = 1 + Math.sin(this.time * 2) * 0.1;
      this.outerMesh.scale.setScalar(pulse);
    }

    // Glow pulse
    if (this.glowLight) {
      this.glowLight.intensity = 1.5 + Math.sin(this.time * 3) * 0.5;
    }

    // Ring pulse
    if (this.ring) {
      const ringPulse = 1 + Math.sin(this.time * 1.5) * 0.15;
      this.ring.scale.setScalar(ringPulse);
      this.ring.material.opacity = 0.2 + Math.sin(this.time * 2) * 0.1;
    }
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
