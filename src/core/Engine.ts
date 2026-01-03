import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { COLORS } from '../constants';

export class Engine {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public minimapCamera: THREE.OrthographicCamera;
    public renderer: THREE.WebGLRenderer;
    private composer!: EffectComposer;
    private bloomPass!: UnrealBloomPass;
    private pointLight!: THREE.PointLight;
    private baseFOV: number = 75;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS.BACKGROUND);

        // Main First Person Camera
        this.camera = new THREE.PerspectiveCamera(this.baseFOV, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.layers.enable(0);
        this.camera.layers.disable(1); // Hide player from main view

        // Minimap Camera (Orthographic)
        const aspect = window.innerWidth / window.innerHeight;
        const d = 5;
        this.minimapCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.minimapCamera.position.set(10, 20, 10);
        this.minimapCamera.lookAt(10, 0, 10);
        this.minimapCamera.layers.enable(0);
        this.minimapCamera.layers.enable(1); // Show player in minimap

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.autoClear = false; // Important for multiple viewports
        document.body.appendChild(this.renderer.domElement);

        this.setupPostProcessing();
        this.setupLighting();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    private setupPostProcessing() {
        const renderScene = new RenderPass(this.scene, this.camera);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);
    }

    private setupLighting() {
        // Soft ambient fill
        this.scene.add(new THREE.HemisphereLight(0x4433aa, 0x111122, 0.5));

        // Targetable light for the player
        this.pointLight = new THREE.PointLight(0xffffff, 2, 10);
        this.pointLight.castShadow = true;
        this.scene.add(this.pointLight);

        // Add some localized neon lights for vibe
        const neonLight = new THREE.PointLight(0x00ffff, 1, 20);
        neonLight.position.set(10, 5, 10);
        this.scene.add(neonLight);
    }

    public updateCameras(playerPos: THREE.Vector3, playerRotation: number) {
        // Update First Person Camera
        this.camera.position.copy(playerPos);
        this.camera.position.y = 0.5; // Eye level

        // Look in move direction
        const lookAtPos = playerPos.clone().add(
            new THREE.Vector3(
                Math.sin(playerRotation),
                0,
                Math.cos(playerRotation)
            )
        );
        this.camera.lookAt(lookAtPos);

        // Update Minimap Camera
        this.minimapCamera.position.set(playerPos.x, 20, playerPos.z);
        this.minimapCamera.up.set(
            Math.sin(playerRotation),
            0,
            Math.cos(playerRotation)
        );
        this.minimapCamera.lookAt(playerPos.x, 0, playerPos.z);

        // Move light with player
        this.pointLight.position.set(playerPos.x, 1, playerPos.z);
    }

    private onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        const d = 5;
        this.minimapCamera.left = -d * aspect;
        this.minimapCamera.right = d * aspect;
        this.minimapCamera.top = d;
        this.minimapCamera.bottom = -d;
        this.minimapCamera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    public setWarpEffect(intensity: number) {
        // FOV Pulse: 75 -> 110
        this.camera.fov = this.baseFOV + (intensity * 35);
        this.camera.updateProjectionMatrix();

        // Bloom Intensity: 1.5 -> 5
        this.bloomPass.strength = 1.5 + (intensity * 3.5);
    }

    public render() {
        this.renderer.clear();

        // 1. Render Main Scene with Bloom (Full Viewport)
        this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.composer.render();

        // 2. Render Minimap (Top Right) - No Bloom for clarity
        const size = Math.min(window.innerWidth, window.innerHeight) * 0.25;
        this.renderer.setScissorTest(true);
        this.renderer.setScissor(
            window.innerWidth - size - 20,
            window.innerHeight - size - 20,
            size,
            size
        );
        this.renderer.setViewport(
            window.innerWidth - size - 20,
            window.innerHeight - size - 20,
            size,
            size
        );

        this.renderer.render(this.scene, this.minimapCamera);
        this.renderer.setScissorTest(false);
    }
}
