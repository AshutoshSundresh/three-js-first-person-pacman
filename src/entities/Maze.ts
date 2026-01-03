import * as THREE from 'three';
import { MAZE_LAYOUT, GRID_SIZE, COLORS } from '../constants';
import { CellType } from '../types';

export class Maze {
    public walls: THREE.Group;
    public pellets: THREE.Group;
    private pulseTime: number = 0;

    constructor(scene: THREE.Scene) {
        this.walls = new THREE.Group();
        this.pellets = new THREE.Group();
        scene.add(this.walls);
        scene.add(this.pellets);

        this.generate();
        this.addFloor(scene);
    }

    private generate() {
        const wallGeometry = new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, GRID_SIZE);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x000033,
            emissive: 0x0022ff,
            emissiveIntensity: 0.5,
            metalness: 0.9,
            roughness: 0.1
        });

        const pelletGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const pelletMaterial = new THREE.MeshStandardMaterial({
            color: COLORS.PELLET
        });

        const powerPelletGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const powerPelletMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 2
        });

        for (let z = 0; z < MAZE_LAYOUT.length; z++) {
            for (let x = 0; x < MAZE_LAYOUT[z].length; x++) {
                if (MAZE_LAYOUT[z][x] === CellType.WALL) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(x, 0.5, z);

                    // Add a glowing rim effect
                    const wireframe = new THREE.LineSegments(
                        new THREE.EdgesGeometry(wallGeometry),
                        new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 })
                    );
                    wall.add(wireframe);

                    this.walls.add(wall);
                } else if (MAZE_LAYOUT[z][x] === CellType.PELLET) {
                    const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
                    pellet.position.set(x, 0.2, z);
                    this.pellets.add(pellet);
                } else if (MAZE_LAYOUT[z][x] === CellType.POWER_PELLET) {
                    const powerPellet = new THREE.Mesh(powerPelletGeometry, powerPelletMaterial);
                    powerPellet.position.set(x, 0.2, z);
                    powerPellet.name = 'powerPellet';
                    this.pellets.add(powerPellet);
                }
            }
        }
    }

    public update(delta: number) {
        // Pulse Power Pellets
        this.pulseTime += delta * 15;
        this.pellets.children.forEach(pellet => {
            if (pellet.name === 'powerPellet') {
                const s = 1 + Math.sin(this.pulseTime) * 0.3;
                pellet.scale.set(s, s, s);
            }
        });
    }

    private addFloor(scene: THREE.Scene) {
        const width = MAZE_LAYOUT[0].length;
        const height = MAZE_LAYOUT.length;

        // Create a grid texture for the floor
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d')!;
        context.fillStyle = '#050505';
        context.fillRect(0, 0, size, size);
        context.strokeStyle = '#2200ff';
        context.lineWidth = 4;
        context.strokeRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(width, height);

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(width + 2, height + 2),
            new THREE.MeshStandardMaterial({
                map: texture,
                metalness: 0.8,
                roughness: 0.2
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(width / 2 - 0.5, 0, height / 2 - 0.5);
        scene.add(floor);
    }

    public removePellet(pellet: THREE.Object3D) {
        this.pellets.remove(pellet);
    }
}
