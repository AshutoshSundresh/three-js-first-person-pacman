import * as THREE from 'three';
import { type Vector2D, CellType } from '../types';
import { MAZE_LAYOUT, GHOST_SPEED, COLORS } from '../constants';

export class Ghost {
    public mesh: THREE.Mesh;
    public gridPos: Vector2D;
    private targetPos: Vector2D;
    private moveDirection: Vector2D = { x: 0, z: 0 };
    private isMoving = false;

    constructor(scene: THREE.Scene, spawnPos: Vector2D, color: number = COLORS.GHOST) {
        this.gridPos = { ...spawnPos };
        this.targetPos = { ...spawnPos };

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

    public update(delta: number) {
        if (!this.isMoving) {
            const dirs = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
            const validDirs = dirs.filter(d => this.canMove(this.gridPos.x + d.x, this.gridPos.z + d.z));

            let dir = validDirs[Math.floor(Math.random() * validDirs.length)];
            if (validDirs.some(d => d.x === this.moveDirection.x && d.z === this.moveDirection.z)) {
                if (Math.random() > 0.2) dir = this.moveDirection;
            }

            if (dir) {
                this.moveDirection = dir;
                this.targetPos = { x: this.gridPos.x + dir.x, z: this.gridPos.z + dir.z };
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
