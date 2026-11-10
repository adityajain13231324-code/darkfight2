# Decisions

1. **Renderer: PixiJS v8 with an authored 2D skeletal rig** (no 3D spike). The spec allows a 2D skeletal pipeline in an existing Pixi project; it keeps the deterministic sim and baker simple.
2. **Collision comes from animation.** Moves are authored as keyframes (anticipation → contact → follow-through → recovery). `npm run bake` samples every tick and stores the attacking edge (a capsule axis, like Gymnast's edge capsules) as integers. The sim reads only baked data; a test fails if art and collision drift.
3. **Sweeps start at the first active tick.** Wind-up motion never hits.
4. **Hit levels are checked against geometry**, not just labels: highs must physically whiff a crouching hurtbox, mids/lows must reach it (tested per move).
5. **Guard:** neutral or back blocks high/mid; only down-back blocks lows; down alone ducks.
6. **No random criticals.** Criticals are earned (precision moves landing in recovery). Counter hit 1.2x, critical 1.35x, head 1.15x, combined cap 1.55x; CH and crit never multiply together.
7. **No slow motion during play.** Only the resolved final KO slows down (spec correction of the old 0.3 s CH slow-mo).
8. **Online: WebSocket relay first, rollback on top** (8-tick window, 2-tick input delay, frame-advantage throttling, 30-tick hashes). Only inputs travel in play. SF2Recomp-style build fingerprint check before matches.
9. **Background tab policy (online):** the sim cannot run while the tab is hidden; the peer waits (rollback window) and a tab hidden for more than 10 s ends the connection on return.
10. **Reference repos are studied, not copied.** Project Eclipse's recovered Nekki code/assets carry no licence and were not imported; only its documentation was read. Structures (attack edges, intervals, hit-reaction categories, fingerprints) were re-implemented with original data.
11. **Smoke concealment** is drawn as a faint ghost on both screens (no invulnerability, reveal on attack/damage/expiry), so it stays fair in same-screen local play.
