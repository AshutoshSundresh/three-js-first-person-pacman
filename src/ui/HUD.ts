export class HUD {
    private scoreElement: HTMLElement;
    private statusElement: HTMLElement;

    constructor() {
        this.scoreElement = document.createElement('div');
        this.applyScoreStyles();
        document.body.appendChild(this.scoreElement);

        this.statusElement = document.createElement('div');
        this.applyStatusStyles();
        document.body.appendChild(this.statusElement);

        this.updateScore(0);
    }

    private applyScoreStyles() {
        Object.assign(this.scoreElement.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            color: '#00ffff',
            padding: '15px 25px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '28px',
            textShadow: '0 0 10px #00ffff',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        });
    }

    private applyStatusStyles() {
        Object.assign(this.statusElement.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(15px)',
            padding: '40px 80px',
            borderRadius: '20px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '64px',
            fontWeight: '900',
            textAlign: 'center',
            letterSpacing: '10px',
            display: 'none',
            boxShadow: '0 0 50px rgba(0, 255, 255, 0.2)'
        });
    }

    public updateScore(score: number) {
        this.scoreElement.innerText = `Score: ${score}`;
    }

    public showStatus(message: string, color: string) {
        this.statusElement.innerText = message;
        this.statusElement.style.color = color;
        this.statusElement.style.display = 'block';
    }
}
