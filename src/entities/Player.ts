import * as THREE from 'three';
import { type Vector2D, CellType } from '../types';
import { MAZE_LAYOUT, PLAYER_SPEED, COLORS } from '../constants';

export class Player {
    public mesh: THREE.Group; // Changed to Group
    public gridPos: Vector2D = { x: 1, z: 1 };
    public rotation = 0; // Current rendered rotation
    private targetRotation = 0; // The direction we WANT to face
    private targetPos: Vector2D = { x: 1, z: 1 };
    private moveDirection: Vector2D = { x: 0, z: 0 };
    private nextDirection: Vector2D = { x: 0, z: 0 };
    private isMoving = false;

    // Super Mode
    public superMode = false;
    public superModeTimer = 0;

    // Warp Effect
    public warpProgress = 0;

    public get isSuper(): boolean {
        return this.superMode;
    }

    // Animation properties
    private chompAngle = 0;
    private chompDirection = 1;
    private upperJaw!: THREE.Mesh;
    private lowerJaw!: THREE.Mesh;

    constructor(scene: THREE.Scene) {
        this.mesh = new THREE.Group();

        const material = new THREE.MeshStandardMaterial({
            color: COLORS.PLAYER,
            emissive: COLORS.PLAYER,
            emissiveIntensity: 0.8, // More vibrant yellow
            metalness: 0.3,
            roughness: 0.1
        });

        // Split sphere for jaws - Reduced radius to 0.45 (Reduced segments for performance)
        const radius = 0.45;
        const upperGeo = new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        this.upperJaw = new THREE.Mesh(upperGeo, material);

        const lowerGeo = new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        this.lowerJaw = new THREE.Mesh(lowerGeo, material);

        this.mesh.add(this.upperJaw);
        this.mesh.add(this.lowerJaw);

        // Add Eyes - Adjusted for smaller size (Reduced segments for performance)
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);

        const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
        leftEye.position.set(0.22, 0.22, 0.28);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
        rightEye.position.set(-0.22, 0.22, 0.28);

        this.mesh.add(leftEye, rightEye);

        this.mesh.position.set(1, radius, 1);

        // Use layers to show only in minimap
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.layers.set(1);
            }
        });
        this.mesh.layers.set(1);

        this.mesh.visible = true; // Make it visible again
        scene.add(this.mesh);

        this.setupInput();
    }

    private setupInput() {
        window.addEventListener('keydown', (e) => {
            const rot = this.targetRotation; // Use target rotation for input derivation
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

        // Chomp Animation
        if (this.isMoving) {
            this.chompAngle += delta * 15 * this.chompDirection;
            if (this.chompAngle > 0.6) this.chompDirection = -1;
            if (this.chompAngle < 0) this.chompDirection = 1;
        } else {
            this.chompAngle = 0.2; // Keep mouth slightly open when still
        }

        this.upperJaw.rotation.x = -this.chompAngle;
        this.lowerJaw.rotation.x = this.chompAngle;

        if (!this.isMoving) {
            if (this.nextDirection.x !== 0 || this.nextDirection.z !== 0) {
                if (this.canMove(this.gridPos.x + this.nextDirection.x, this.gridPos.z + this.nextDirection.z)) {
                    this.moveDirection = { ...this.nextDirection };
                    this.targetPos = { x: this.gridPos.x + this.moveDirection.x, z: this.gridPos.z + this.moveDirection.z };
                    this.isMoving = true;

                    // Set target rotation based on direction
                    // North: 0, East: PI/2, South: PI, West: -PI/2
                    this.targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);
                }
            }
        }

        if (this.isMoving) {
            this.mesh.position.x += this.moveDirection.x * PLAYER_SPEED * delta;
            this.mesh.position.z += this.moveDirection.z * PLAYER_SPEED * delta;

            // Overdrive Warp Progress (Approaching edge)
            const width = MAZE_LAYOUT[0].length;
            if (this.targetPos.x < 0 || this.targetPos.x >= width) {
                const distToEdge = Math.abs(this.targetPos.x - this.mesh.position.x);
                this.warpProgress = Math.max(0, 1 - distToEdge);
            }

            if (Math.abs(this.targetPos.x - this.mesh.position.x) < PLAYER_SPEED * delta &&
                Math.abs(this.targetPos.z - this.mesh.position.z) < PLAYER_SPEED * delta) {

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
                    this.warpProgress = 1.0; // Max intensity upon arrival
                }

                onPelletCheck(this.gridPos);
            }
        }

        // Warp Animation (Progress Decay)
        if (this.warpProgress > 0) {
            this.warpProgress = Math.max(0, this.warpProgress - delta * 4);
        }
    }
}
