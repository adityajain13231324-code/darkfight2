# Validation report (11 Nov 2026)

## Automated (`npm test`): 35/35 passing
- **bake.test**: committed `baked.json` equals a fresh bake of the animation data.
- **frame-data.test** (26 moves, both fighters): each grounded strike is played against a dummy at a spacing where it connects on its first active tick; measured advantage on block and on hit equals the move table; highs whiff a crouching dummy; mids and lows hit it.
- **systems.test**: A+K throw lands (90 dmg) and A+K breaks it; throws whiff crouchers; launcher juggle adds damage but stays ≤ 350; ranged ammo runs out at 3; magic needs 500 meter; Lynx smoke conceals and is revealed by attacking; back roll moves away.
- **determinism.test**: same 8,000-tick input log → same hash ×3; cloned state continues identically; 12 simulated minutes of random play keep integer positions inside the walls.
- **net.test**: two rollback sessions over a simulated ordered transport for 60 s each at 40/10, 100/25 and 180/40 ms RTT/jitter: no desync, identical confirmed input logs, re-simulated logs hash equal, max rollback ≤ 8.

## Manual / observed
- **Real relay soak** (`tools/net-soak.ts`, localhost relay, +50 ms one-way delay, 20 ms jitter, measured RTT 134–149 ms, 45 s): 2,740 confirmed frames, input logs identical, no desync, max rollback 5 frames, 18 throttle stalls per side.
- **Two browser tabs** (in-app browser) joined room `V46SG` via invite link, both readied, host started, both clients ran the same match with rollbacks and no desync. Tabs were driven in short bursts because background tabs pause rendering; this is not a test of comfortable real-time play.
- **Versus Bot (Normal)**: a full first-to-2 match ran to the results screen with no console errors; counter hits, wall splats and knockdowns occurred.
- **Training**: dummy modes, hitbox overlay (F2), frame data panel and wall resets exercised.
- Screenshots of menu, fight and training were inspected.

## Not verified
Physical gamepad, physical phone/touch, real separate networks or cross-browser engines (only Chromium), 120/144 Hz displays, frame-time percentiles, audio listening quality.
