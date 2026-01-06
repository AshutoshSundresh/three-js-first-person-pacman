import * as THREE from 'three';
import { MAZE_LAYOUT, GRID_SIZE, COLORS } from '../constants';
import { CellType } from '../types';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

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
            color: 0x000022,
            emissive: 0x0033aa, // Brighter base (was 0x001144)
            emissiveIntensity: 0.2,
            metalness: 0.0, // No metalness = no reflections
            roughness: 1.0, // High roughness = matte, non-reflective
            envMapIntensity: 0.0, // Disable environment map reflections
        });

        const pelletGeometry = new THREE.SphereGeometry(0.05, 16, 16);
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
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial.clone()); // Clone to pulse individually if needed, or keep shared
                    wall.position.set(x, 0.5, z);

                    // Add a glowing rim effect - thinner
                    const wireframe = new THREE.LineSegments(
                        new THREE.EdgesGeometry(wallGeometry),
                        new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 1, transparent: true }) // Linewidth 1
                    );
                    wall.add(wireframe);

                    this.addWallDetails(wall);
                    this.walls.add(wall);
                } else if (MAZE_LAYOUT[z][x] === CellType.PELLET) {
                    const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
                    pellet.position.set(x, 0.1, z);
                    this.pellets.add(pellet);
                } else if (MAZE_LAYOUT[z][x] === CellType.POWER_PELLET) {
                    const powerPellet = new THREE.Mesh(powerPelletGeometry, powerPelletMaterial);
                    powerPellet.position.set(x, 0.1, z);
                    powerPellet.name = 'powerPellet';
                    this.pellets.add(powerPellet);
                }
            }
        }
    }

    private addWallDetails(wall: THREE.Mesh) {
        const size = GRID_SIZE;
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x0044ff,
            metalness: 0.0, // No metalness = no reflections
            roughness: 1.0, // High roughness = matte
            envMapIntensity: 0.0 // Disable environment map reflections
        });

        // Add some random inset panels (greebles)
        for (let i = 0; i < 3; i++) {
            const panelSize = 0.2 + Math.random() * 0.4;
            const panelGeom = new THREE.BoxGeometry(panelSize, panelSize, 0.05);
            const panel = new THREE.Mesh(panelGeom, panelMaterial);

            // Randomly pick a side
            const side = Math.floor(Math.random() * 4);
            const offset = (size / 2) + 0.01;

            if (side === 0) panel.position.set(0, (Math.random() - 0.5) * size, offset);
            if (side === 1) panel.position.set(0, (Math.random() - 0.5) * size, -offset);
            if (side === 2) { panel.position.set(offset, (Math.random() - 0.5) * size, 0); panel.rotation.y = Math.PI / 2; }
            if (side === 3) { panel.position.set(-offset, (Math.random() - 0.5) * size, 0); panel.rotation.y = Math.PI / 2; }

            wall.add(panel);
        }

        // Add random neon circuitry strips
        const circuitMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.6, // Increased from 0.4
            transparent: true
        });

        for (let i = 0; i < 2; i++) {
            const isVertical = Math.random() > 0.5;
            const stripWidth = isVertical ? 0.01 : 0.15 + Math.random() * 0.2; // Thinner
            const stripHeight = isVertical ? 0.15 + Math.random() * 0.2 : 0.01; // Thinner
            const stripGeom = new THREE.BoxGeometry(stripWidth, stripHeight, 0.015); // Thinner depth
            const strip = new THREE.Mesh(stripGeom, circuitMaterial.clone());
            strip.name = 'neonStrip';

            const side = Math.floor(Math.random() * 4);
            const offset = (size / 2) + 0.02;

            if (side === 0) strip.position.set((Math.random() - 0.5) * size, (Math.random() - 0.5) * size, offset);
            if (side === 1) strip.position.set((Math.random() - 0.5) * size, (Math.random() - 0.5) * size, -offset);
            if (side === 2) { strip.position.set(offset, (Math.random() - 0.5) * size, (Math.random() - 0.5) * size); strip.rotation.y = Math.PI / 2; }
            if (side === 3) { strip.position.set(-offset, (Math.random() - 0.5) * size, (Math.random() - 0.5) * size); strip.rotation.y = Math.PI / 2; }

            wall.add(strip);
        }
    }

    public update(delta: number) {
        // Pulse Power Pellets
        this.pulseTime += delta * 4; // Slower master pulse
        this.pellets.children.forEach(pellet => {
            if (pellet.name === 'powerPellet') {
                const s = 1 + Math.sin(this.pulseTime) * 0.3;
                pellet.scale.set(s, s, s);
            }
        });

        // Pulse Wall Neon - more subtle breathing
        const wallGlow = 0.5 + Math.sin(this.pulseTime * 0.5) * 0.5;
        this.walls.children.forEach(wall => {
            if (wall instanceof THREE.Mesh && wall.material instanceof THREE.MeshStandardMaterial) {
                wall.material.emissiveIntensity = 0.2 + wallGlow * 0.3; // Brighter pulse (0.2 to 0.5)
            }
            // Update wireframe intensity
            wall.children.forEach(child => {
                if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
                    child.material.opacity = 0.4 + wallGlow * 0.3; // 0.4 to 0.7 instead of 0.3 to 1.0
                }
                if (child.name === 'neonStrip' && child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.emissiveIntensity = 0.4 + wallGlow * 1.2; // Increased range (0.4 to 1.6)
                    child.material.opacity = 0.5 + wallGlow * 0.3;
                }
            });
        });
    }

    private addFloor(scene: THREE.Scene) {
        const width = MAZE_LAYOUT[0].length;
        const height = MAZE_LAYOUT.length;

        const floorGeometry = new THREE.PlaneGeometry(width + 2, height + 2);

        // Use Reflector for real-time reflections - neutral gray
        const reflector = new Reflector(floorGeometry, {
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: 0x333333 // Darker gray
        });

        reflector.rotation.x = -Math.PI / 2;
        reflector.position.set(width / 2 - 0.5, -0.01, height / 2 - 0.5);
        scene.add(reflector);

        // Create a sandblasted fine-grain noise texture
        const noiseSize = 256;
        const noiseCanvas = document.createElement('canvas');
        noiseCanvas.width = noiseSize;
        noiseCanvas.height = noiseSize;
        const noiseCtx = noiseCanvas.getContext('2d')!;

        // Darker gray base
        noiseCtx.fillStyle = '#111111';
        noiseCtx.fillRect(0, 0, noiseSize, noiseSize);

        // Dense fine-grain noise - more opaque
        for (let i = 0; i < noiseSize; i++) {
            for (let j = 0; j < noiseSize; j++) {
                const v = 60 + Math.random() * 30; // Darker
                noiseCtx.fillStyle = `rgba(${v}, ${v}, ${v}, ${0.2 + Math.random() * 0.2})`; // More opaque
                noiseCtx.fillRect(i, j, 1, 1);
            }
        }

        const noiseTexture = new THREE.CanvasTexture(noiseCanvas);
        noiseTexture.wrapS = THREE.RepeatWrapping;
        noiseTexture.wrapT = THREE.RepeatWrapping;
        noiseTexture.repeat.set(width * 6, height * 6); // Fine tiling

        // Create a neutral digital grid
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d')!;
        context.clearRect(0, 0, size, size);
        context.strokeStyle = 'rgba(200, 200, 200, 0.1)'; // Neutral soft gray
        context.lineWidth = 10;
        context.strokeRect(0, 0, size, size);

        const gridTexture = new THREE.CanvasTexture(canvas);
        gridTexture.wrapS = THREE.RepeatWrapping;
        gridTexture.wrapT = THREE.RepeatWrapping;
        gridTexture.repeat.set(width, height);

        const frostedOverlay = new THREE.Mesh(
            floorGeometry,
            new THREE.MeshStandardMaterial({
                color: 0x1a1a1a, // Darker
                map: gridTexture,
                alphaMap: noiseTexture,
                transparent: true,
                opacity: 0.9, // More opaque
                metalness: 0.1,
                roughness: 0.85, // High roughness for sandblasted feel
                emissive: 0x2a2a2a, // Darker emissive
                emissiveIntensity: 0.05 // Reduced intensity
            })
        );
        frostedOverlay.rotation.x = -Math.PI / 2;
        frostedOverlay.position.set(width / 2 - 0.5, 0, height / 2 - 0.5);
        scene.add(frostedOverlay);
    }

    public removePellet(pellet: THREE.Object3D) {
        this.pellets.remove(pellet);
    }
}
