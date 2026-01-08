import * as THREE from 'three';

interface Particle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private group: THREE.Group;
    private scene: THREE.Scene;
    // Object pooling for better performance
    private geometryPool: THREE.BoxGeometry;
    private materialPool: Map<number, THREE.MeshStandardMaterial> = new Map();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        // Create shared geometry (will be reused)
        this.geometryPool = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    }

    private getMaterial(color: number): THREE.MeshStandardMaterial {
        if (!this.materialPool.has(color)) {
            this.materialPool.set(color, new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 2,
                transparent: true,
                opacity: 1
            }));
        }
        return this.materialPool.get(color)!;
    }

    public createBurst(position: THREE.Vector3, color: number, count: number = 20, speed: number = 2) {
        // Limit particle count for performance
        const maxParticles = 30;
        const actualCount = Math.min(count, maxParticles);
        const sharedMaterial = this.getMaterial(color);

        for (let i = 0; i < actualCount; i++) {
            // Reuse geometry, create new mesh with shared material
            const mesh = new THREE.Mesh(this.geometryPool, sharedMaterial);
            mesh.position.copy(position);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed
            );

            this.particles.push({
                mesh,
                velocity,
                life: 1.0,
                maxLife: 1.0 + Math.random() * 0.5
            });

            this.group.add(mesh);
        }
    }

    public update(delta: number) {
        // Optimized loop - iterate backwards for safe removal
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta / p.maxLife;

            // Use multiplyScalar on velocity clone to avoid modifying original
            const deltaVelocity = p.velocity.clone().multiplyScalar(delta);
            p.mesh.position.add(deltaVelocity);
            p.mesh.scale.setScalar(p.life);
            (p.mesh.material as THREE.MeshStandardMaterial).opacity = p.life;

            if (p.life <= 0) {
                this.group.remove(p.mesh);
                // Don't dispose geometry/material as they're shared/pooled
                this.particles.splice(i, 1);
            }
        }
    }
}
