export type Act =
  | 'idle' | 'walkF' | 'walkB' | 'crouch' | 'dash' | 'backdash' | 'jump' | 'land'
  | 'move' | 'blockstun' | 'hitstun' | 'air' | 'splat' | 'kdGround' | 'getup' | 'roll'
  | 'throwClinch' | 'thrownClinch' | 'throwExec' | 'thrownExec' | 'throwBreak' | 'win';

export interface Fighter {
  fid: string;
  x: number; y: number; vx: number; vy: number;
  facing: 1 | -1;
  hp: number; maxHp: number;
  act: Act; t: number;
  move: string; moveBtn: number; hitDone: boolean; queued: string; airMove: boolean;
  stun: number; crouchStun: boolean; hitLoc: number; heavy: boolean;
  curIn: number; prevIn: number; pressed: number;
  buf: number; bufAge: number; bufDir: string;
  lastTapF: number; lastTapB: number; dashF: boolean; dashB: boolean; jumpDir: number;
  pushRem: number; pushDir: number;
  breakReq: boolean; throwBack: boolean;
  arcFrom: number; arcTo: number; pend: number;
  combo: number; comboDmg: number;       // as attacker
  takenHits: number; takenDmg: number;   // as defender, current combo
  airHits: number; splatUsed: boolean; wallHit: boolean;
  lastFree: number; guard: boolean; ko: boolean; calm: number;
  meter: number; ammo: number; sigCd: number; smoke: number; armorUsed: boolean;
}

export interface Projectile {
  id: number; o: number; kind: string; x: number; y: number; vx: number; life: number;
  dmg: number; level: string; r: number; kd: boolean; hs: number; bs: number;
}

export interface SimEvent {
  type: string; p: number;
  x?: number; y?: number; dmg?: number; level?: string; weight?: number;
  move?: string; value?: number; kind?: string; loc?: number;
}

export interface AdvTrack { att: number; move: string; kind: string; aFree: number; dFree: number; since: number }

export interface MatchOpts {
  mode: 'versus' | 'training' | 'online';
  fighters: [string, string];
  roundsToWin: number;
}

export interface GameState {
  frame: number;
  mode: MatchOpts['mode'];
  roundsToWin: number;
  f: [Fighter, Fighter];
  proj: Projectile[];
  nextProj: number;
  hitstop: number; timer: number; round: number; wins: [number, number]; draws: number;
  phase: 'intro' | 'fight' | 'ko' | 'end';
  phaseT: number; roundWinner: number;
  adv: AdvTrack | null;
  lastAdv: (AdvTrack & { value: number }) | null;
  lastMove: [string, string];
  infiniteHp: boolean; refillMeter: boolean;
  events: SimEvent[];
}
