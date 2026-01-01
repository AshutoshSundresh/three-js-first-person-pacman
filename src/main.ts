import { Engine } from './core/Engine';
import { Maze } from './entities/Maze';
import { Player } from './entities/Player';
import { Ghost } from './entities/Ghost';
import { HUD } from './ui/HUD';
import { type Vector2D, CellType } from './types';
import { MAZE_LAYOUT } from './constants';
import './style.css';

class Game {
  private engine: Engine;
  private maze: Maze;
  private player: Player;
  private ghosts: Ghost[] = [];
  private hud: HUD;

  private score = 0;
  private gameOver = false;
  private gameWon = false;
  private lastTime = 0;

  constructor() {
    this.engine = new Engine();
    this.maze = new Maze(this.engine.scene);
    this.player = new Player(this.engine.scene);
    this.hud = new HUD();

    this.spawnGhosts();
    this.animate(0);
  }

  private spawnGhosts() {
    const ghostColors = [0xff0000, 0xffb8ff, 0x00ffff, 0xffb852];
    const spawnPoints: Vector2D[] = [];

    for (let z = 0; z < MAZE_LAYOUT.length; z++) {
      for (let x = 0; x < MAZE_LAYOUT[z].length; x++) {
        if (MAZE_LAYOUT[z][x] === CellType.GHOST_SPAWN) {
          spawnPoints.push({ x, z });
        }
      }
    }

    // Spawn up to 4 ghosts at distinct points
    for (let i = 0; i < Math.min(ghostColors.length, spawnPoints.length); i++) {
      const ghost = new Ghost(this.engine.scene, spawnPoints[i], ghostColors[i]);
      this.ghosts.push(ghost);
    }
  }

  private animate(t: number) {
    requestAnimationFrame((time) => this.animate(time));

    const delta = Math.min((t - this.lastTime) / 1000, 0.1);
    this.lastTime = t;

    if (!this.gameOver && !this.gameWon) {
      this.player.update(delta, (pos) => this.checkPelletCollision(pos));
      this.ghosts.forEach(ghost => ghost.update(delta, this.player.gridPos));
      this.checkGhostCollision();
      this.engine.followPlayer(this.player.mesh.position);
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
    for (const ghost of this.ghosts) {
      if (this.player.mesh.position.distanceTo(ghost.mesh.position) < 0.6) {
        this.triggerGameOver(false);
        break;
      }
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
