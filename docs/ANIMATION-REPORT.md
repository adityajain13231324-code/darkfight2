# Animation overhaul report (11 Nov 2026)

Baseline: repo at `a99f966`, 103 tests passing, build clean. After this pass: **150 tests passing**, `tsc` clean, `vite build` clean.

## Files changed and what each fixed

| File | Change |
|---|---|
| `src/content/clips.ts` | **Partial-key semantics fixed.** Previously each key was merged against the stance independently, so any channel a key omitted drifted back to the stance between keys. Now omitted channels HOLD the previous key's value, the first key starts from the stance and the last key resets to it (documented at the top of the file). `ease('in')` is quadratic instead of cubic, which removed 40°+ arm "teleports" in the last quarter-tick of very short wind-ups. |
| `src/content/rig.ts` | Whole-body rotation now blends by the **shortest angular path** (`wrapDeg`), so a 360° roll/flip blending to 0° no longer spins backwards. `solve()` has explicit **ground modes**: `auto` (feet), `body` (rolls), `free` (jumps and air attacks: pelvis follows the sim's root path while legs tuck). Added **two-bone arm IK** (`armIK`) and rig `grip: 'one' / 'two' / 'dual'`. |
| `src/content/bake.ts`, `tools/bake.ts` | Baker uses the same ground mode as the renderer (air moves are baked in `free` mode); `-0` no longer breaks the bake round-trip test. |
| `src/content/types.ts` | `AnimStyle` (idle rate/bounce, guard, intro, win, showcase poses, dual-weapon lag) and extra costume flags. |
| `src/content/fighters/variants.ts` | Rewritten. Each of the six former placeholders now has its **own stance, crouch, guard, intro, victory and portrait poses, idle rhythm, grip type**, and move transforms (heavier anticipation and weight transfer into the blow). |
| `src/content/fighters/corvin.ts`, `lynx.ts` | Their own `anim` personalities. |
| `src/render/posing.ts` | Rewritten: ground-mode selection, facing-relative walk phase, per-fighter guard/win/intro, **lagged second hand for paired weapons**, continuous roll/flip rotation, and `blendTime()` which picks the blend duration **per action pair**. |
| `src/render/renderer.ts` | Walk phase accumulated from real movement (continuous through direction changes, stops and facing flips). Smoothing state is dropped on round reset / teleport. Round-intro "ready" pose. Second trail for paired weapons. Showcase portraits with a **tight crop from real silhouette bounds**. Joint / baked-edge debug overlays. |
| `src/render/figure.ts` | Real **second blade** for paired fighters, two-hand grip drawn with the front hand on the handle, hands with palm + thumb. |
| `src/ui/inspector.ts` (new) | Dev inspector at `?anim=1`: pick fighter/move, play / pause / step / scrub by tick, overlay joints, floor line, baked attack edge and hurtboxes. |
| `tests/animation.test.ts` (new, 47 tests) | Clip key semantics, no angular snaps, rotation continuity, planted support feet, standing ground contact, free-root jumps, render pose equals baked attack geometry, Titan grip, paired second-weapon motion. |
| `tools/debug-move.ts` (new) | Tick-by-tick debug of any move against a standing/crouching dummy. |

## Commands and results

```
npm run bake        -> baked corvin:18 lynx:18 hermit:18 shogun:18 butcher:18 titan:18 widow:18 wasp:18
npx tsc --noEmit    -> clean
npm test            -> Test Files 6 passed (6) · Tests 150 passed (150)
npm run build       -> built in 6.13s
npx vite-node tools/net-soak.ts -- 30 40 15  (real relay, ~40 ms extra one-way delay)
                    -> 1,847 confirmed frames · input logs match · desync -1 on both sides · max rollback 3
```

Browser checks (in-app browser, Chromium): selection screen with new portraits; Titan vs Hermit in training (two-hand grip, paired blades, helmet, hat); forward jump flip mid-air; animation inspector on Titan's `A,A` at its active tick; four random-input bot matches (Titan v Hermit, Butcher v Widow, Shogun v Wasp, Corvin v Lynx, ~2,200 ticks each) with hits, blocks and wall splats and **no console errors**.

## Per-fighter status

| Fighter | Authored for this fighter | Still shared | Next quality gap |
|---|---|---|---|
| Corvin | Full sword kit (21 moves), stance/guard/intro/win/showcase, idle rhythm | — | Hand-tuned timing from live play; more strings |
| Lynx | Full claw kit (21 moves), poses, idle rhythm | — | Smoke tell animation; ranged/magic poses are simple |
| Hermit | Stance, guard, intro, win, showcase, paired-blade motion (second hand follows, trails), weight transfer | Move keyframes come from Corvin's sword kit; **move names** for the two specials are renamed only | Own katana strings (draw cuts, iaido), lightning signature |
| Shogun | Stance, guard, intro, win, showcase, daisho (long + short blade), heavy weight transfer | Corvin sword kit keyframes | Armoured advance, own signature slash |
| Butcher | Hunched stance, guard, intro, win, showcase, paired cleavers, heaviest weight transfer | Corvin sword kit keyframes (a sword swing with cleavers) | Short, brutal chops; ground-quake stomp animation |
| Titan | Two-hand IK grip, stance, guard, intro, win, showcase, weight transfer | Corvin sword kit keyframes | Overhead two-hand cleaves; shield and extending grab |
| Widow | Light stance, fans in both hands, guard, intro, win, showcase | Lynx claw kit keyframes (claw jabs with fans) | Fan sweeps and open/close, teleport |
| Wasp | Low predator stance, guard, intro, win, showcase | Lynx claw kit keyframes | Wall dive, aerial pounces |

## Honest list of what is unfinished or unverified

- **Attack animations for six fighters are still shared** with Corvin's or Lynx's kit (table above). Anticipation height and body-weight lunges differ per fighter, but the swing paths are the base kit's. A fan is still swung on a claw path; a cleaver on a sword path. This is the biggest remaining gap against the brief.
- Titan's front hand can drift up to about 0.3 units off the handle during the extreme overhead wind-up (arm length). It is within 0.06 from the first active tick. Test documents this as a known gap.
- Landing from a flip jump has a small pelvis drop when the ground mode returns from `free` to `auto`; it is eased by the pose blend but not independently verified frame by frame.
- Screenshots were reviewed in session; **no before/after image files or video clips were archived** (the tooling only returns them to me). The inspector (`?anim=1`) lets you scrub any move yourself.
- Not verified: physical phone and gamepad, separate networks, browsers other than Chromium, frame-time profiling, 120/144 Hz displays, hands-on feel at normal speed (all checks were scripted).
- Body drawing is improved (sculpted limb profiles, hands, boots, jaw) but is still a 2D silhouette of polygons and circles, not hand-painted character art.
- The `idle` stance bounce and hit reactions are unchanged in structure; they have not been re-tuned for every fighter.
