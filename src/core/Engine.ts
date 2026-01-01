import * as THREE from 'three';
import { COLORS } from '../constants';

export class Engine {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public minimapCamera: THREE.OrthographicCamera;
    public renderer: THREE.WebGLRenderer;
    private pointLight!: THREE.PointLight;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(COLORS.BACKGROUND);

        // Main First Person Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // Minimap Camera (Orthographic)
        const aspect = window.innerWidth / window.innerHeight;
        const d = 5;
        this.minimapCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.minimapCamera.position.set(10, 20, 10);
        this.minimapCamera.lookAt(10, 0, 10);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.autoClear = false; // Important for multiple viewports
        document.body.appendChild(this.renderer.domElement);

        this.setupLighting();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    private setupLighting() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        this.pointLight = new THREE.PointLight(0xffffff, 1, 100);
        this.pointLight.position.set(5, 10, 5);
        this.pointLight.castShadow = true;
        this.scene.add(this.pointLight);
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
        this.minimapCamera.lookAt(playerPos.x, 0, playerPos.z);

        // Move light with player
        this.pointLight.position.set(playerPos.x, 5, playerPos.z);
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
    }

    public render() {
        this.renderer.clear();

        // 1. Render Main Scene (Full Viewport)
        this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        this.renderer.render(this.scene, this.camera);

        // 2. Render Minimap (Top Right)
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
