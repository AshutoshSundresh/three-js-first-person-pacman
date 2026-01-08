import { AudioManager } from '../core/AudioManager';

export class SplashScreen {
    private container: HTMLElement;
    private isVisible = true;
    private onComplete: () => void;
    private audioManager: AudioManager | null = null;

    constructor(onComplete: () => void, audioManager?: AudioManager) {
        this.onComplete = onComplete;
        this.audioManager = audioManager || null;
        this.container = document.createElement('div');
        this.createSplashScreen();
        document.body.appendChild(this.container);
        
        // Try to play intro music when splash screen appears
        this.startIntroMusic();
    }

    private async startIntroMusic() {
        if (this.audioManager) {
            // Try to resume audio context and play music
            const audioResumed = await this.audioManager.resumeAudioContext();
            if (audioResumed) {
                this.audioManager.playSound('startMusic', 0.6).catch(() => {
                    // If it fails due to autoplay restrictions, that's okay
                    // It will work after user interaction
                });
            }
        }
    }

    private createSplashScreen() {
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: '#000000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '10000',
            fontFamily: "'Orbitron', sans-serif",
            overflow: 'hidden'
        });

        // Click to start button - minimal
        const startButton = document.createElement('button');
        startButton.innerHTML = 'START';
        Object.assign(startButton.style, {
            fontSize: 'clamp(18px, 4vw, 32px)',
            color: '#ffff00',
            background: 'transparent',
            border: '2px solid #ffff00',
            borderRadius: '0',
            padding: '12px 50px',
            cursor: 'pointer',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: '400',
            letterSpacing: 'clamp(2px, 0.5vw, 8px)',
            textShadow: '0 0 10px #ffff00',
            boxShadow: '0 0 20px rgba(255, 255, 0, 0.3), inset 0 0 20px rgba(255, 255, 0, 0.1)',
            transition: 'all 0.3s ease',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
        });

        // Hover effects
        startButton.addEventListener('mouseenter', () => {
            Object.assign(startButton.style, {
                background: 'rgba(255, 255, 0, 0.1)',
                boxShadow: '0 0 30px rgba(255, 255, 0, 0.6), inset 0 0 30px rgba(255, 255, 0, 0.2)'
            });
        });

        startButton.addEventListener('mouseleave', () => {
            Object.assign(startButton.style, {
                background: 'transparent',
                boxShadow: '0 0 20px rgba(255, 255, 0, 0.3), inset 0 0 20px rgba(255, 255, 0, 0.1)'
            });
        });

        // Click handler
        startButton.addEventListener('click', () => {
            if (this.audioManager) {
                this.audioManager.stopSound('startMusic');
            }
            this.hide();
        });

        this.container.appendChild(startButton);

        // Copyright text at bottom
        const copyright = document.createElement('div');
        copyright.innerHTML = '© Ashutosh Sundresh 2026';
        Object.assign(copyright.style, {
            position: 'absolute',
            bottom: '20px',
            fontSize: 'clamp(10px, 2vw, 14px)',
            color: '#666666',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: '300',
            letterSpacing: '1px',
            textAlign: 'center',
            width: '100%'
        });
        this.container.appendChild(copyright);
    }

    public hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        Object.assign(this.container.style, {
            opacity: '0',
            transition: 'opacity 0.5s ease-out',
            pointerEvents: 'none'
        });

        setTimeout(() => {
            this.container.remove();
            this.onComplete();
        }, 500);
    }

    public isShowing(): boolean {
        return this.isVisible;
    }
}

