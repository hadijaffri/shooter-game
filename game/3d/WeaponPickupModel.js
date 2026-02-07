import * as THREE from 'three';
import { WEAPONS } from '../../utils/Constants';

export class WeaponPickupModel {
  constructor(weaponType, x, z) {
    this.group = new THREE.Group();
    this.weaponType = weaponType;
    this.config = WEAPONS[weaponType];
    this.baseY = 15;
    this.time = Math.random() * Math.PI * 2;

    this.build();
    this.group.position.set(x, this.baseY, z);
  }

  build() {
    const color = new THREE.Color(this.config.color);

    // Weapon body
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Different shapes for different weapons
    let geo;
    switch (this.weaponType) {
      case 'shotgun':
        geo = new THREE.BoxGeometry(6, 5, 22);
        break;
      case 'smg':
        geo = new THREE.BoxGeometry(5, 6, 18);
        break;
      case 'sniper':
        geo = new THREE.BoxGeometry(3, 4, 28);
        break;
      case 'rocketLauncher':
        geo = new THREE.CylinderGeometry(4, 4, 24, 8);
        break;
      default:
        geo = new THREE.BoxGeometry(5, 5, 16);
    }

    this.weaponMesh = new THREE.Mesh(geo, mat);
    if (this.weaponType === 'rocketLauncher') {
      this.weaponMesh.rotation.x = Math.PI / 2;
    }
    this.group.add(this.weaponMesh);

    // Floating platform
    const platGeo = new THREE.CylinderGeometry(14, 16, 3, 6);
    const platMat = new THREE.MeshStandardMaterial({
      color: 0x333355,
      emissive: color,
      emissiveIntensity: 0.15,
      roughness: 0.5,
      metalness: 0.5,
    });
    this.platform = new THREE.Mesh(platGeo, platMat);
    this.platform.position.y = -10;
    this.group.add(this.platform);

    // Glow
    const light = new THREE.PointLight(color, 1.0, 80);
    light.position.y = 5;
    this.group.add(light);
    this.light = light;
  }

  update(dt) {
    this.time += 0.002 * dt * 16;

    // Bob
    this.group.position.y = this.baseY + Math.sin(this.time) * 5;

    // Rotate weapon
    if (this.weaponMesh) {
      this.weaponMesh.rotation.y += 0.025 * dt;
    }

    // Platform counter-rotate
    if (this.platform) {
      this.platform.rotation.y -= 0.01 * dt;
    }

    // Pulse light
    if (this.light) {
      this.light.intensity = 1.0 + Math.sin(this.time * 3) * 0.3;
    }
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
