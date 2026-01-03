import { Engine } from './core/Engine';
import { Maze } from './entities/Maze';
import { Player } from './entities/Player';
import { Ghost, GhostState } from './entities/Ghost'; // Added GhostState import
import { HUD } from './ui/HUD';
import { type Vector2D, CellType } from './types';
import { MAZE_LAYOUT, POWER_PELLET_DURATION } from './constants'; // Added POWER_PELLET_DURATION import
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
      // Update Super Mode Timer
      if (this.player.superMode) {
        this.player.superModeTimer -= delta;
        if (this.player.superModeTimer <= 0) {
          this.player.superMode = false;
          this.ghosts.forEach(g => {
            if (g.getState() === GhostState.FRIGHTENED) {
              g.setState(GhostState.CHASE);
            }
          });
        }
      }

      this.player.update(delta, (pos: Vector2D) => {
        const cellType = MAZE_LAYOUT[pos.z][pos.x];
        if (cellType === CellType.PELLET || cellType === CellType.POWER_PELLET) {
          // Remove pellet from scene
          // Find the specific pellet mesh to remove
          const pelletToRemove = this.maze.pellets.children.find((p: any) =>
            Math.round(p.position.x) === pos.x && Math.round(p.position.z) === pos.z
          );

          if (pelletToRemove) {
            this.maze.removePellet(pelletToRemove); // Use the existing removePellet method
            MAZE_LAYOUT[pos.z][pos.x] = CellType.EMPTY; // Update the layout

            if (cellType === CellType.PELLET) {
              this.score += 10;
            } else { // POWER_PELLET
              this.score += 50;
              this.player.superMode = true;
              this.player.superModeTimer = POWER_PELLET_DURATION;
              this.ghosts.forEach(g => g.setState(GhostState.FRIGHTENED));
            }
            this.hud.updateScore(this.score);

            if (this.maze.pellets.children.length === 0) {
              this.triggerGameOver(true);
            }
          }
        }
      });

      const superTime = this.player.superMode ? this.player.superModeTimer : 0;
      this.ghosts.forEach(ghost => {
        ghost.update(delta, this.player.gridPos, superTime);

        // Collision Check
        const dist = Math.sqrt(
          Math.pow(ghost.mesh.position.x - this.player.mesh.position.x, 2) +
          Math.pow(ghost.mesh.position.z - this.player.mesh.position.z, 2)
        );

        if (dist < 0.6) { // Collision detected
          if (ghost.getState() === GhostState.FRIGHTENED) {
            ghost.setState(GhostState.EATEN);
            this.score += 200;
            this.hud.updateScore(this.score);
          } else if (ghost.getState() === GhostState.CHASE) {
            this.triggerGameOver(false);
          }
        }
      });

      this.engine.updateCameras(this.player.mesh.position, this.player.rotation);
      this.engine.setWarpEffect(this.player.warpProgress); // Drive Overdrive effect
      this.maze.update(delta); // Add maze update for pulsing
    }

    this.engine.render();
  }

  private triggerGameOver(victory: boolean) {
    this.gameOver = !victory;
    this.gameWon = victory;
    const msg = victory ? 'YOU WIN!' : 'GAME OVER';
    const color = victory ? '#00ff00' : '#ffb852'; // Use ghost color for loss
    this.hud.showStatus(msg, color);
  }
}

new Game();
