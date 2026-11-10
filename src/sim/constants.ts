// All simulation values are integers. Distances are in sub-units (1 unit = 1000).
export const U = 1000;
export const STAGE_HALF = 11 * U; // walls at +/- 11 units
export const BODY_HALF = 450;
export const HP_MAX = 200;
export const ROUND_FRAMES = 60 * 60;
export const ROUNDS_TO_WIN = 2;
export const INTRO_FRAMES = 100;
export const KO_FRAMES = 180;
export const START_X = 2500;

export const BUFFER = 8;
export const DASH_WINDOW = 12;

export const GRAVITY = 9;
export const JUMP_PRE = 4;
export const JUMP_V = 180;
export const JUMP_VX = 55;
export const LAND_T = 4;

export const DASH_T = 18;
export const DASH_V = 210;
export const BDASH_T = 22;
export const BDASH_V = 190;
export const BDASH_CANCEL = 16;

export const KD_VY = 110;
export const KD_VX = 45;
export const KD_MIN = 18;
export const KD_MAX = 50;
export const GETUP_T = 22;

export const THROW_BREAK = 14;
export const THROW_EXEC_T = 40;
export const THROW_SLAM = 20;
export const THROW_ARC = 1400;
export const THROW_SWAP = 1300;
export const THROW_TOSS = 1700;
export const THROW_GAP = 100;
export const BREAK_T = 20;
export const BREAK_PUSH = 700;

export const PUSH_MIN = 20;
export const CALM_REFILL = 50;

/** Height (units*1000) where a hit of each level lands, for effects. */
export const LEVEL_Y: Record<string, number> = { H: 3050, M: 2200, L: 600, T: 2200 };
