import * as THREE from 'three';

export class BulletRenderer3D {
  constructor(scene) {
    this.scene = scene;
    this.bulletMeshes = new Map();
    this.trailMeshes = new Map();

    // Shared geometries
    this.bulletGeo = new THREE.SphereGeometry(1, 6, 4);
    this.trailGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 4);
  }

  addBullet(bullet) {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bullet.color),
      emissive: new THREE.Color(bullet.color),
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.5,
    });

    const mesh = new THREE.Mesh(this.bulletGeo, mat);
    mesh.scale.setScalar(bullet.radius);
    mesh.position.set(bullet.x, 20, bullet.y);
    mesh.castShadow = false;
    this.scene.add(mesh);

    // Point light on bullet
    const light = new THREE.PointLight(new THREE.Color(bullet.color), 1.5, 120);
    light.position.set(bullet.x, 20, bullet.y);
    this.scene.add(light);

    this.bulletMeshes.set(bullet.id, { mesh, light, mat });
  }

  updateBullet(bullet) {
    const data = this.bulletMeshes.get(bullet.id);
    if (!data) {
      this.addBullet(bullet);
      return;
    }

    data.mesh.position.set(bullet.x, 20, bullet.y);
    data.light.position.set(bullet.x, 20, bullet.y);
  }

  removeBullet(bulletId) {
    const data = this.bulletMeshes.get(bulletId);
    if (data) {
      this.scene.remove(data.mesh);
      this.scene.remove(data.light);
      data.mat.dispose();
      this.bulletMeshes.delete(bulletId);
    }
  }

  syncBullets(bullets) {
    const activeIds = new Set(bullets.map(b => b.id));

    // Remove dead bullets
    for (const [id] of this.bulletMeshes) {
      if (!activeIds.has(id)) {
        this.removeBullet(id);
      }
    }

    // Update/add live bullets
    bullets.forEach(b => this.updateBullet(b));
  }

  clear() {
    for (const [id] of this.bulletMeshes) {
      this.removeBullet(id);
    }
  }

  dispose() {
    this.clear();
    this.bulletGeo.dispose();
    this.trailGeo.dispose();
  }
}
