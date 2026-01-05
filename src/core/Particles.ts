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

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
    }

    public createBurst(position: THREE.Vector3, color: number, count: number = 20, speed: number = 2) {
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const material = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 1
        });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geometry, material.clone());
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
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta / p.maxLife;

            p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
            p.mesh.scale.setScalar(p.life);
            (p.mesh.material as THREE.MeshStandardMaterial).opacity = p.life;

            if (p.life <= 0) {
                this.group.remove(p.mesh);
                p.mesh.geometry.dispose();
                (p.mesh.material as THREE.MeshStandardMaterial).dispose();
                this.particles.splice(i, 1);
            }
        }
    }
}
