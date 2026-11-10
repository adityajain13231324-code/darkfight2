# UMBRA — Master Build Prompt (PvP fighting game)

> Paste this whole file into a coding agent (Claude Code etc.) in an empty folder.
> Build it milestone by milestone. Do not skip the "Done when" checks.

---

## 0. Scope: what this game is and is not
- **IS:** an online-first, 1v1, Tekken-style fighting game in the browser. Player vs player is the whole point: ranked, casual, private rooms, local versus, replays, spectating.
- **IS NOT:** a story game. **No campaign, no acts, no boss ladder, no RPG levelling, no weapon shop, no energy, no ads, no paid power.**
- **Bots exist for practice only:** sparring partners and training dummies. They never give rewards, rating, or unlocks.
- Fighters are chosen, not unlocked with power. Everything that changes stats is identical for both players. Progression is **cosmetic only**.
- Theme: dark silhouette weapon duels in misty painted worlds (see sections 2–3). All fighters, weapons, stages and tracks are **original to UMBRA**.

---

## 1. The pitch and pillars
A dark, atmospheric weapon fighter with the depth of a Tekken-style game: four limb buttons, hit levels, frame advantage, juggles, wall combos, whiff punishing, sidesteps, comeback meters. Black silhouettes, heavy animation, quiet tension.

**Pillars**
1. **Neutral is a duel of spacing.** Poke, whiff-punish, and read. Every swing commits.
2. **Every mistake has a price you can learn.** Frame data is readable and consistent, so punishes are earned, not random.
3. **No luck.** No random crits or random damage. Counter hits are deterministic.
4. **Online must feel local.** Rollback netcode is a feature, not an afterthought.
5. **Easy to start, deep to master.** A 12-lesson course and a full training mode ship at launch.

**Feel words:** grounded, weighty, quiet, dangerous, elegant.

---

## 1A. Research brief (what the genre teaches us)
Distilled from public guides, wikis and developer write-ups on Tekken-style and silhouette weapon fighters. Items are **mechanics and principles**, not content; everything is re-implemented with original names. Sources vary in quality and were cross-checked; the numbers in section 4 are **UMBRA's own tuning**, to be validated in playtests.

**Lessons from Tekken-style design**
- Runs at **60 fps**; moves are described by **startup frames**. The fastest universal attack ("jab") is ~10 frames. Frame data is the main balance tool (patches adjust block and hit advantage to change who wins an exchange).
- **Hit levels** (high / mid / low) and throws form a rock-paper-scissors layer; speed vs safety is the core trade-off (fast moves are often high and duckable, safe moves are slower).
- **Whiff punishing** is the main reward for good spacing: any missed move is punishable until its recovery ends. A slow launcher (above ~15 frames) is hard to land, so startup speed limits how much a mistake costs.
- **Juggles are central.** Launchers lift the opponent and you chain follow-ups in the air. **Walls extend combos** (wall carry and wall splat).
- **Sidestepping** is the main defensive movement: most attacks track poorly, so you step away from linear attacks. Whether a game is "3D" is mostly about sidestep.
- **Comeback mechanics:** low-health boost (Rage) and a once-per-round power state (Heat). Both are readable and limited.
- **2D/2.5D fighters dominate tournament scenes** and are cheaper to simulate deterministically. UMBRA is a 2D-plane game with a visual depth lane for sidesteps.
- **Netcode:** rollback predicts the opponent's inputs and re-simulates when wrong, which hides lag far better than delay-based netcode. Practical designs add a **small fixed input delay (about 1–3 frames)** to limit rollback length, and tune it by ping.
- **Training mode** (frame data, hitboxes, record/playback dummy) is the single most-requested feature in fighting games.

**Lessons from silhouette weapon fighters**
- The look is silhouettes on painted stages; the **animation weight** matters more than the backgrounds.
- A moody, atmospheric score fits and sells the theme.
- Weapon variety was the big draw. Here that becomes **fighter variety**: each fighter is a weapon style with its own full move list.
- Complaints to avoid: imprecise controls, energy gates, freemium pressure, unclear block rules for projectiles and magic.

---

## 2. Visual direction (dark look)
- **Fighters:** pure black silhouettes (#050507) with a faint rim light (1 px, 15% opacity, colour of the stage's key light). Only colour on a fighter: **weapon trails**, **eyes during Eclipse**, **counter-hit flash**.
- **Readability rule:** each fighter has a distinct outline (hat, cloak, hair, plates) so the two silhouettes never merge.
- **Stages:** 4–5 parallax layers, painted look, low saturation. A fog layer between the background and the fighters. One key light per stage.
- **Stage palettes** (everything else desaturated):
  - *Ashen Ferry* — cold teal mist, moonlight, river reeds.
  - *Lantern Steps* — deep indigo night, warm amber lanterns, falling petals.
  - *Bone Quarry* — grey dust, low orange sun, drifting ash.
  - *Drowned Cloister* — green-black water, candlelight, rain.
  - *Iron Hall* — red forge glow, chains, sparks.
  - *Hollow Throne* — void black, violet cracks of light, floating debris.
- **Post-processing:** subtle vignette, film grain (3%), bloom on trails and Eclipse only.
- **Effects:** weapon trails (ribbon mesh, fade 120 ms), hit sparks (white core + stage-colour flecks), **counter hit** = 10-frame freeze, 0.3 s slow-mo at 40%, ink-splash burst, 10% screen flash; **wall splat** = dust burst + cracked-wall decal; **Last Breath** = red vignette pulse; **Eclipse** = pale ring under the fighter and brighter trails.
- **UI:** minimal. Thin HP bars with a delayed ghost bar, brushed-ink frames, serif font (*Cormorant Garamond*) plus *Inter* for numbers. Round pips under each bar.

## 3. Audio direction
- **Music:** slow, atmospheric, mostly ambient: low drones, sparse plucked strings, bowed strings, deep frame drums, wind, distant bells. One loop per stage (90–120 s) with a quiet intro layer and a percussion layer that fades in when either fighter is below 30% HP.
- Generate music **procedurally with WebAudio** (drone + pentatonic plucks + drum pattern per stage) to avoid licensing issues; allow swapping in commissioned tracks later.
- **SFX:** cloth whoosh per swing (pitch by weapon weight), wood/metal/flesh impact layers, block = dull metal clank, counter hit = deep boom + ringing tail, wall splat = crunch, throw break = bright snap, Eclipse = reversed swell.
- Audio is triggered from **simulation events**, not render frames, so it stays correct after rollback (de-duplicate replayed events).

---

## 4. Core combat system
### 4.1 Controls
Four limb buttons (Tekken-style), plus movement:

| Input | Keyboard (P1) | Gamepad |
|---|---|---|
| Move / jump / crouch | WASD | Left stick / D-pad |
| **1** Left hand | U | West |
| **2** Right hand (weapon hand for single-weapon fighters) | I | North |
| **3** Left foot | J | South |
| **4** Right foot | K | East |
| Throw | 1+3 or 2+4 | Shoulder buttons also mapped |
| Eclipse | 3+4 (hold 8 f) | |

- All keys rebindable. Touch is a secondary target: stick + 4 limb buttons + throw + Eclipse; it uses the same simulation and gets no gameplay advantage.
- **Input buffer:** 8 frames for attacks, 4 frames for direction. Simple input leniency: the motion for forward-forward etc. has a 12-frame window.
- **Motion inputs:** use **numpad notation** in the data (e.g. `df+2`, `f,f+3`, `1,2,1`, `d/f+1+2`). Only the following motions exist: tap/double-tap of a direction, hold, diagonal, and button chords. No quarter-circle motions.

### 4.2 Movement
- Walk forward/back, **dash** (double-tap forward/back, 18 f), **jump**, **crouch** (hold down). Crouching dodges **high** attacks.
- **Sidestep (up or down tap):** 20 frames. A temporary visual depth lane shift (no true 3D). Dodges **linear** attacks. **Tracking** attacks hit the side the move says. After the sidestep both fighters are back on the main plane.
- Movement speeds are per fighter (fast ≈ 5.2 u/s, average 4.4, slow 3.6, in units of body width / s).

### 4.3 Hit levels and defence
| Attack level | Blocked by | Dodged by |
|---|---|---|
| High | stand block | crouch, sidestep (if linear) |
| Mid | stand block only (**mids hit crouching players**) | sidestep (if linear) |
| Low | crouch block only | jump, sidestep (if linear) |
| Throw | throw break (1 or 2) | crouch, sidestep, jump |

- **Block (Tekken-style):** standing still or holding back blocks highs and mids; holding down or down-back blocks lows. Walking forward or holding down-forward does not block. Blocking has no meter; chip damage exists only during Eclipse.
- This gives the core high/mid/low triangle: crouching beats highs and throws, mids beat crouching, lows beat standing.
- **Throw:** 1+3 (left throw) or 2+4 (right throw), 12-frame startup, 14-frame **break window**: press **1** to break a left throw, **2** to break a right throw. Breaking a throw results in **0 frames advantage** (reset). Throws beat block; any active attack beats a throw.
- **Whiff punish and block punish** are both guaranteed within the move's recovery.

### 4.4 Frame data rules (the universal contract)
Every move has: `startup, active, recovery, hit level, damage, onBlock, onHit, onCounterHit, tracking, range, pushback, hitstop, properties`.

- **Fastest jab: 10 f** (every fighter has a 10 f jab). Jab on block: **+0 to −1**; on hit: **+8**.
- **Fast mids:** 12–14 f. **Standard launchers:** 15 f or slower. **Heavy launchers:** 18–24 f.
- **Safety rules (enforced by the frame-data lint):**
  - A move's on-block value of **−10 or worse** is punishable by a 10 f jab; **−13 or worse** can be punished by a launcher of that fighter.
  - **At most 20%** of a fighter's moves may be safe launchers on block; there are **no 10 f launchers**.
  - No "always safe, always fast, always long range" move: pick at most two of three.
  - Tracking moves are slower (startup +3 f) than their linear counterparts.
- **Counter hit:** hitting an opponent during the startup of their attack → **+20% damage, +6 hitstun**, and some moves launch. Marked per move.
- **Hit-stop:** light 3 f, medium 5 f, heavy 7 f, counter hit 10 f (both fighters freeze).
- **Screen shake:** scales with damage, max 6 px, decays in 150 ms.
- **Animation commitment:** you cannot cancel recovery except into the defined string follow-ups or a dash cancel marked on the move.

### 4.5 Damage and health
- **Health: 200** for every fighter.
- Typical damage: jab 6–8, mid 12–18, low 8–12, launcher 14–20, throw 25–35.
- **Combo damage targets (no meters):** a launcher punish 30–45 (15–22%), an optimal wall combo up to 65 (about 33%). The damage cap per combo is **75**.
- **Juggle scaling:** 100% for the first hit and the launcher; each further juggle hit ×0.9 (minimum 40%). Wall splat hits ×0.9 too. Only 7 juggle hits per combo.
- **Rounds:** first to 2 round wins in casual, **first to 3** in ranked. 60 s timer; at time-out the higher health % wins; equal = both get the round (draw round).
- **Time-to-kill:** a typical round lasts 25–40 s of competent play.

### 4.6 Juggles, knockdowns and walls
- **Launcher:** lifts the opponent. Gravity and air-time are fixed per launch height. Fighters in the air can be hit by moves flagged `juggle`.
- **Knockdown and wake-up:** after a knockdown the player can quick rise (press up/down/button), roll back/side, or use a **wake-up kick** (low or mid, 14 f, limited to once per knockdown). Oki (wake-up pressure) is a core game.
- **Walls:** every stage has walls at both sides (stage width 22 u). Hitting an airborne or hit-stunned opponent into a wall causes a **wall splat**: 32 f stun and a free follow-up. Wall carry is allowed; there is no ring-out.
- **Crouch state:** `fast crouch` and `power crouch` (cancelling into moves from a crouch) exist; both have fixed frame costs in the data.

### 4.7 Comeback and power systems (both deterministic)
- **Last Breath (rage):** below 25% health: **+15% damage** and the fighter's **Last Breath Art**: one move (20 f startup, armoured against one hit, 40 damage) that can only be used once per round.
- **Eclipse (heat):** one **8 second** (480 f) state per round. Start by pressing 3+4 or via a fighter's Eclipse-engaging move. While active:
  - Marked moves get **Eclipse effects** (extra pushback, tracking, or +frames).
  - Chip damage on block (15% of the move damage).
  - A dash-cancel from marked moves.
- No random meters. Everything is shown on the HUD.

### 4.8 What is deliberately not in the game
Random critical hits, random damage rolls, ranged-projectile spam, a magic meter, weapon swapping mid-fight, stat items, ring-outs, pay-to-win.

---

## 5. Move list data format
- Each fighter is a JSON file: `src/data/fighters/<id>.json`.
- **Target move counts at launch:** 40–55 moves per fighter: 4 basic jabs/pokes, 8 strings (1–4 hits), 8 mids/lows/overheads, 4 launchers, 2 throws plus 2 throw variants, 3 wall carry/splat moves, 4 crouching moves, 2 stance moves, 2 wake-up moves, 1 Last Breath Art, 1 Eclipse move.
- Command notation: numpad (`1,2,4`, `df+2`, `ws+3` for while standing, `cr+1` for crouching), with `~` for a fast cancel.
- Schema (TypeScript, validated at load):
```ts
type Move = {
  id: string; cmd: string; level: 'H'|'M'|'L'|'T';
  startup: number; active: number; recovery: number;
  damage: number | number[];   // array for multi-hit
  onBlock: number; onHit: number; onCH: number;
  tracking: 'none'|'left'|'right'|'both';
  range: number; pushback: number; hitstop: number;
  launch?: { height: number; carry: number };
  wall?: 'splat'|'carry'; ch?: 'launch'|'stun'|'none';
  props?: string[]; // 'armour','duckable','jumpOver','eclipse','lastBreath'
  nextMoves?: { cmd: string; window: [number, number] }[];
};
```
- The sim **only** reads this data; hitboxes and hurtboxes are defined in the frame data, never taken from the art.
- A **frame-data lint** (`tools/lint-moves.ts`) fails the build on any rule in 4.4.

---

## 6. Roster (10 fighters at launch, all playable from the start)
Each fighter = a weapon style with a full move list, a unique **system**, an Eclipse trait and a Last Breath Art. All have 200 HP. Weapons are original.

| # | Fighter | Weapon style | Archetype | Unique system | Eclipse trait | Weakness |
|---|---|---|---|---|---|---|
| 1 | **Corvin** | Moonbite Sabre | All-rounder / tutorial fighter | Clean strings and launchers | Sabre strings gain +frames | No gimmick; honest poke range |
| 2 | **Wren** | Gloamwrap (fists) | Rushdown | 10 f jab spam into 2-way mix-ups | Faster dashes | Short range |
| 3 | **Kestrel** | Twin Daggers | Speed / sidestep | Backflip evades and crit-style CH launches | Dashes become tracking | Lowest damage per hit |
| 4 | **Old Monk Varo** | Reedstaff | Keepout / defence | Long low pokes and a defensive stance | Staff sweeps get pushback | Weak up close |
| 5 | **The Tanner** | Quarry Maul | Power | Armoured heavies (absorb one hit) | Armour on two extra moves | Slow, high startup |
| 6 | **Sable** | Paper Storm Fans | Pressure | Open/closed fan stance toggles | Stance toggles are free | Low damage without stance |
| 7 | **Iron Abbess** | Widowless Glaive | Spacing / whiff punish | Max-range pokes and a low-profile spin | Glaive gets tracking | Poor up close |
| 8 | **Rook** | Rook's Reel (chain-sickle) | Mid-range control | Pull-in on hit and floor chain traps | Pull-in becomes unblockable low | Chain moves slow on whiff |
| 9 | **The Mourner** | Mourning Talons | Attrition | **Wound**: loses 1 HP/s for 5 s after talon hits | Wound stacks twice | Low burst damage |
| 10 | **Hollow King** | Ember Pair (twin axes) | Heavy multi-hit | Long multi-hit strings, armoured launcher | Strings get +chip | Hardest to learn; many −frames |

Silhouette notes: Corvin — long coat; Wren — bare shoulders, wraps; Kestrel — hooded, short cape; Varo — wide hat and robes; Tanner — hunched with apron; Sable — wide sleeves; Abbess — tall helm; Rook — heavy chain coil; Mourner — long hair; Hollow King — crown and shoulder plates.

**Custom cosmetic fighter:** choose silhouette parts, trail colour and weapon skin. Cosmetic only; stats never change.

**Weapon skins:** 3–4 per fighter, **cosmetic only** (no stat differences) so ranked stays fair.

---

## 7. Stages (6 at launch)
- Each stage has a wall on both sides, width 22 u, the same floor height, and no hazards that change gameplay. A stage is chosen by the host in private rooms, random in ranked (from a pool of 3 each).
- Tuned for visual readability: the stage's key light never silhouettes a fighter into the background.
- Palettes in section 2.

---

## 8. Modes
1. **Ranked (online):** first to 3, rating-based matchmaking, random stage, fighter select with blind pick.
2. **Casual (online):** first to 2, quick match with wide rating range.
3. **Private room:** invite link `?room=XXXX`, host picks stage, first-to setting (1–5), optional timer off.
4. **Local versus:** two players on one machine (two keyboards or gamepads), same rules.
5. **Replay and spectate:** deterministic input-log replays (frame-step, speed control, hitbox view); live spectate via the relay with a 10 s delay in ranked.
6. **Training mode:** infinite health option, frame data overlay (startup, on block, on hit), hitbox/hurtbox display, input history, **record/playback dummy** (up to 3 slots), dummy block/crouch/throw-break settings, position reset, **wall and corner reset**.
7. **Sparring (vs bot, practice only):** pick a bot level 1–5. No rating, no rewards, no unlocks, no ranked integration.
8. **Fundamentals course (12 lessons):** movement, jab, block, crouch, throw and throw break, sidestep, whiff punish, launcher and juggle, wall, Last Breath, Eclipse, oki. A tutorial **not** a story: no cutscenes, no characters.

## 9. Practice bots
- Behaviour tree plus per-level reaction time: L1 24 f, L2 18 f, L3 12 f, L4 8 f, L5 6 f. Bots change reaction time and decision quality, never damage or health.
- Bots read only inputs a human could (no reading future frames).
- **Drill bots:** *Block drill* (mixes highs/lows), *Throw-break drill*, *Punish drill* (throws unsafe moves for you to punish), *Pressure drill* (plus-frame strings), *Wake-up drill*.
- Bots can use any fighter from the roster with that fighter's move list.
- Bots can be re-used as sim opponents in the balance tool.

---

## 10. Multiplayer and netcode
- **Rollback (GGPO-style):** save/load state every frame (state is a plain struct, cheap to copy), max rollback **8 frames**.
- **Input delay by measured ping (frames):** 0–100 ms → 1, 101–180 ms → 2, 181+ ms → 3. Show the connection quality icon (green/yellow/red) and the delay in use. The player can raise or lower delay by ±2 in options.
- **Transport:** WebRTC DataChannel (unreliable, unordered) via PeerJS for peer-to-peer. **Fallback:** a WebSocket relay (Node + `ws`) that only forwards inputs (deploy on Render). The client reads the relay URL from `VITE_RELAY_URL`.
- **Inputs only** go over the wire, never state.
- **Desync check:** both peers hash state every 30 frames and exchange it; mismatch → both clients log the frame, save a replay, show a warning, and the match result is void (no rating change).
- **Version lock:** the handshake includes a hash of sim code and move data; clients on different versions cannot be matched.
- **Quality rules:** ranked requires ping under 150 ms and average rollback under 6 frames; otherwise you are matched only in casual.
- **Disconnects:** a 10 s grace to reconnect; leaving a ranked match early counts as a loss.

## 11. Matchmaking and ranking
- **Rating:** Glicko-2. Visible tiers: Ash, Ember, Cinder, Iron, Obsidian, Eclipse, and a Top 100 board.
- **Queue:** by measured region/ping; the rating range starts at ±100 and widens by 50 every 10 s up to ±400; ping cap 150 ms.
- **Server:** small Node service (Postgres or SQLite) for accounts (guest token with optional email sign-in), ratings and leaderboards. The server **never simulates**; it receives the match result signed by both clients; a mismatch voids the result.
- **Anti-cheat:** deterministic sim on both sides means a cheating client desyncs and voids the match. Rate-limit rematches against the same opponent.
- **Fair play:** no stat items and no power progression. Skins and cosmetics never change stats or hitboxes.

## 12. Balance framework
- **Targets:** each fighter 47–53% ranked win rate over time; each matchup 40–60% (some counter-picks are allowed; none above 60%).
- **Tools:** `tools/balance-sim.ts` plays bot-vs-bot (Level 5 and a few scripted strategies) 10,000 matches per matchup; flags any matchup outside 45–55% for review. Bots can't mix up like humans, so this is a **first filter**, not the final word.
- **Live telemetry (privacy-safe):** per-fighter and per-matchup win rates, round length, average combo damage, throw-break rate, Eclipse usage. Reviewed every patch.
- **Patch levers (in order):** startup/recovery frames, on-block frames, damage numbers, hitbox size, hit level. **No hidden stat multipliers.**
- **Patch pipeline:** fighters are JSON so balance patches are data changes plus a version bump; replays record the data version so old replays still play.

## 13. Progression (cosmetic only)
- Matches earn **ink** (soft currency) and **account level** for any mode that has a human opponent (not Sparring and not Training).
- Ink buys **cosmetics only:** trail colours, weapon skins, silhouette parts, stage variants (same layout), emotes, nameplate frames.
- No loot boxes. No paid power. Optional supporter cosmetics are allowed but must also be earnable in play.

---

## 14. Architecture and project structure
- **Stack:** TypeScript + Vite + PixiJS v8 + Howler.js. No other game engine.
- **Simulation:** deterministic, **fixed-point**, 60 Hz, fully separate from rendering. No floats, no `Math.random` in the sim (seeded PRNG only if ever needed), no DOM and no Pixi imports in `sim/`.
- **Rendering:** interpolates between sim states; skeleton animation is driven by the sim state (move id + frame).
```
src/
  sim/        fixed-point math, fighter state machine, move executor, hit detection,
              juggle/wall/knockdown rules, rounds (NO DOM, NO Pixi)
  data/       fighters/*.json, stages.ts, constants.ts
  net/        rollback.ts, transport-webrtc.ts, transport-relay.ts, handshake.ts
  render/     pixi stage, rig renderer, trails, vfx, camera
  anim/       2D skeletal rig, keyframe player, rig editor (dev only)
  audio/      procedural music, sfx bank, event bus
  ai/         bot behaviour trees, drill bots
  ui/         menus, HUD, training overlay, replay viewer, controls (keyboard/gamepad/touch)
server/       relay + matchmaking + ratings (Node, ws, Postgres/SQLite)
tests/        determinism, frame-data lint, balance sim, 2-browser Playwright
tools/        lint-moves.ts, balance-sim.ts, replay-check.ts
```
- **Animation pipeline:** ~14-bone 2D rig shared by all fighters; silhouette parts attach to bones; keyframes as JSON. Build a small **rig editor** (dev route `/editor`) to pose keyframes, scrub frames, and show hitboxes/hurtboxes against the frame data. Hitboxes come from the data, not from the visuals.
- **Camera:** locks to both fighters; zooms in on counter hits and wall splats; never changes the playfield.

## 15. UI/UX
- **Menus:** Play (Ranked, Casual, Private, Local), Training, Sparring, Fundamentals, Replays, Customize, Options.
- **Fighter select:** shows silhouette, weapon, archetype, difficulty, and the full move list with frame data.
- **HUD:** health bars with ghost damage, round pips, timer, Eclipse ring, Last Breath indicator, input display (optional), network indicator.
- **Accessibility:** colour-blind-safe hit-level indicators in training, reduced screen shake and flashes option, rebindable controls, simplified button-assist profile in casual only.

---

## 16. Milestones
| # | Milestone | Done when |
|---|---|---|
| 1 | Feel prototype | Two silhouettes (Corvin mirror), one stage with fog. Buttons 1/2/3/4, block, crouch, high/mid/low, throw and break, hit-stop, trails, frame-data overlay. Local 2P and a dummy. Fun for 10 minutes. |
| 2 | Core systems | Sidestep and tracking, juggles, launchers, walls, counter hit, knockdown and wake-up, Last Breath, Eclipse, rounds, replay, training mode, state hashing. |
| 3 | Netcode | Rollback over WebRTC plus relay fallback, private rooms, input-delay tuner, desync check passing 1000 frames at simulated 150 ms and 2% loss. |
| 4 | Roster A | 5 fighters (Corvin, Wren, Kestrel, Varo, Tanner), 3 stages, bots levels 1–5, frame-data lint green, balance sim running. |
| 5 | Roster B and audio | All 10 fighters, 6 stages, procedural music per stage, full SFX, VFX polish, balance sim in band. |
| 6 | Ranked and meta | Server, accounts, Glicko-2, queue, leaderboards, cosmetics shop, fundamentals course, spectate. |
| 7 | Polish and launch | Gamepad and touch, performance 60 fps on mid-range laptops and phones, load under 3 s, accessibility, Playwright tests green, deploy (Vercel + Render). |

## 17. Tests that must always pass
- Same input log → same final state hash (run 3×).
- Every move matches the frame-data lint (section 4.4).
- Balance sim stays in the allowed band.
- Rollback: 1000 frames with simulated 150 ms and 2% loss end with equal state hashes.
- Two-browser Playwright match completes with no desync, and the replay of that match reproduces the result.

---

**Start now with Milestone 1.** Set up the project, build the sim for one Corvin vs a dummy and local 2P, with the four limb buttons, hit levels, block, throw and break, hit-stop and the frame-data overlay, rendered as silhouettes on Ashen Ferry. Stop for a playtest.
