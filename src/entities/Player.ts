import * as THREE from 'three';
import { type Vector2D, CellType } from '../types';
import { MAZE_LAYOUT, PLAYER_SPEED, COLORS } from '../constants';

export class Player {
    public mesh: THREE.Mesh;
    public gridPos: Vector2D = { x: 1, z: 1 };
    private targetPos: Vector2D = { x: 1, z: 1 };
    private moveDirection: Vector2D = { x: 0, z: 0 };
    private nextDirection: Vector2D = { x: 0, z: 0 };
    private isMoving = false;

    constructor(scene: THREE.Scene) {
        const geometry = new THREE.SphereGeometry(0.4, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(1, 0.4, 1);
        scene.add(this.mesh);

        this.setupInput();
    }

    private setupInput() {
        window.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w': case 'arrowup': this.nextDirection = { x: 0, z: -1 }; break;
                case 's': case 'arrowdown': this.nextDirection = { x: 0, z: 1 }; break;
                case 'a': case 'arrowleft': this.nextDirection = { x: -1, z: 0 }; break;
                case 'd': case 'arrowright': this.nextDirection = { x: 1, z: 0 }; break;
            }
        });
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

    public update(delta: number, onPelletCheck: (pos: Vector2D) => void) {
        if (!this.isMoving) {
            if (this.nextDirection.x !== 0 || this.nextDirection.z !== 0) {
                if (this.canMove(this.gridPos.x + this.nextDirection.x, this.gridPos.z + this.nextDirection.z)) {
                    this.moveDirection = { ...this.nextDirection };
                    this.targetPos = { x: this.gridPos.x + this.moveDirection.x, z: this.gridPos.z + this.moveDirection.z };
                    this.isMoving = true;
                } else if (this.canMove(this.gridPos.x + this.moveDirection.x, this.gridPos.z + this.moveDirection.z)) {
                    this.targetPos = { x: this.gridPos.x + this.moveDirection.x, z: this.gridPos.z + this.moveDirection.z };
                    this.isMoving = true;
                }
            }
        }

        if (this.isMoving) {
            this.mesh.position.x += this.moveDirection.x * PLAYER_SPEED * delta;
            this.mesh.position.z += this.moveDirection.z * PLAYER_SPEED * delta;

            if (Math.abs(this.targetPos.x - this.mesh.position.x) < PLAYER_SPEED * delta &&
                Math.abs(this.targetPos.z - this.mesh.position.z) < PLAYER_SPEED * delta) {

                const width = MAZE_LAYOUT[0].length;
                let finalX = this.targetPos.x;

                // Wrap around teleport
                if (finalX < 0) finalX = width - 1;
                else if (finalX >= width) finalX = 0;

                this.mesh.position.x = finalX;
                this.mesh.position.z = this.targetPos.z;
                this.gridPos = { x: finalX, z: this.targetPos.z };
                this.isMoving = false;
                onPelletCheck(this.gridPos);
            }
        }
    }
}
