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
            color: 'white',
            fontFamily: 'Arial',
            fontSize: '24px'
        });
    }

    private applyStatusStyles() {
        Object.assign(this.statusElement.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'Arial',
            fontSize: '48px',
            fontWeight: 'bold',
            display: 'none'
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
