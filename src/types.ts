export interface Vector2D {
    x: number;
    z: number;
}

export enum CellType {
    EMPTY = 0,
    WALL = 1,
    PELLET = 2
}

export interface GameState {
    score: number;
    gameOver: boolean;
    gameWon: boolean;
}
