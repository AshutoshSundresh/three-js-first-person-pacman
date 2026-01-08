import * as THREE from 'three';

export class AudioManager {
    private listener: THREE.AudioListener;
    private sounds: Map<string, THREE.Audio | THREE.PositionalAudio> = new Map();
    private audioContext: AudioContext;
    private isInitialized = false;
    private pelletSound: THREE.Audio | null = null;
    private scene: THREE.Scene | null = null;
    private baseUrl: string;
    private overlappingSounds: THREE.Audio[] = []; // Track overlapping sound instances

    constructor(camera: THREE.Camera, scene?: THREE.Scene, baseUrl: string = '/') {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.audioContext = this.listener.context as AudioContext;
        this.scene = scene || null;
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    }

    public async initialize() {
        if (this.isInitialized) return;
        
        // Don't try to resume here - wait for user gesture
        // The audio context will be resumed when the user interacts
        this.isInitialized = true;
    }

    public async resumeAudioContext(): Promise<boolean> {
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            return this.audioContext.state === 'running';
        } catch (error) {
            console.error('Error resuming audio context:', error);
            return false;
        }
    }

    private async loadSound(path: string, loop: boolean = false, isPositional: boolean = false): Promise<THREE.Audio | THREE.PositionalAudio> {
        const loader = new THREE.AudioLoader();
        const fullPath = this.baseUrl + (path.startsWith('/') ? path.slice(1) : path);
        
        return new Promise((resolve, reject) => {
            loader.load(
                fullPath,
                (buffer) => {
                    if (isPositional) {
                        // For positional sounds, we'll create instances on demand
                        // Just store the buffer, don't create the sound yet
                        const placeholder = new THREE.PositionalAudio(this.listener);
                        placeholder.setBuffer(buffer);
                        placeholder.setLoop(loop);
                        placeholder.setVolume(0.6);
                        placeholder.setRefDistance(2);
                        placeholder.setRolloffFactor(3);
                        placeholder.setMaxDistance(15);
                        console.log(`Loaded positional sound ${path}, loop: ${loop}, buffer duration: ${buffer.duration}`);
                        resolve(placeholder);
                    } else {
                        const sound = new THREE.Audio(this.listener);
                        sound.setBuffer(buffer);
                        sound.setLoop(loop);
                        sound.setVolume(0.5);
                        resolve(sound);
                    }
                },
                undefined,
                reject
            );
        });
    }

    public async loadAllSounds() {
        // Helper to load sound with error handling
        const loadSoundSafe = async (name: string, path: string, loop: boolean, isPositional: boolean) => {
            try {
                const sound = await this.loadSound(path, loop, isPositional);
                this.sounds.set(name, sound);
                return true;
            } catch (error) {
                console.warn(`Failed to load sound ${name} from ${path}:`, error);
                return false;
            }
        };

        // Background music (non-positional)
        await loadSoundSafe('startMusic', 'audio/02. Start Music.mp3', false, false);
        await loadSoundSafe('coffeeMusic', 'audio/16. Coffee Break Music.mp3', false, false);

        // Game sounds (non-positional)
        const pelletSound = await this.loadSound('audio/03. PAC-MAN - Eating The Pac-dots.mp3', true, false).catch(() => null);
        if (pelletSound) {
            this.pelletSound = pelletSound as THREE.Audio;
            this.sounds.set('pellet', pelletSound);
        }

        await loadSoundSafe('turning', 'audio/04. PAC-MAN - Turning The Corner While Eating The Pac-dots.mp3', false, false);
        await loadSoundSafe('eatingGhost', 'audio/13. PAC-MAN - Eating The Ghost.mp3', false, false);
        await loadSoundSafe('fail', 'audio/15. Fail.mp3', false, false);
        await loadSoundSafe('ghostTurnBlue', 'audio/12. Ghost - Turn to Blue.mp3', false, false);
        await loadSoundSafe('ghostReturnHome', 'audio/14. Ghost - Return to Home.mp3', false, true); // Make it positional

        // Ghost movement sounds (positional)
        await loadSoundSafe('ghostNormal', 'audio/06. Ghost - Normal Move.mp3', true, true);

        // Configure positional audio settings - more pronounced spatial effect
        const positionalSounds = ['ghostNormal', 'ghostReturnHome'];
        positionalSounds.forEach(key => {
            const sound = this.sounds.get(key) as THREE.PositionalAudio;
            if (sound) {
                sound.setRefDistance(2); // Closer reference distance for more pronounced effect
                sound.setRolloffFactor(3); // Higher rolloff for steeper volume dropoff
                sound.setMaxDistance(15); // Shorter max distance
                sound.setVolume(0.6); // Higher base volume
            }
        });

        console.log('Loaded sounds:', Array.from(this.sounds.keys()));
    }

    public async playSound(name: string, volume: number = 1.0, allowOverlap: boolean = false) {
        // Ensure audio context is running
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Could not resume audio context:', error);
                return;
            }
        }

        const templateSound = this.sounds.get(name);
        if (!templateSound || !templateSound.buffer) {
            return;
        }

        // If overlap is allowed, create a new instance for each play
        if (allowOverlap) {
            const newSound = new THREE.Audio(this.listener);
            newSound.setBuffer(templateSound.buffer);
            newSound.setLoop(false);
            newSound.setVolume(volume);
            
            // Track this instance for cleanup
            this.overlappingSounds.push(newSound);
            
            try {
                await newSound.play();
                
                // Clean up after sound finishes (approximate based on buffer duration)
                const duration = templateSound.buffer.duration * 1000; // Convert to ms
                setTimeout(() => {
                    if (newSound.isPlaying) {
                        newSound.stop();
                    }
                    // Remove from tracking array
                    const index = this.overlappingSounds.indexOf(newSound);
                    if (index > -1) {
                        this.overlappingSounds.splice(index, 1);
                    }
                }, duration + 100); // Add small buffer
            } catch (error) {
                console.warn(`Error playing overlapping sound ${name}:`, error);
                // Remove from tracking if it failed
                const index = this.overlappingSounds.indexOf(newSound);
                if (index > -1) {
                    this.overlappingSounds.splice(index, 1);
                }
            }
            
            return;
        }

        // Original behavior: only play if not already playing
        if (!templateSound.isPlaying) {
            templateSound.setVolume(volume);
            templateSound.play();
        }
    }

    public stopSound(name: string) {
        const sound = this.sounds.get(name);
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    public stopAllSounds() {
        // Stop all non-positional sounds
        this.sounds.forEach((sound) => {
            if (sound instanceof THREE.Audio && sound.isPlaying) {
                sound.stop();
            }
        });
        
        // Stop all overlapping sound instances
        this.overlappingSounds.forEach((sound) => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
        this.overlappingSounds = []; // Clear the array
        
        // Stop all positional sound instances
        this.sounds.forEach((sound) => {
            if (sound instanceof THREE.PositionalAudio) {
                const instances = (sound as any).instances || [];
                instances.forEach((instance: THREE.PositionalAudio) => {
                    if (instance.isPlaying) {
                        instance.stop();
                    }
                });
            }
        });
        
        // Stop pellet loop
        this.stopPelletLoop();
    }

    public async playPositionalSound(name: string, position: THREE.Vector3, volume: number = 1.0, loop: boolean = true): Promise<THREE.PositionalAudio | null> {
        // Ensure audio context is running
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Could not resume audio context:', error);
                return null;
            }
        }

        const templateSound = this.sounds.get(name) as THREE.PositionalAudio;
        if (!templateSound) {
            return null;
        }
        
        if (!templateSound.buffer) {
            return null;
        }
        
        // Create a new positional audio instance
        const clonedSound = new THREE.PositionalAudio(this.listener);
        clonedSound.setBuffer(templateSound.buffer);
        clonedSound.setLoop(loop);
        clonedSound.setRefDistance(2); // Closer reference distance for more pronounced spatial effect
        clonedSound.setRolloffFactor(3); // Higher rolloff for steeper volume dropoff
        clonedSound.setMaxDistance(15); // Shorter max distance
        clonedSound.setVolume(volume);
        clonedSound.position.copy(position);
        
        // Add to scene if available (required for positional audio to work)
        if (this.scene) {
            this.scene.add(clonedSound);
        } else {
            return null;
        }
        
        // Store reference to clean up later
        if (!(templateSound as any).instances) {
            (templateSound as any).instances = [];
        }
        (templateSound as any).instances.push(clonedSound);
        
        // Play the sound
        try {
            await clonedSound.play();
        } catch (error) {
            console.error(`Error playing positional sound ${name}:`, error);
            return null;
        }
        
        return clonedSound;
    }

    public updatePositionalSound(sound: THREE.PositionalAudio, position: THREE.Vector3) {
        if (sound) {
            sound.position.copy(position);
            
            // Ensure sound is still playing (restart if it stopped)
            if (!sound.isPlaying && sound.buffer) {
                try {
                    sound.play();
                } catch (error) {
                    console.warn('Failed to restart positional sound:', error);
                }
            }
            
            // THREE.js handles distance-based volume automatically via setRefDistance, setRolloffFactor, setMaxDistance
            // The volume will automatically adjust based on distance from listener
        }
    }

    public async startPelletLoop() {
        // Ensure audio context is running
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Could not resume audio context:', error);
                return;
            }
        }

        if (this.pelletSound) {
            // If not playing, start it
            if (!this.pelletSound.isPlaying) {
                // Reset the sound to beginning and ensure loop is set
                this.pelletSound.setLoop(true);
                this.pelletSound.setVolume(0.4);
                this.pelletSound.play();
            }
        }
    }

    public stopPelletLoop() {
        if (this.pelletSound && this.pelletSound.isPlaying) {
            this.pelletSound.stop();
        }
    }

    public update(listenerPosition: THREE.Vector3) {
        // Update all positional sound instances
        this.sounds.forEach((sound) => {
            if (sound instanceof THREE.PositionalAudio) {
                const instances = (sound as any).instances || [];
                instances.forEach((instance: THREE.PositionalAudio) => {
                    if (instance.isPlaying) {
                        const distance = instance.position.distanceTo(listenerPosition);
                        const maxDistance = 20;
                        const refDistance = 5;
                        let volume = 0.3;
                        
                        if (distance < refDistance) {
                            volume = 0.3;
                        } else if (distance < maxDistance) {
                            volume = 0.3 * (1 - (distance - refDistance) / (maxDistance - refDistance));
                        } else {
                            volume = 0;
                        }
                        
                        instance.setVolume(Math.max(0, volume));
                    }
                });
            }
        });
    }

    public cleanup() {
        this.sounds.forEach((sound) => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
        this.sounds.clear();
    }
}

