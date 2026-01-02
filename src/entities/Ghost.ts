import * as THREE from 'three';
import { type Vector2D, CellType } from '../types';
import { MAZE_LAYOUT, GHOST_SPEED, COLORS } from '../constants';

export class Ghost {
    public mesh: THREE.Group; // Changed to Group
    public gridPos: Vector2D;
    public color: number;
    private targetPos: Vector2D;
    private moveDirection: Vector2D = { x: 0, z: 0 };
    private isMoving = false;
    private floatTime = Math.random() * Math.PI * 2;
    private eyes: THREE.Group;

    constructor(scene: THREE.Scene, spawnPos: Vector2D, color: number = COLORS.GHOST) {
        this.gridPos = { ...spawnPos };
        this.targetPos = { ...spawnPos };
        this.color = color;

        this.mesh = new THREE.Group();

        // Ghost Body (Capsule)
        const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.4, 4, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        this.mesh.add(body);

        // Eyes
        this.eyes = new THREE.Group();
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);

        // Left Eye
        const leftEye = new THREE.Mesh(eyeGeo, whiteMat);
        leftEye.position.set(0.12, 0.2, 0.2);
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(0, 0, 0.05);
        leftEye.add(leftPupil);

        // Right Eye
        const rightEye = new THREE.Mesh(eyeGeo, whiteMat);
        rightEye.position.set(-0.12, 0.2, 0.2);
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0, 0, 0.05);
        rightEye.add(rightPupil);

        this.eyes.add(leftEye, rightEye);
        this.mesh.add(this.eyes);

        this.mesh.position.set(spawnPos.x, 0.5, spawnPos.z);
        scene.add(this.mesh);
    }

    private canMove(x: number, z: number): boolean {
        const width = MAZE_LAYOUT[0].length;
        if (z >= 0 && z < MAZE_LAYOUT.length) {
            if (x < 0 || x >= width) return true;
        }
        if (z < 0 || z >= MAZE_LAYOUT.length || x < 0 || x >= width) return false;
        return MAZE_LAYOUT[z][x] !== CellType.WALL;
    }

    public update(delta: number, playerPos: Vector2D) {
        // Floating animation
        this.floatTime += delta * 3;
        this.mesh.position.y = 0.5 + Math.sin(this.floatTime) * 0.1;

        // Eye looking direction
        if (this.moveDirection.x !== 0 || this.moveDirection.z !== 0) {
            const targetRot = Math.atan2(this.moveDirection.x, this.moveDirection.z);
            this.eyes.rotation.y = targetRot;
        }

        if (!this.isMoving) {
            const dirs = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
            let validDirs = dirs.filter(d => {
                const nx = this.gridPos.x + d.x;
                const nz = this.gridPos.z + d.z;
                const isReverse = d.x === -this.moveDirection.x && d.z === -this.moveDirection.z;
                return this.canMove(nx, nz) && (!isReverse || (this.moveDirection.x === 0 && this.moveDirection.z === 0));
            });

            if (validDirs.length === 0) {
                validDirs = dirs.filter(d => this.canMove(this.gridPos.x + d.x, this.gridPos.z + d.z));
            }

            if (validDirs.length > 0) {
                let targetTile = { ...playerPos };
                if (this.color === 0xffb8ff) { targetTile.x += 4; targetTile.z += 4; }
                else if (this.color === 0xffb852) {
                    const dist = Math.sqrt(Math.pow(this.gridPos.x - playerPos.x, 2) + Math.pow(this.gridPos.z - playerPos.z, 2));
                    if (dist < 8) targetTile = { x: 0, z: 0 };
                }

                let bestDir = validDirs[0];
                let minDist = Infinity;
                for (const d of validDirs) {
                    const dist = Math.sqrt(Math.pow(this.gridPos.x + d.x - targetTile.x, 2) + Math.pow(this.gridPos.z + d.z - targetTile.z, 2));
                    if (dist < minDist) { minDist = dist; bestDir = d; }
                }
                this.moveDirection = bestDir;
                this.targetPos = { x: this.gridPos.x + bestDir.x, z: this.gridPos.z + bestDir.z };
                this.isMoving = true;
            }
        }

        if (this.isMoving) {
            const step = GHOST_SPEED * delta;
            this.mesh.position.x += this.moveDirection.x * step;
            this.mesh.position.z += this.moveDirection.z * step;

            if (Math.abs(this.targetPos.x - this.mesh.position.x) < step &&
                Math.abs(this.targetPos.z - this.mesh.position.z) < step) {
                const width = MAZE_LAYOUT[0].length;
                let finalX = this.targetPos.x;
                if (finalX < 0) finalX = width - 1;
                else if (finalX >= width) finalX = 0;

                this.mesh.position.x = finalX;
                this.mesh.position.z = this.targetPos.z;
                this.gridPos = { x: finalX, z: this.targetPos.z };
                this.isMoving = false;
            }
        }
    }
}
