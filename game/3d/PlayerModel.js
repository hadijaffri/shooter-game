import * as THREE from 'three';

export class PlayerModel {
  constructor(color, isBot = false) {
    this.group = new THREE.Group();
    this.color = new THREE.Color(color);
    this.isBot = isBot;
    this.gunFlashLight = null;
    this.shieldMesh = null;
    this.dashTrail = [];

    this.build();
  }

  build() {
    // Body - cylinder
    const bodyGeo = new THREE.CylinderGeometry(16, 20, 30, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.4,
      metalness: 0.6,
      emissive: this.color,
      emissiveIntensity: 0.15,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 15;
    this.body.castShadow = true;
    this.group.add(this.body);

    // Head - sphere
    const headGeo = new THREE.SphereGeometry(10, 12, 8);
    const headMat = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.3,
      metalness: 0.5,
      emissive: this.color,
      emissiveIntensity: 0.2,
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 38;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Visor / eyes
    const visorGeo = new THREE.BoxGeometry(14, 4, 3);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    });
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.position.set(0, 40, 9);
    this.group.add(this.visor);

    // Gun arm
    const gunGeo = new THREE.BoxGeometry(4, 4, 30);
    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.8,
    });
    this.gun = new THREE.Mesh(gunGeo, gunMat);
    this.gun.position.set(12, 22, 15);
    this.gun.castShadow = true;
    this.group.add(this.gun);

    // Gun flash light
    this.gunFlashLight = new THREE.PointLight(0xffaa00, 0, 80);
    this.gunFlashLight.position.set(12, 22, 30);
    this.group.add(this.gunFlashLight);

    // Shield (hidden by default)
    const shieldGeo = new THREE.SphereGeometry(30, 16, 12);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0,
      emissive: 0xFFD700,
      emissiveIntensity: 0,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 20;
    this.group.add(this.shieldMesh);

    // Bot indicator ring
    if (this.isBot) {
      const ringGeo = new THREE.RingGeometry(22, 24, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xFF4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 1;
      this.group.add(ring);
    }
  }

  update(playerData, dt) {
    // Position
    this.group.position.set(playerData.x, 0, playerData.y);

    // Rotation - face aim direction
    this.group.rotation.y = -playerData.angle + Math.PI / 2;

    // Bobbing when moving
    const isMoving = Math.abs(playerData.vx) > 0.1 || Math.abs(playerData.vy) > 0.1;
    if (isMoving) {
      this.body.position.y = 15 + Math.sin(Date.now() * 0.01) * 2;
      this.head.position.y = 38 + Math.sin(Date.now() * 0.012) * 1.5;
    }

    // Gun flash decay
    if (this.gunFlashLight.intensity > 0) {
      this.gunFlashLight.intensity *= 0.85;
      if (this.gunFlashLight.intensity < 0.1) this.gunFlashLight.intensity = 0;
    }

    // Shield
    if (playerData.effects?.shield) {
      this.shieldMesh.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
      this.shieldMesh.material.emissiveIntensity = 0.3;
      this.shieldMesh.rotation.y += 0.02;
    } else {
      this.shieldMesh.material.opacity = 0;
      this.shieldMesh.material.emissiveIntensity = 0;
    }

    // Invincibility blink
    if (playerData.isInvincible) {
      this.group.visible = Math.sin(Date.now() * 0.02) > 0;
    } else {
      this.group.visible = true;
    }
  }

  flash() {
    this.gunFlashLight.intensity = 3;
  }

  setVisible(v) {
    this.group.visible = v;
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
