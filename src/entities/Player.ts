import * as THREE from 'three';
import { type Vector2D, CellType } from '../types';
import { MAZE_LAYOUT, PLAYER_SPEED, COLORS } from '../constants';

export class Player {
    public mesh: THREE.Mesh;
    public gridPos: Vector2D = { x: 1, z: 1 };
    public rotation = 0; // Current rendered rotation
    private targetRotation = 0; // The direction we WANT to face
    private targetPos: Vector2D = { x: 1, z: 1 };
    private moveDirection: Vector2D = { x: 0, z: 0 };
    private nextDirection: Vector2D = { x: 0, z: 0 };
    private isMoving = false;

    constructor(scene: THREE.Scene) {
        // Create a more "front-facing" mesh or just a sphere
        const geometry = new THREE.SphereGeometry(0.4, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(1, 0.4, 1);

        // Hide player mesh in first person if desired, or keep it as a "body"
        // this.mesh.visible = false; 

        scene.add(this.mesh);

        this.setupInput();
    }

    private setupInput() {
        window.addEventListener('keydown', (e) => {
            const rot = this.rotation;
            const cos = Math.round(Math.cos(rot));
            const sin = Math.round(Math.sin(rot));

            let lx = 0;
            let lz = 0;

            switch (e.key.toLowerCase()) {
                case 'w': case 'arrowup': lz = 1; break;
                case 's': case 'arrowdown': lz = -1; break;
                case 'a': case 'arrowleft': lx = -1; break;
                case 'd': case 'arrowright': lx = 1; break;
            }

            if (lx !== 0 || lz !== 0) {
                // Transform local input to world direction relative to camera POV
                const worldX = -lx * cos + lz * sin;
                const worldZ = lx * sin + lz * cos;
                this.nextDirection = { x: Math.round(worldX), z: Math.round(worldZ) };
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
        // Interpolate rotation smoothly
        const rotationSpeed = 10; // Radians per second
        let angleDiff = this.targetRotation - this.rotation;

        // Wrap angle difference to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) > 0.01) {
            this.rotation += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotationSpeed * delta);
        } else {
            this.rotation = this.targetRotation;
        }
        this.mesh.rotation.y = this.rotation; // Apply the interpolated rotation to the mesh

        if (!this.isMoving) {
            if (this.nextDirection.x !== 0 || this.nextDirection.z !== 0) {
                if (this.canMove(this.gridPos.x + this.nextDirection.x, this.gridPos.z + this.nextDirection.z)) {
                    this.moveDirection = { ...this.nextDirection };
                    this.targetPos = { x: this.gridPos.x + this.moveDirection.x, z: this.gridPos.z + this.moveDirection.z };
                    this.isMoving = true;

                    // Set target rotation based on direction
                    // North: 0, East: PI/2, South: PI, West: -PI/2
                    this.targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);
                } else if (this.canMove(this.gridPos.x + this.moveDirection.x, this.gridPos.z + this.moveDirection.z)) {
                    this.targetPos = { x: this.gridPos.x + this.moveDirection.x, z: this.gridPos.z + this.moveDirection.z };
                    this.isMoving = true;
                }
            }
        }

        if (this.isMoving) {
            this.mesh.position.x += this.moveDirection.x * PLAYER_SPEED * delta;
            this.mesh.position.z += this.moveDirection.z * PLAYER_SPEED * delta;
            this.mesh.rotation.y = this.rotation;

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
