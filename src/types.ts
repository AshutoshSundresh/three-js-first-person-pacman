export interface Vector2D {
    x: number;
    z: number;
}

export const CellType = {
    EMPTY: 0,
    WALL: 1,
    PELLET: 2,
    GHOST_SPAWN: 3
} as const;

export type CellType = typeof CellType[keyof typeof CellType];

export interface GameState {
    score: number;
    gameOver: boolean;
    gameWon: boolean;
}
