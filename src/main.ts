import { Engine } from './core/Engine';
import { Maze } from './entities/Maze';
import { Player } from './entities/Player';
import { Ghost } from './entities/Ghost';
import { HUD } from './ui/HUD';
import { Vector2D } from './types';
import './style.css';

class Game {
  private engine: Engine;
  private maze: Maze;
  private player: Player;
  private ghost: Ghost;
  private hud: HUD;

  private score = 0;
  private gameOver = false;
  private gameWon = false;
  private lastTime = 0;

  constructor() {
    this.engine = new Engine();
    this.maze = new Maze(this.engine.scene);
    this.player = new Player(this.engine.scene);
    this.ghost = new Ghost(this.engine.scene);
    this.hud = new HUD();

    this.animate(0);
  }

  private animate(t: number) {
    requestAnimationFrame((time) => this.animate(time));

    const delta = Math.min((t - this.lastTime) / 1000, 0.1);
    this.lastTime = t;

    if (!this.gameOver && !this.gameWon) {
      this.player.update(delta, (pos) => this.checkPelletCollision(pos));
      this.ghost.update(delta);
      this.checkGhostCollision();
    }

    this.engine.render();
  }

  private checkPelletCollision(pos: Vector2D) {
    this.maze.pellets.children.forEach((pellet: any) => {
      if (Math.abs(pellet.position.x - pos.x) < 0.1 &&
        Math.abs(pellet.position.z - pos.z) < 0.1) {
        this.maze.removePellet(pellet);
        this.score += 10;
        this.hud.updateScore(this.score);

        if (this.maze.pellets.children.length === 0) {
          this.triggerGameOver(true);
        }
      }
    });
  }

  private checkGhostCollision() {
    if (this.player.mesh.position.distanceTo(this.ghost.mesh.position) < 0.6) {
      this.triggerGameOver(false);
    }
  }

  private triggerGameOver(victory: boolean) {
    this.gameOver = !victory;
    this.gameWon = victory;
    const msg = victory ? 'YOU WIN!' : 'GAME OVER';
    const color = victory ? '#00ff00' : '#ff0000';
    this.hud.showStatus(msg, color);
  }
}

new Game();
