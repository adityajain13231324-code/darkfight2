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
12. **Clip keys carry forward.** A key lists only the channels it changes; omitted channels hold, the first key starts at the stance and the last resets to it. (Old behaviour drifted to the stance between keys.)
13. **Visual root vs sim root.** Grounded poses rest the lowest foot on the floor; jumps and air attacks use a fixed pelvis height so the sim's y is the pelvis path and legs may tuck. The baker uses the same mode, so baked edges equal what is drawn.
14. **Render smoothing is presentation only.** Blend times are chosen per action pair and are never read by the sim; contact poses start within ~20 ms and are not blended away.
15. **Second weapon on paired fighters** follows the rear hand a few ticks later and is visual only; damage geometry stays the baked rear weapon.
11. **Smoke concealment** is drawn as a faint ghost on both screens (no invulnerability, reveal on attack/damage/expiry), so it stays fair in same-screen local play.
