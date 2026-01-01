import * as THREE from 'three';
import { type Vector2D, CellType } from '../types';
import { MAZE_LAYOUT, GHOST_SPEED, COLORS } from '../constants';

export class Ghost {
    public mesh: THREE.Mesh;
    public gridPos: Vector2D;
    public color: number;
    private targetPos: Vector2D;
    private moveDirection: Vector2D = { x: 0, z: 0 };
    private isMoving = false;

    constructor(scene: THREE.Scene, spawnPos: Vector2D, color: number = COLORS.GHOST) {
        this.gridPos = { ...spawnPos };
        this.targetPos = { ...spawnPos };
        this.color = color;

        const geometry = new THREE.CapsuleGeometry(0.3, 0.4, 4, 16);
        const material = new THREE.MeshStandardMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(spawnPos.x, 0.5, spawnPos.z);
        scene.add(this.mesh);
    }

    private canMove(x: number, z: number): boolean {
        const width = MAZE_LAYOUT[0].length;
        // Horizontal wrap-around check
        if (z >= 0 && z < MAZE_LAYOUT.length) {
            if (x < 0 || x >= width) return true;
        }

        if (z < 0 || z >= MAZE_LAYOUT.length || x < 0 || x >= width) return false;
        return MAZE_LAYOUT[z][x] !== CellType.WALL;
    }

    public update(delta: number, playerPos: Vector2D) {
        if (!this.isMoving) {
            const dirs = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];

            // Filter valid directions (excluding reverse)
            let validDirs = dirs.filter(d => {
                const nx = this.gridPos.x + d.x;
                const nz = this.gridPos.z + d.z;
                const isReverse = d.x === -this.moveDirection.x && d.z === -this.moveDirection.z;
                return this.canMove(nx, nz) && (!isReverse || (this.moveDirection.x === 0 && this.moveDirection.z === 0));
            });

            // If no valid moves without reversing, allow reversing
            if (validDirs.length === 0) {
                validDirs = dirs.filter(d => {
                    const nx = this.gridPos.x + d.x;
                    const nz = this.gridPos.z + d.z;
                    return this.canMove(nx, nz);
                });
            }

            if (validDirs.length > 0) {
                // Determine target tile based on "personality"
                let targetTile = { ...playerPos };

                if (this.color === 0xffb8ff) { // Pinky: Ambush (4 tiles ahead)
                    // We don't have player direction easily, so let's just use some logic
                    targetTile.x += 4;
                    targetTile.z += 4;
                } else if (this.color === 0xffb852) { // Clyde: Random/Scared
                    const dist = Math.sqrt(Math.pow(this.gridPos.x - playerPos.x, 2) + Math.pow(this.gridPos.z - playerPos.z, 2));
                    if (dist < 8) targetTile = { x: 0, z: 0 }; // Retreat to corner
                }

                // Choose direction that minimizes distance to target tile
                let bestDir = validDirs[0];
                let minDist = Infinity;

                for (const d of validDirs) {
                    const nx = this.gridPos.x + d.x;
                    const nz = this.gridPos.z + d.z;
                    const dist = Math.sqrt(Math.pow(nx - targetTile.x, 2) + Math.pow(nz - targetTile.z, 2));
                    if (dist < minDist) {
                        minDist = dist;
                        bestDir = d;
                    }
                }

                this.moveDirection = bestDir;
                this.targetPos = { x: this.gridPos.x + bestDir.x, z: this.gridPos.z + bestDir.z };
                this.isMoving = true;
            }
        }

        if (this.isMoving) {
            this.mesh.position.x += this.moveDirection.x * GHOST_SPEED * delta;
            this.mesh.position.z += this.moveDirection.z * GHOST_SPEED * delta;

            if (Math.abs(this.targetPos.x - this.mesh.position.x) < GHOST_SPEED * delta &&
                Math.abs(this.targetPos.z - this.mesh.position.z) < GHOST_SPEED * delta) {

                const width = MAZE_LAYOUT[0].length;
                let finalX = this.targetPos.x;

                // Wrap around teleport
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
