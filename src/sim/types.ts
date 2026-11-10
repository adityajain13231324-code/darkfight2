export type Act =
  | 'idle' | 'walkF' | 'walkB' | 'crouch' | 'dash' | 'backdash' | 'jump' | 'land'
  | 'move' | 'blockstun' | 'hitstun' | 'kdAir' | 'kdGround' | 'getup'
  | 'throwClinch' | 'thrownClinch' | 'throwExec' | 'thrownExec' | 'throwBreak' | 'win';

export interface Fighter {
  fid: string;
  x: number; y: number; vx: number; vy: number;
  facing: 1 | -1;
  hp: number;
  act: Act;
  t: number;
  move: string;
  moveBtn: number;
  hitDone: boolean;
  queued: string;
  stun: number;
  crouchStun: boolean;
  hitLevel: string;
  curIn: number; prevIn: number; pressed: number;
  buf: number; bufAge: number; bufDir: string;
  lastTapF: number; lastTapB: number; dashF: boolean; dashB: boolean;
  jumpDir: number;
  pushRem: number; pushDir: number;
  breakLock: boolean; breakReq: boolean;
  arcFrom: number; arcTo: number; pend: number;
  combo: number; comboDmg: number;
  lastFree: number;
  guard: boolean;
  ko: boolean;
  calm: number;
}

export interface SimEvent {
  type: string;
  p: number;
  x?: number;
  y?: number;
  dmg?: number;
  level?: string;
  weight?: number;
  move?: string;
  value?: number;
  kind?: string;
}

export interface AdvTrack { att: number; move: string; kind: string; aFree: number; dFree: number; since: number }

export interface GameState {
  frame: number;
  mode: 'versus' | 'training';
  f: [Fighter, Fighter];
  hitstop: number;
  timer: number;
  round: number;
  wins: [number, number];
  phase: 'intro' | 'fight' | 'ko' | 'end';
  phaseT: number;
  roundWinner: number;
  throwSide: number;
  adv: AdvTrack | null;
  lastAdv: (AdvTrack & { value: number }) | null;
  lastMove: [string, string];
  infiniteHp: boolean;
  events: SimEvent[];
}
