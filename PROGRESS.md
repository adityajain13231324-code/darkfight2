# UMBRA progress ledger

Canonical spec: [docs/SPEC.md](docs/SPEC.md). Status values: NOT STARTED · IN PROGRESS · IMPLEMENTED · VERIFIED · BLOCKED.
"VERIFIED" means an automated test or an observed run proves it (see VALIDATION.md); a build passing alone is not verification.

| Area | Status | Evidence / notes |
|---|---|---|
| Deterministic 60 Hz integer sim | VERIFIED | determinism + clone tests; 45 s real-relay soak with identical input logs |
| Controls: J attack, K kick, L ranged, U magic, I signature, A+K throw | VERIFIED | systems tests; browser keyboard play |
| Gamepad (5 actions + LB throw) | IMPLEMENTED | not tested with a physical controller |
| Touch controls (stick + buttons) | IMPLEMENTED | not tested on a physical phone |
| Guard rules (neutral/back = high+mid, down-back = low, down only ducks) | VERIFIED | frame-data/geometry tests |
| Hitboxes baked from animation (swept capsules, head/torso/legs hurtboxes) | VERIFIED | bake-sync test; per-move geometry vs hit level |
| Frame data = measured behaviour | VERIFIED | every grounded strike of both fighters measured on hit and block |
| Throws + break, back throw side swap | VERIFIED | systems tests |
| Counter hits 1.2x, earned criticals 1.35x, head 1.15x, cap 1.55x | IMPLEMENTED | damage pipeline in sim; criticals seen in bot play |
| Combo scaling 100/90/80/70/60/50, 350 cap, 7-hit juggle budget | VERIFIED | juggle test |
| Wall splat (once per combo) | IMPLEMENTED | observed in bot matches ("wall" events) |
| Wake-up: rise, back roll, wake-up kick | VERIFIED (roll) | systems test covers the roll |
| Evasive rolls (down + forward/back twice): low profile, roll through | VERIFIED | roll tests: highs whiff, passes opponent, single down-back still guards |
| Sculpted silhouette models (profiled body parts, jaw, heels, fists) | IMPLEMENTED | screenshots inspected; original shapes, not game assets |
| Flip jumps (front/back), roll somersaults, weighted stance bounce | IMPLEMENTED | screenshots mid-flip and mid-roll inspected |
| Meter, magic (500), ranged ammo (3/round), signature cooldown | VERIFIED | systems tests |
| Fighters: Corvin (sword baseline), Lynx (claws, smoke) | IMPLEMENTED | 21 moves each, playable, bot-usable |
| Remaining principal kits (Hermit, Butcher, Wasp, Widow, Shogun, Titan) | NOT STARTED | next content wave |
| Weapon families | IN PROGRESS | 2 of 20 (straight sword, claws) |
| Arenas | IN PROGRESS | 1 of 8 (Ashen Ferry) |
| Local versus, first to 1–5 | VERIFIED | browser match played to results screen |
| Practice bots, 4 difficulties | IMPLEMENTED | full match vs Normal bot completed; reaction ranges per spec |
| Training: dummy modes, hitboxes, frame data, slow-mo, freeze/step, wall resets | IMPLEMENTED | panel exercised in browser |
| Training record/playback (5 slots) | NOT STARTED | |
| Fundamentals course (12 lessons) | NOT STARTED | |
| Online private rooms (relay + rollback, invite link, ready states, rematch) | VERIFIED | two real browser tabs joined and fought; node soak over real relay; simulated 40/100/180 ms tests |
| Public casual, ranked, accounts, replays viewer, spectating | NOT STARTED | replay input logs exist (`confirmedInputs`) |
| Original finished music | NOT STARTED | procedural ambient + SFX are placeholders |
| Settings screen (volume, remap, reduced flash) | NOT STARTED | reduced flash/shake flags exist in code only |
