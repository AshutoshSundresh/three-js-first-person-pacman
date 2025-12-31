export const GRID_SIZE = 1;

export const MAZE_LAYOUT = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 1, 2, 2, 2, 2, 1, 2, 1],
    [1, 0, 2, 2, 1, 1, 2, 2, 0, 1],
    [1, 2, 1, 2, 2, 2, 2, 1, 2, 1],
    [1, 2, 1, 1, 2, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const PLAYER_SPEED = 4;
export const GHOST_SPEED = 3;

export const COLORS = {
    WALL: 0x2222ff,
    PELLET: 0xffccaa,
    PLAYER: 0xffff00,
    GHOST: 0xff0000,
    FLOOR: 0x111111,
    BACKGROUND: 0x000000
};
