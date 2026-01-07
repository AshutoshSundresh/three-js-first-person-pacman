export class Gamepad {
    private container: HTMLElement;
    private upButton: HTMLElement;
    private downButton: HTMLElement;
    private leftButton: HTMLElement;
    private rightButton: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'gamepad-container';
        
        // Create directional buttons
        this.upButton = this.createButton('↑', 'ArrowUp');
        this.downButton = this.createButton('↓', 'ArrowDown');
        this.leftButton = this.createButton('←', 'ArrowLeft');
        this.rightButton = this.createButton('→', 'ArrowRight');

        // Arrange buttons in a cross pattern
        const center = document.createElement('div');
        center.className = 'gamepad-center';
        
        const topRow = document.createElement('div');
        topRow.className = 'gamepad-row';
        topRow.appendChild(this.upButton);

        const middleRow = document.createElement('div');
        middleRow.className = 'gamepad-row';
        middleRow.appendChild(this.leftButton);
        middleRow.appendChild(center);
        middleRow.appendChild(this.rightButton);

        const bottomRow = document.createElement('div');
        bottomRow.className = 'gamepad-row';
        bottomRow.appendChild(this.downButton);

        this.container.appendChild(topRow);
        this.container.appendChild(middleRow);
        this.container.appendChild(bottomRow);

        this.applyStyles();
        document.body.appendChild(this.container);
    }

    private createButton(text: string, key: string): HTMLElement {
        const button = document.createElement('button');
        button.className = 'gamepad-button';
        button.textContent = text;
        button.setAttribute('data-key', key);

        // Touch events
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePress(key);
            button.classList.add('pressed');
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.classList.remove('pressed');
        });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            button.classList.remove('pressed');
        });

        // Mouse events for testing on desktop
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handlePress(key);
            button.classList.add('pressed');
        });

        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            button.classList.remove('pressed');
        });

        button.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            button.classList.remove('pressed');
        });

        return button;
    }

    private handlePress(key: string) {
        // Dispatch keyboard event that Player already listens to
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    }

    private applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .gamepad-container {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 1000;
                display: none; /* Hidden by default, shown only on mobile */
            }

            .gamepad-row {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 5px;
            }

            .gamepad-center {
                width: 60px;
                height: 60px;
            }

            .gamepad-button {
                width: 60px;
                height: 60px;
                border: none;
                border-radius: 15px;
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(10px);
                color: #00ffff;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                user-select: none;
                touch-action: manipulation;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3),
                            inset 0 0 20px rgba(0, 255, 255, 0.1);
                border: 2px solid rgba(0, 255, 255, 0.3);
                transition: all 0.1s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .gamepad-button:active,
            .gamepad-button.pressed {
                background: rgba(0, 255, 255, 0.3);
                transform: scale(0.95);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4),
                            inset 0 0 30px rgba(0, 255, 255, 0.2);
                border-color: rgba(0, 255, 255, 0.6);
            }

            /* Show gamepad only on mobile devices */
            @media (max-width: 768px) and (pointer: coarse) {
                .gamepad-container {
                    display: block;
                }
            }

            /* Alternative mobile detection */
            @media (hover: none) and (pointer: coarse) {
                .gamepad-container {
                    display: block;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

