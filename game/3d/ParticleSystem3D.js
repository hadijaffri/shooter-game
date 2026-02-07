import * as THREE from 'three';

class Particle3D {
  constructor(x, y, z, config) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = config.vx || (Math.random() - 0.5) * (config.speed || 4);
    this.vy = config.vy || Math.random() * (config.upSpeed || 3);
    this.vz = config.vz || (Math.random() - 0.5) * (config.speed || 4);
    this.life = config.life || 30;
    this.maxLife = this.life;
    this.size = config.size || 2;
    this.gravity = config.gravity || -0.05;
    this.friction = config.friction || 0.97;
  }

  update() {
    this.vx *= this.friction;
    this.vy += this.gravity;
    this.vz *= this.friction;
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    if (this.y < 0) { this.y = 0; this.vy *= -0.3; }
    this.life--;
    return this.life > 0;
  }
}

export class ParticleSystem3D {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 400;

    // Instanced mesh for particles
    const geo = new THREE.SphereGeometry(1, 4, 3);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
    });

    this.instancedMesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.frustumCulled = false;
    this.instancedMesh.count = 0;
    this.scene.add(this.instancedMesh);

    this.dummy = new THREE.Object3D();
    this.colors = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.colors.push(new THREE.Color(1, 1, 1));
    }
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.maxParticles * 3), 3
    );
  }

  emit(x, y, z, count, config = {}) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const p = new Particle3D(x, y, z, config);
      p.color = config.color ? new THREE.Color(config.color) : new THREE.Color(1, 1, 1);
      this.particles.push(p);
    }
  }

  emitExplosion(x, z, color = '#FF6600', count = 25) {
    this.emit(x, 15, z, count, {
      speed: 6,
      upSpeed: 5,
      color,
      life: 25,
      size: 3,
      gravity: -0.08,
    });
  }

  emitHit(x, z, color = '#FFF', count = 6) {
    this.emit(x, 18, z, count, {
      speed: 2.5,
      upSpeed: 2,
      color,
      life: 15,
      size: 1.5,
    });
  }

  emitDeath(x, z, color) {
    this.emit(x, 20, z, 35, {
      speed: 5,
      upSpeed: 6,
      color,
      life: 40,
      size: 3,
      gravity: -0.1,
    });
  }

  emitDash(x, z, color) {
    this.emit(x, 10, z, 3, {
      speed: 1.5,
      upSpeed: 1,
      color,
      life: 20,
      size: 4,
    });
  }

  update() {
    this.particles = this.particles.filter(p => p.update());

    this.instancedMesh.count = this.particles.length;

    this.particles.forEach((p, i) => {
      const alpha = p.life / p.maxLife;
      const scale = p.size * alpha;

      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      this.instancedMesh.instanceColor.setXYZ(i, p.color.r, p.color.g, p.color.b);
    });

    if (this.particles.length > 0) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  clear() {
    this.particles = [];
    this.instancedMesh.count = 0;
  }

  dispose() {
    this.scene.remove(this.instancedMesh);
    this.instancedMesh.geometry.dispose();
    this.instancedMesh.material.dispose();
  }
}
