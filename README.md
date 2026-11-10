# UMBRA — Milestone 1 (feel prototype)

A dark silhouette weapon fighter with Tekken-style rules, in the browser. The full plan is in [MASTER-PROMPT.md](MASTER-PROMPT.md).

## Run it
```bash
npm install
npm run dev
```
Open the printed localhost URL. `npm test` runs the simulation tests, and `npm run build` makes a production build in `dist/`.

## What's in Milestone 1
- **Local Versus** (2 players, one keyboard or two gamepads), first to 2 rounds, 60 s timer.
- **Training** vs a dummy: stand, crouch, guard, auto-guard, jab, or a simple sparring bot. You can make the dummy break throws, turn on hitboxes (F2) and live frame data (F1), reset position (R), and open the move list (H).
- **Corvin** (Moonbite Sabre): 17 moves, including a jab and string, highs, mids, lows, a sweep, a dash lunge, a jumping kick and two throws.
- **Systems:** four limb buttons, Tekken-style blocking (neutral or back blocks high and mid, down-back blocks low), crouching ducks highs and throws, throws with a 1 or 2 break, counter hits, knockdowns and get-up, dash and backdash, an 8-frame input buffer, and hit-stop.
- **Feel:** hit-stop, screen shake, weapon trails, sparks, ink bursts and slow motion on counter hits, KO slow motion, and a coat with spring motion.
- **Ashen Ferry** stage with parallax layers, moon, mist, fog, foreground reeds, film grain and vignette.
- **Procedural audio:** ambient drone, plucks and bells, a frame-drum layer that comes in at low health, and SFX driven by simulation events. Press M to mute.

## Controls
| | P1 | P2 | Gamepad |
|---|---|---|---|
| Move / jump / crouch | WASD | Arrows | Stick / D-pad |
| 1 left hand | U | Num7 or [ | West |
| 2 right hand (sabre) | I | Num8 or ] | North |
| 3 left foot | J | Num4 or ; | South |
| 4 right foot | K | Num5 or ' | East |
| Throws 1+3 / 2+4 | O / L | Num9 / Num6 | LB / RB |

Esc pauses the game.

## Architecture
- `src/sim/` is a deterministic, integer-only 60 Hz simulation with no DOM or Pixi imports. It is ready for rollback, because state is a plain struct you can clone.
- `src/data/fighters/corvin.json` holds all frame data. The sim reads only this data, and hitboxes come from the data, not from the art.
- `src/render/` uses PixiJS v8: a procedural 14-bone rig, silhouettes, the stage and VFX.
- `src/anim/poses.ts` holds the keyframe poses for every move and state.
- `tests/` covers the following:
  - **Frame data:** every move is played against a dummy, and its measured on-block and on-hit advantage must match the table.
  - **Determinism:** 3 runs give the same hash, and a cloned state continues identically.
  - **Lint:** the move rules from the master prompt, section 4.4.
  - **Throws and breaks.**
