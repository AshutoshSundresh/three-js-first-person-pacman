import * as THREE from 'three';
import { type Vector2D, CellType } from '../types';
import { MAZE_LAYOUT, GHOST_SPEED, COLORS } from '../constants';

export const GhostState = {
    CHASE: 0,
    FRIGHTENED: 1,
    EATEN: 2
} as const;

export type GhostState = typeof GhostState[keyof typeof GhostState];

export class Ghost {
    public mesh: THREE.Group;
    public gridPos: Vector2D;
    private spawnPos: Vector2D;
    private baseColor: number;
    private state: GhostState = GhostState.CHASE;
    private targetPos: Vector2D;
    private moveDirection: Vector2D = { x: 0, z: 0 };
    private isMoving = false;
    private floatTime = Math.random() * Math.PI * 2;
    private eyes: THREE.Group;
    private body: THREE.Group;
    private bodyMat: THREE.MeshStandardMaterial;

    constructor(scene: THREE.Scene, spawnPos: Vector2D, color: number = COLORS.GHOST) {
        this.gridPos = { ...spawnPos };
        this.spawnPos = { ...spawnPos };
        this.targetPos = { ...spawnPos };
        this.baseColor = color;

        this.mesh = new THREE.Group();
        this.body = new THREE.Group();

        // Ghost Body: Hemisphere Top + Cylinder Body
        const topGeo = new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 32);

        this.bodyMat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });

        const top = new THREE.Mesh(topGeo, this.bodyMat);
        top.position.y = 0.2;
        this.body.add(top);

        const bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
        bodyMesh.position.y = 0;
        this.body.add(bodyMesh);

        // Add "Fingers" at the bottom
        const fingerGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const numFingers = 6;
        for (let i = 0; i < numFingers; i++) {
            const finger = new THREE.Mesh(fingerGeo, this.bodyMat);
            const angle = (i / numFingers) * Math.PI * 2;
            const r = 0.22;
            finger.position.set(
                Math.cos(angle) * r,
                -0.2,
                Math.sin(angle) * r
            );
            this.body.add(finger);
        }
        this.mesh.add(this.body);

        // Eyes
        this.eyes = new THREE.Group();
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);

        const leftEye = new THREE.Mesh(eyeGeo, whiteMat);
        leftEye.position.set(0.12, 0.2, 0.25);
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(0, 0, 0.07);
        leftEye.add(leftPupil);

        const rightEye = new THREE.Mesh(eyeGeo, whiteMat);
        rightEye.position.set(-0.12, 0.2, 0.25);
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0, 0, 0.07);
        rightEye.add(rightPupil);

        this.eyes.add(leftEye, rightEye);
        this.mesh.add(this.eyes);

        this.mesh.position.set(spawnPos.x, 0.5, spawnPos.z);
        scene.add(this.mesh);
    }

    public setState(newState: GhostState) {
        if (this.state === GhostState.EATEN && newState !== GhostState.CHASE) return;
        this.state = newState;
    }

    public getState(): GhostState { return this.state; }

    private updateVisuals(superTimeRemaining: number) {
        if (this.state === GhostState.FRIGHTENED) {
            this.body.visible = true;
            this.eyes.visible = true; // Eyes visible in frightened mode
            const isFlashing = superTimeRemaining < 2 && Math.floor(Date.now() / 200) % 2 === 0;
            const color = isFlashing ? 0xffffff : 0x0000ff;
            this.bodyMat.color.setHex(color);
            this.bodyMat.emissive.setHex(color);
        } else if (this.state === GhostState.EATEN) {
            this.body.visible = false;
            this.eyes.visible = true; // Only eyes visible when eaten
        } else {
            this.body.visible = true;
            this.eyes.visible = true;
            this.bodyMat.color.setHex(this.baseColor);
            this.bodyMat.emissive.setHex(this.baseColor);
        }
    }

    private canMove(x: number, z: number): boolean {
        const width = MAZE_LAYOUT[0].length;
        if (z >= 0 && z < MAZE_LAYOUT.length) {
            if (x < 0 || x >= width) return true;
        }
        if (z < 0 || z >= MAZE_LAYOUT.length || x < 0 || x >= width) return false;
        return MAZE_LAYOUT[z][x] !== CellType.WALL;
    }

    public update(delta: number, playerPos: Vector2D, superTimeRemaining: number) {
        this.updateVisuals(superTimeRemaining);

        // Floating animation
        this.floatTime += delta * 3;
        this.mesh.position.y = 0.5 + Math.sin(this.floatTime) * 0.1;

        // Eye looking direction
        if (this.moveDirection.x !== 0 || this.moveDirection.z !== 0) {
            const targetRot = Math.atan2(this.moveDirection.x, this.moveDirection.z);
            this.eyes.rotation.y = targetRot;
        }

        if (this.state === GhostState.EATEN && this.gridPos.x === this.spawnPos.x && this.gridPos.z === this.spawnPos.z) {
            this.state = GhostState.CHASE;
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

                if (this.state === GhostState.EATEN) {
                    targetTile = { ...this.spawnPos };
                } else if (this.state === GhostState.FRIGHTENED) {
                    // Choose direction that moves AWAY from player
                    let bestDir = validDirs[0];
                    let maxDist = -Infinity;
                    for (const d of validDirs) {
                        const dist = Math.sqrt(Math.pow(this.gridPos.x + d.x - playerPos.x, 2) + Math.pow(this.gridPos.z + d.z - playerPos.z, 2));
                        if (dist > maxDist) { maxDist = dist; bestDir = d; }
                    }
                    this.moveDirection = bestDir;
                } else { // CHASE state
                    if (this.baseColor === 0xffb8ff) { targetTile.x += 4; targetTile.z += 4; }
                    else if (this.baseColor === 0xffb852) {
                        const dist = Math.sqrt(Math.pow(this.gridPos.x - playerPos.x, 2) + Math.pow(this.gridPos.z - playerPos.z, 2));
                        if (dist < 8) targetTile = { x: 0, z: 0 };
                    }
                }

                if (this.state !== GhostState.FRIGHTENED) { // For CHASE and EATEN, find min distance to targetTile
                    let bestDir = validDirs[0];
                    let minDist = Infinity;
                    for (const d of validDirs) {
                        const dist = Math.sqrt(Math.pow(this.gridPos.x + d.x - targetTile.x, 2) + Math.pow(this.gridPos.z + d.z - targetTile.z, 2));
                        if (dist < minDist) { minDist = dist; bestDir = d; }
                    }
                    this.moveDirection = bestDir;
                }

                this.targetPos = { x: this.gridPos.x + this.moveDirection.x, z: this.gridPos.z + this.moveDirection.z };
                this.isMoving = true;
            }
        }

        if (this.isMoving) {
            let speed = GHOST_SPEED;
            if (this.state === GhostState.FRIGHTENED) speed *= 0.6;
            else if (this.state === GhostState.EATEN) speed *= 2.0;

            const step = speed * delta;
            this.mesh.position.x += this.moveDirection.x * step;
            this.mesh.position.z += this.moveDirection.z * step;

            // Overdrive Warp Animation (Stretching down)
            const width = MAZE_LAYOUT[0].length;
            if (this.targetPos.x < 0 || this.targetPos.x >= width) {
                const distToEdge = Math.abs(this.targetPos.x - this.mesh.position.x);
                // Stretch along X, compress Y and Z
                const stretch = 1 + (1 - distToEdge) * 3;
                const shrink = Math.max(0.1, distToEdge);
                this.mesh.scale.set(stretch, shrink, shrink);
                this.bodyMat.emissiveIntensity = 0.5 + (1 - distToEdge) * 5;
            }

            if (Math.abs(this.targetPos.x - this.mesh.position.x) < step &&
                Math.abs(this.targetPos.z - this.mesh.position.z) < step) {

                let finalX = this.targetPos.x;
                let warped = false;

                if (finalX < 0) {
                    finalX = width - 1;
                    warped = true;
                } else if (finalX >= width) {
                    finalX = 0;
                    warped = true;
                }

                this.mesh.position.x = finalX;
                this.mesh.position.z = this.targetPos.z;
                this.gridPos = { x: finalX, z: this.targetPos.z };
                this.isMoving = false;

                if (warped) {
                    // Set to extremely stretched on other side to snap back
                    this.mesh.scale.set(4, 0.1, 0.1);
                }
            }
        }

        // Overdrive Warp Animation (Snap back / Scale up)
        if (Math.abs(this.mesh.scale.x - 1) > 0.01 || Math.abs(this.mesh.scale.y - 1) > 0.01) {
            const recoverySpeed = delta * 8;
            this.mesh.scale.x += (1 - this.mesh.scale.x) * recoverySpeed;
            this.mesh.scale.y += (1 - this.mesh.scale.y) * recoverySpeed;
            this.mesh.scale.z += (1 - this.mesh.scale.z) * recoverySpeed;

            // Normalize emissive
            if (this.state !== GhostState.FRIGHTENED) {
                this.bodyMat.emissiveIntensity += (0.5 - this.bodyMat.emissiveIntensity) * recoverySpeed;
            }
        } else {
            this.mesh.scale.set(1, 1, 1);
        }
    }
}
