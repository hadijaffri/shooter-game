import * as THREE from 'three';

export class WallBuilder {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
  }

  buildWalls(walls) {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a7a,
      roughness: 0.6,
      metalness: 0.4,
      emissive: 0x333355,
      emissiveIntensity: 0.3,
    });

    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x7a7aaa,
      emissive: 0x4ECDC4,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.6,
    });

    const wallHeight = 40;

    walls.forEach(wall => {
      // Main wall body
      const geo = new THREE.BoxGeometry(wall.w, wallHeight, wall.h);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(
        wall.x + wall.w / 2,
        wallHeight / 2,
        wall.y + wall.h / 2
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.meshes.push(mesh);

      // Top edge highlight
      const edgeGeo = new THREE.BoxGeometry(wall.w + 2, 2, wall.h + 2);
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.position.set(
        wall.x + wall.w / 2,
        wallHeight + 1,
        wall.y + wall.h / 2
      );
      this.scene.add(edge);
      this.meshes.push(edge);
    });
  }

  dispose() {
    this.meshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.meshes = [];
  }
}
