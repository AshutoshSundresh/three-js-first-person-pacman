import * as THREE from 'three';
import { MAZE_LAYOUT, GRID_SIZE, COLORS } from '../constants';
import { CellType } from '../types';

export class Maze {
    public walls: THREE.Group;
    public pellets: THREE.Group;

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
        const wallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.WALL });
        const pelletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const pelletMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PELLET });

        for (let z = 0; z < MAZE_LAYOUT.length; z++) {
            for (let x = 0; x < MAZE_LAYOUT[z].length; x++) {
                if (MAZE_LAYOUT[z][x] === CellType.WALL) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(x, 0.5, z);
                    this.walls.add(wall);
                } else if (MAZE_LAYOUT[z][x] === CellType.PELLET) {
                    const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
                    pellet.position.set(x, 0.2, z);
                    this.pellets.add(pellet);
                }
            }
        }
    }

    private addFloor(scene: THREE.Scene) {
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: COLORS.FLOOR })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(4, 0, 4);
        scene.add(floor);
    }

    public removePellet(pellet: THREE.Object3D) {
        this.pellets.remove(pellet);
    }
}
