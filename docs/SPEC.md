# UMBRA: Combined Master Build Prompt for Claude

Prepared 10 November 2026. Consolidated from the user's UMBRA MASTER-PROMPT and the researched Shadow-Fighter master prompt. This is the canonical merged specification.

## How to use this file

Give this entire file to Claude Code or another coding agent with a filesystem, terminal, and browser testing tools. Use the launch instruction below. The source prompts are reference documents, not additional instruction layers: use this consolidated version alone.

This is a build specification, not an already built game or a guarantee of one-message completion. A project of this scope requires iterative implementation, original assets, tuning, and real human testing. The milestones below organize that work without silently reducing the final scope.

## Claude launch instruction and working contract

You are implementing UMBRA as a senior gameplay programmer, technical artist, audio implementer, and multiplayer engineer. Build the game described in this file in the current workspace. This is an implementation request, not a request to restate the plan.

First inspect the repository and its applicable instructions. Preserve existing useful work and unrelated user changes. If the repository is empty, create a runnable project. Briefly explain the chosen renderer and the first concrete deliverable, then implement it. Start with a complete small fight loop and deterministic simulation. Continue through the milestones without treating the first prototype as the finished product.

Keep PROGRESS.md, DECISIONS.md, CONTENT-MANIFEST.json, and VALIDATION.md current. Record tested facts separately from intended behavior. Use checkpoints and a concise HANDOFF.md when context runs short. Do not restart the project because a session changes. Read the handoff, inspect current code, and continue.

Ask only when a missing requirement materially changes the product, credentials are necessary, or an action needs approval. Do not claim tests, sounds, images, devices, or network paths were checked unless they actually were. Do not invent a hosted URL. Do not silently replace original art with generic placeholders at completion. A blocked asset or service must be identified specifically while independent work continues.

### Canonical choices resolved in this merge

| Topic | Decision |
|---|---|
| Identity | UMBRA, an original presentation with researched Shadow Fight-style boss archetypes and weapon feel |
| User experience | 1v1 only; online and local human play; bots only for practice |
| Combat plane | Side-view 2D combat; no simulated depth-lane sidestep in the core game |
| Inputs | Directional weapon attack, kick, ranged, magic, and signature; not mandatory four-limb Tekken controls |
| Depth | Spacing, hit levels, frame advantage, counter hits, throw breaks, bounded juggles, wake-up choices, and wall pressure |
| Health / timer | 1,000 nominal health, explicitly budgeted character variation; 99-second default timer |
| Randomness | No random damage or random criticals in competitive Signature Duel |
| Weapons | Real weapon-family and compatible-loadout variety; cosmetic skins are tracked separately |
| Roster | Keep the main boss-inspired target and expanded reference roster; retain UMBRA's ten original concepts as a distinct additional design pool |
| Online | Private rooms first, then public casual and server-validated ranked; replay and spectating included |
| Art pipeline | One renderer after a bounded quality spike; do not mix an incompatible 2D and 3D animation pipeline |
| Music | Original finished music with procedural audio as an optional implementation method, not an automatic quality shortcut |
| Progression | All combat options available; optional cosmetic rewards never gate fighting |
| Power states | Character signatures are core. Eclipse and Last Breath are experimental custom rules until separately approved through playtests |

The attached UMBRA prompt is not evidence that the user abandoned boss-inspired characters or wanted a literal Tekken clone. These decisions preserve the user's explicit requests while incorporating the strongest additions. If the owner later changes one, update the decision table and dependent rules together.

### Non-negotiable first-run experience

A visitor can reach a bot practice match or local versus without an account. An online private room uses an invite link and clear ready states. Character selection describes the fighting style. A rematch takes a few seconds. A loss is understandable and the trainer can reproduce the situation. No story cutscene, shop, level requirement, or energy timer delays a duel.

## 1. The user's final requirements take precedence

Build a polished, browser-based, side-view, 1v1 fighting game for PC first, with mobile support. It should closely evoke the dark silhouette presentation, deliberate martial arts movement, weapon variety, impact, and atmosphere of Shadow Fight 2.

The structure is a match-focused roster fighter, like the character selection, versus play, rematches, and practice depth the user associates with Tekken. This does not mean importing Tekken's 3D sidestepping, four-limb input system, or exact mechanics.

Required play:

- Human versus human on the same device.
- Human versus human online, including private invite rooms.
- Human versus bot for practice and casual matches.
- A proper training room with configurable dummy behavior.
- Exactly two active fighters per match.

There is NO campaign, story, quest map, RPG leveling, equipment grind, energy system, gameplay shop economy, raid mode, cooperative battle, survival progression, or boss unlocking through story. Previous planning that included those is superseded. Bosses are playable roster characters, not campaign encounters. All completed characters and competitive loadouts are immediately available.

Research references to campaign and Underworld describe where characters originated. They do not authorize building those modes.

Deliver an actual runnable game with source, assets, build instructions, tests, and a truthful validation report. Do not stop at a landing page, design document, character grid, scripted combat video, or generic two-stick-figure demo.

## 2. Product identity and visual priorities

Use UMBRA as the working title. Treat Shadow Fight 2 as the reference game. Keep reference character names in the design catalogue; author original code, animation, artwork, recordings, and music. Do not extract proprietary asset bundles or present the project as an official Nekki release. Resolve branding and character asset permissions for a direct branded public release; keep names and art mappings configurable so this does not block combat engineering.

Priority order:

1. Responsive and comprehensible fighting.
2. Excellent full-body animation and matching collision.
3. Distinct characters and weapon styles.
4. Dark, atmospheric, readable art and satisfying audio.
5. Reliable local and online 1v1.
6. Large, well-tested roster and arsenal.

Dark means dramatic lighting and restrained colors. It does not mean black fighters disappearing into black scenery.

## 3. Research boundaries and source handling

Evidence labels used here:

- **Reference:** a compact fact supported by the linked source.
- **Design:** an original proposed adaptation for this game.
- **Verify:** a detail not established reliably enough to claim exact fidelity.

Public wikis disagree on some raid health, shields, timers, and player counts, sometimes within the same page. Their automatic question summaries can also contradict the main article. Do not copy such values into the game. Lore descriptions are not evidence of an actual usable combat move. Do not import mechanics from Shadow Fight 3, Arena, Shades, private servers, or Definitive Edition mods without identifying them as separate inspirations.

This research covers the seven principal bosses, fourteen permanent raid roster references, five Act VII mini-bosses, the principal challenger and bodyguard groups, and twenty documented seasonal raid identities. It is not a certified exhaustive catalogue of every historical or newly released event variation. Some event kits and exact animation timings remain verification tasks. Never describe these gaps as already researched or tested.

Use official promotional imagery and genuine gameplay to refine proportions and motion. The original [Nekki trailer](https://www.youtube.com/watch?v=hVy58hG30zM), [Google Play listing](https://play.google.com/store/apps/details?id=com.nekki.shadowfight), and [Nintendo screenshots](https://www.nintendo.com/fr-fr/Jeux/Jeux-a-telecharger-sur-Nintendo-Switch/Shadow-Fight-2-1439834.html) are reference entry points. This document does not claim frame-by-frame measurement of that footage or a listening analysis of the full soundtrack.

## 4. Full product scope and counts

The final target is:

- Seven principal boss-inspired playable kits, plus a flexible baseline fighter.
- Fourteen permanent Underworld-inspired kits, adapted for fair duels.
- Additional story, challenger, bodyguard, and documented event characters through tracked content waves.
- Twenty weapon production families, with distinct substyles where the silhouette or motion demands them.
- At least 100 selectable weapon items in the full arsenal. Cosmetic variants must be labeled cosmetic and cannot be counted as 100 unique movesets.
- Eight fully realized arenas initially, with further arena themes for expanded roster waves.
- Local versus, online private versus, public casual, ranked, bot practice, training, a fundamentals course, replays, spectating, settings, and a move guide.

All characters use the same fair duel rules. No player receives raid health, permanent immunity, unavoidable full-screen damage, or campaign power multipliers.

A content manifest must distinguish planned, implemented, visually verified, gameplay verified, and competitively reviewed entries. A selectable card with no functioning distinct kit is not an implemented character.

## 5. Main roster reference and playable specifications

Reference identities: Lynx uses claws and concealment; Hermit uses swords and lightning; Butcher uses cleavers and a ground quake; Wasp uses a naginata and wall-assisted flight; Widow uses fans and teleportation; Shogun uses paired swords and guard assistance; Titan uses an enormous sword. These concise identities are documented in the [boss reference](https://shadowfight.fandom.com/wiki/Bosses_%28SF2%29).

All numbers and adaptations below are DESIGN values to tune, not original-game statistics.

### Baseline fighter

Purpose: teach the shared rules and provide an honest all-rounder. Standard 1,000 health, medium movement, clear unarmed tools, no hidden damage bonus. Its neutral weapon profile is a straightforward sword. It may access all compatible families in custom-loadout play. Do not make it a superior version of every specialist.

### Lynx: assassin pressure

- Visual: compact fighter, recognizable claw silhouette, controlled smoke, muted blue-gray accent.
- Rhythm: fast approach, short strings, deliberate escape; weak at sustained long range.
- Signature: smoke concealment, initially 90 simulation ticks maximum, with faint displacement and audible movement. Reveal on attack, damage, or expiry. No invulnerability.
- Secondary identity: marked strike followed by a delayed, clearly displayed small blast. One active mark per target; no recursive explosions.
- Counterplay: intercept approach, track movement, punish the concealment startup or committed claw finisher.
- Start testing at 950 health and a 12-second ability cooldown. Avoid stacking stealth, guaranteed criticals, and bombs into one unavoidable opening.

### Hermit: disciplined magic specialist

- Visual: tall hat and robe silhouette, compact paired blades, restrained lightning color.
- Rhythm: control distance, discourage careless approach, lose advantage when rushed successfully.
- Signature: stationary meditation channels marked lightning strikes. Initial tell at least 24 ticks; clearly show where each strike will land.
- Channel is interruptible. At most two strikes in one activation; no free full-screen tracking after commitment.
- Counterplay: move out of marks, interrupt before activation, punish the exit recovery.
- Initial baseline: 1,000 health; channel consumes most of the ability meter. Basic magic and signature lightning do not refill each other indefinitely.

### Butcher: heavy close-range bully

- Visual: broad torso, paired cleavers, grounded stance, dusty red-brown effects.
- Rhythm: threatens short-range punishment and knockdown, vulnerable to missed swings.
- Signature: jump or raised stomp into a ground shock. The tell precedes the impact and airborne opponents evade the ground component.
- Bleed is capped and cannot trigger another bleed proc by itself.
- Counterplay: bait the stomp, jump at the correct time, punish long recovery.
- Initial baseline: 1,075 health, slower walking; do not combine extra health with universally safe heavy attacks.

### Wasp: mobile polearm specialist

- Visual: narrow spear profile, distinct head silhouette, brief wing-shaped effect only during signature motion.
- Rhythm: maintain polearm distance, exploit arena-edge positioning.
- Signature: one wall-assisted diagonal dive with an obvious takeoff. Path locks after launch.
- A missed dive has significant landing recovery. The wall is a requirement, not a free teleport destination.
- Counterplay: duck or roll through the defined lane, deny the wall, punish landing.
- Initial baseline: 950 health. Every arena must support the same legal wall-dive geometry.

### Widow: evasive fan duelist

- Visual: fan blades, flowing but controlled fabric, cold muted violet and snow-blue effects.
- Rhythm: whiff punishment and carefully timed repositioning.
- Signature: short teleport with both departure and destination tells. Auto-facing rules must be defined and tested so it cannot create an unreactable unblockable.
- Limited healing only from confirmed damage, never from blocked attacks or damage-over-time recursion.
- Counterplay: read the destination tell, guard or intercept, punish a missed follow-up.
- Initial baseline: 950 health; lifesteal cap of 60 health per round as a first experiment.

### Shogun: disciplined sword pressure

- Visual: layered armor silhouette, helmet crest, long and short blades, ember-gold accent.
- Rhythm: measured pressure with strong punish tools and limited escape options.
- Signature adaptation: a brief spectral slash on a marked lane, replacing an independently fighting summoned bodyguard. Only two active fighters exist.
- Assist effect shares the owner's combo scaling and cannot hit during an otherwise guaranteed throw lock. No multiple simultaneous assists.
- Counterplay: see the lane marker, block or evade according to the move's explicit rule, punish the summoner's commitment.
- Initial baseline: 1,025 health, moderate speed, high resource cost for the spectral strike.

### Titan: exceptional-size heavy fighter

Reference: Titan also has an extendable arm, a mind-based throw, and a recharging shield; these are documented in his [individual profile](https://shadowfight.fandom.com/wiki/Titan_%28SF2%29). His original encounter is not a fair competitive character template.

- Visual: towering armored silhouette, cables, giant blade, heavy planted motion.
- Use a dedicated rig, collision profile, and throw reactions. Prototype him early.
- Signature: a clearly visible single-hit shield with long recharge; it cannot regenerate while being continuously pressured.
- Extendable-arm grab has a long tell, a visible collision path, limited reach, and major recovery on miss. It is not an automatic hit at distance.
- Replace permanent stagger immunity with brief move-specific armor. Armor does not mean immunity to throws or all damage.
- Counterplay: bait the shield, punish recovery, attack predictable gaps, exploit slow repositioning.
- Initial baseline: 1,100 health, slow movement. Test 1.2-1.35 times normal visual height before choosing the competitive scale. Do not preserve extreme reference size if it destroys fair matchups.

## 6. Permanent Underworld roster: reference facts and duel conversion

These characters become normal playable 1v1 fighters. Do not implement raid shields, raid keys, shared boss health, or raid consumables. Equipment mappings are documented in the [Underworld catalogue](https://shadowfight.fandom.com/wiki/Underworld?page=4). Detailed mechanics should favor the linked individual profiles over generic lore descriptions.

| Character | Reference equipment / mechanic | Proposed duel identity and counterplay |
|---|---|---|
| [Volcano](https://shadowfight.fandom.com/wiki/Volcano) | Ornamental Sabers; teleportation | Fire-accented advancing swords; interruptible teleport and punishable reappearance |
| [Megalith](https://shadowfight.fandom.com/wiki/Megalith) | Coral Prickles; aggressive close combat | Stone brawler; short move-specific armor with throwable gaps, not permanent armor |
| [Fungus](https://shadowfight.fandom.com/wiki/Fungus) | Two-handed Cudgel; earthquake | Slow reach and stomp timing; evade grounded shock and punish misses |
| [Vortex](https://shadowfight.fandom.com/wiki/Vortex) | Silver Glaive; Water Ball | Aquatic spacing specialist; reach advantage offset by close-range recovery gaps |
| [Fatum](https://shadowfight.fandom.com/wiki/Fatum) | Grim Scythe; invisibility | Long-range ambush fighter; readable concealment and slow committed sweeps |
| [Arkhos](https://shadowfight.fandom.com/wiki/Arkhos) | The Sting; rat wave | Spear and grounded wave; interrupt startup or jump the lane |
| [Hoaxen](https://shadowfight.fandom.com/wiki/Hoaxen) | Harrier Hooks; tentacle soul extraction | Mid-range trap fighter; telegraph tentacle lane and limit follow-up stun |
| [Karcer](https://shadowfight.fandom.com/wiki/Karcer) | Hunger Sickles; Hunger Spikes | Aggressive sickles with a clearly marked spike zone; exact reference timing requires measurement |
| [Drakaina](https://shadowfight.fandom.com/wiki/Drakaina) | War Shuang Gou; spinning charge | Committed advancing special; retreat or interrupt during the declared vulnerable window |
| [Tenebris](https://shadowfight.fandom.com/wiki/Tenebris) | Claws; charged beam | Control space with a visible beam tell; limited meter and long whiff recovery |
| Gatekeeper | Pneumo Fists | Piston brawler with a charged punch; special encounter behavior not verified here |
| Saturn | Electro Batons | Electrical baton duelist; proposed marked electrical zone, not a claimed exact reference ability |
| [The Blackness](https://shadowfight.fandom.com/wiki/The_Blackness) | Sharp Claws; hand-shaped dark wave | Rear-lane threat with a visible marker and an escape route |
| [Stalker](https://shadowfight.fandom.com/wiki/Stalker) | Insectile Claws; wall flight | Predatory wall movement; limited poison and punishable landing |

Important corrections: Megalith's earth-themed lore does not establish a special earthquake attack; Fungus has the documented stomp. Vortex's aquatic lore does not establish a unique flood special. The reviewed Vortex profile explicitly describes no special ability. New powers for these characters must remain labeled adaptations.

Every final kit needs a stance, 8-12 meaningful weapon actions, shared movement/kicks, a signature, readable weakness, bot behavior profile, palette, sound cue, and matchup tests. Most kits should have one signature rather than several independent mechanics.

## 7. Other characters and event research register

### Story-origin characters without a story mode

The [mini-boss reference](https://shadowfight.fandom.com/wiki/Mini-bosses) identifies Cypher, Cronos, Ancient, Shroud, and May. Include them in the expanded roster plan. Their detailed moves and equipment require individual verification before fidelity claims. Design direction: Cypher as a technical fighter, Cronos as an armored bruiser, Ancient as a measured specialist, Shroud as an evasive duelist, and May as a fast technical fighter. These role assignments are proposals, not sourced movesets.

[Old Wounds](https://shadowfight.fandom.com/wiki/Old_Wounds_%28SF2SE%29) supplies Young Sensei and Prince as further reference candidates. Treat Young Sensei as a martial-arts specialist and Prince as a separate future kit only after a combat reference check. Do not build their story.

Bodyguards can use shared family animation but need distinct loadout or behavior to justify separate competitive slots. The reviewed [bodyguard catalogue](https://shadowfight.fandom.com/wiki/Bodyguards) includes Shin, Brick, Needle, Ghost, and Dandy for Lynx; Titan's named guard group includes Assassin, Master, Guru, Corsair, and Emperor. May is tracked separately to avoid inconsistent bodyguard counts. Complete the remaining bodyguard inventory during the expansion audit rather than inventing details.

Challenger references: Trickster, Hawk, Rose, Fisher, Outcast, Ronin, and Nova. They provide useful nunchaku, polearm, katana, staff, chain-weapon, heavy-blade, and fist-weapon reference coverage. [Weapon ownership reference](https://shadowfight.fandom.com/wiki/Weapon_%28SF2%29)

### Seasonal roster

The following twenty names are documented in the [event roster](https://shadowfight.fandom.com/wiki/Underworld?page=4). Event year matters: recurring names can use different equipment or rules. This table is a scoped research register, not a claim that all historic event variants have been exhaustively measured.

| Character | Established reference or current evidence limit | Proposed conversion |
|---|---|---|
| Whisper | [Death's Jaw](https://shadowfight.fandom.com/wiki/Death%27s_Jaw) and [Dark Blood Magic](https://shadowfight.fandom.com/wiki/Dark_Blood_Magic) are documented associations | Fast blades and a limited blood projectile |
| Morgana | [Pain and Panic](https://shadowfight.fandom.com/wiki/Pain_and_Panic) and [Force Ray](https://shadowfight.fandom.com/wiki/Force_Ray) documented for specific appearances | Sickles with a clearly marked descending beam |
| [Countess](https://shadowfight.fandom.com/wiki/Countess) | Winged Darkness' Claws; teleportation documented for her 2019 version, later rules differ | Long-arc weapon specialist with a telegraphed teleport; verify the actual weapon class rather than inferring it from the name |
| Banshee | Halloween roster identity verified; detailed kit unresolved | Reserve slot; verify before assigning mechanics |
| [Freeze](https://shadowfight.fandom.com/wiki/Freeze) | Ringing Spruce Whirl; Ice Pins and earthquake listed | Ice-themed glaive control; short slow effect, never indefinite freeze |
| [Candy](https://shadowfight.fandom.com/wiki/Candy) | Surprise Waffles; teleportation and Ice Pins listed | Deceptive paired-weapon pressure with limited repositioning |
| [Son of Heaven](https://shadowfight.fandom.com/wiki/Son_of_Heaven) | Shuang Gou; invisibility and lightning storm listed | Hook-sword duelist with a single selected signature |
| [Ravana](https://shadowfight.fandom.com/wiki/Ravana) | Ravana Hands and earthquake listed | Distinct unarmed heavy-pressure fighter |
| Adanti | Event identity verified; exact equipment and timings need stronger verification | Reserve brawler role; do not use power-scaling fan sites as frame data |
| Freeze Jr. | [Snowpiercer](https://shadowfight.fandom.com/wiki/Snowpiercer) documented for a New Year version | Knife specialist; any time effect must preserve an opponent response window |
| [Puppeteer](https://shadowfight.fandom.com/wiki/Puppeteer) | Former Ascension character and later Halloween opponent | Future control specialist; detailed combat reference pending |
| [Shurale](https://shadowfight.fandom.com/wiki/Shurale) | Beast's Fury, Death Grip, frostbite-themed rule | Claw pressure with limited frost buildup |
| [Rakshasa](https://shadowfight.fandom.com/wiki/Rakshasa_%28SF2%29) | Rage of Indra; edition/year-dependent absorption or electricity details | Heavy mace specialist; one readable resource interaction |
| [The Lamb](https://shadowfight.fandom.com/wiki/The_Lamb) | Recurring Ritual Battles identity with changing event themes | Verify selected year before defining a kit |
| [Wolf Wind](https://shadowfight.fandom.com/wiki/Wolf_Wind) | Sabres and teleportation; equipment changes by appearance | Wind-accented saber fighter with limited displacement |
| [Architect](https://shadowfight.fandom.com/wiki/Architect) | Equipment/ability changes across phases; appearances differ | Select two preset stances, never uncontrolled random access to the entire roster |
| [Son of the Sun](https://shadowfight.fandom.com/wiki/Son_of_the_Sun) | Fans and Wrath of Flame listed | Fan spacing with a telegraphed flame cast |
| [Dandy](https://shadowfight.fandom.com/wiki/Dandy) | Separate bodyguard and raid versions; raid lightning strike | One roster character with versioned loadouts, not duplicate counted content |
| [Faradeya](https://shadowfight.fandom.com/wiki/Faradeya) | Sickles, Dark Wave, and Embrace of Darkness documented | Sickles with a rear-origin wave; mark its lane and cap follow-up damage |
| [Berstuuk](https://shadowfight.fandom.com/wiki/Berstuuk) | False Gods, invisibility, Potion of Roots listed | Sickles with a visible root trap; cap immobilization duration |

Also audit historical challengers Festivus and Lilith separately from raid bosses. [Nrityu](https://shadowfight.fandom.com/wiki/Nrityu) is documented as an event-playable character in Destiny in Red and belongs in the expanded playable-character audit, not the boss count. Do not assign every character a seasonal costume or a slot simply to inflate the roster. First complete distinct kits; cosmetic overlap can become skins.

### UMBRA's original fighter design pool

Retain these original names and silhouette concepts from the supplied UMBRA prompt. They are not established Shadow Fight characters and do not replace the seven requested principal boss archetypes by accident. Use a manifest field to distinguish original kits, reference-inspired kits, and skins. When two concepts overlap substantially, propose a deliberate consolidation in DECISIONS.md instead of counting the same moves twice.

| Original concept | Weapon / silhouette | Proposed mechanical purpose | Constraint |
|---|---|---|---|
| Corvin | Moonbite Sabre; long coat | Straightforward all-rounder; candidate baseline presentation | No universal advantage at every distance |
| Wren | Gloamwrap fists; bare shoulders and wraps | Close pressure and throw mix | Short reach and punishable approach |
| Kestrel | Twin daggers; hood and short cape | Evasive whiff punishment | Side-plane evasions only; no untelegraphed lane dodge |
| Old Monk Varo | Reedstaff; wide hat and robes | Defensive stance and keepout | Weakness when successfully crowded |
| The Tanner | Quarry Maul; hunched apron silhouette | Deliberate heavy punishment with brief armor | Visible commitment; armor cannot stop everything |
| Sable | Paper Storm Fans; broad sleeves | Open/closed fan stance | Stance changes have declared costs and recovery |
| Iron Abbess | Widowless Glaive; tall helm | Maximum-range spacing | Close-range and missed-poke vulnerability |
| Rook | Rook's Reel chain-sickle; chain coil | Mid-range pull-in setups | No unblockable tracking pull into guaranteed infinite pressure |
| The Mourner | Mourning Talons; long hair | Modest wound pressure | Capped damage-over-time, no endless refresh loop |
| Hollow King | Ember Pair axes; crown and plates | Committed multi-hit offense | Gaps and negative recovery remain meaningful |

The supplied UMBRA document's ten-fighter target is a release-scale milestone, not a cap on the user's broader roster ambition. Corvin can supply the original baseline presentation. Complete the seven main reference-inspired kits and two additional originals for an initial ten-character milestone, then expand as specified. Record exact IDs and count unique playable kits, not aliases.

Cosmetic customization may swap silhouette parts, weapon skins, trail accents, and nameplates within readability limits. It never changes reach, hitboxes, timing, character size, or effect visibility.

## 8. Weapon design and reference catalogue

The [weapon-class reference](https://shadowfight.fandom.com/wiki/Weapon_%28SF2%29/Weapon_Classes) explains that many items share a base style and may differ chiefly in special attacks. Preserve that practical distinction.

Twenty production families, including the unarmed baseline:

| Family | Required tactical difference | Starting reach / commitment |
|---|---|---|
| Unarmed | Throws, kicks, movement, close counters | Short / low-medium |
| Knuckles and katars | Fast pressure with tight spacing | Very short / low |
| Knives and daggers | Quick cuts, evasive recoveries | Short / low |
| Sai | Precise thrusts and controlled interruption | Short / medium |
| Paired batons and maces | Compact impact and stagger | Short-medium / medium |
| Tonfas | Close guard pressure and directional coverage | Short / medium |
| Nunchaku | Linked momentum and punishable sequences | Medium / medium |
| Straight sword | Honest general-purpose neutral tools | Medium / medium |
| Katana | Strong punish attacks and committed precision | Medium-long / medium-high |
| Daisho | Paired-blade sequences and stance identity | Medium / medium |
| Dual blades and sabres | Advancing strings and broad arcs | Medium / medium |
| Hook swords | Distinct hooking paths and special sequence | Medium / medium-high |
| Claws and sickles | Aggressive close pressure, different special substyles | Short / low-medium |
| Paired axes and cleavers | Strong hits, deliberate recovery | Short-medium / high |
| Staff | Sweeps, checks, reach control | Long / medium |
| Spear and naginata | Thrust lanes and close-range vulnerability | Long / high |
| Double-ended glaive | Rotational arcs and space coverage | Long / high |
| Kusarigama | Extended chain paths and setup commitment | Variable-long / high |
| Two-handed heavy weapons | Large punish damage and visible weight | Medium-long / very high |
| Exotic systems | Fans, transforming blades, piston fists, hybrid weapons | Individually authored substyles |

The twentieth family is a production bucket, not one shared moveset. Fans, composite blades, rifles used in melee, and giant swords require their own support. Titan's sword belongs to a dedicated large-rig substyle. Never animate every exotic as the same sword with a different texture.

Reference item sampling, grouped for research rather than exact unlock order:

- Early and conventional: Knives, Knuckles, Sai, Steel Batons, Ninja Sword, Machetes, Daggers, Crescent Knives, Tonfas, Staff, Krises, Swords, Steel Nunchacku, Stilettos, Heavy Staff, Axes, Steel Claws, Oriental Sabers, Yari.
- Mid and advanced: Butterfly Swords, Labryses, Golden Katana, Maces, Glaive, Kusarigama, Sickles, Moon Sabers, Two-handed Mace, Staff of Night, Magari Yari, Silver Glaive, Dadao, Battle Hammers, Northern Hammer, Silver Spear, Katars, Trident, Blade Tonfa, Daisho, Keen Katana.
- Distinctive references: Blood Reaper, Imhotep Pounders, Harrier Hooks, Shuang Gou, The Sting, Grim Scythe, Devastator, Sapphire Fang, Pharaoh's Khopeshes, Two-handed Cudgel, Coral Prickles, Composite Sword, Plasma Rifle, Flame Clubs.

This is a representative selection, not the complete original arsenal. Consult the [full item catalogue](https://shadowfight.fandom.com/wiki/Weapon_%28SF2%29) and [older class catalogue](https://shadowfight2.fandom.com/wiki/Weapon_Classes) for remaining items and alias checks. Older names such as Pneumatic Fists versus Pneumo Fists must not create duplicate entries.

Special content references include [Pneumo Fists](https://shadowfight.fandom.com/wiki/Pneumo_Fists), [Wolf's Grin](https://shadowfight.fandom.com/wiki/Wolf%27s_Grin), [Beast's Fury](https://shadowfight.fandom.com/wiki/Beast%27s_Fury), [Rage of Indra](https://shadowfight.fandom.com/wiki/Rage_of_Indra), and [False Gods](https://shadowfight.fandom.com/wiki/False_Gods). Research unusual weapons individually before implementing their special motion.

For every weapon item record: stable ID, reference name, display name, family, substyle, compatible rigs, reach, timing profile, special move, effect eligibility, art source, verification status, and whether it is cosmetic or mechanically distinct.

A mechanical variant must document its tradeoff. Extra reach costs recovery or close-range effectiveness. Extra speed costs damage or coverage. Pure cosmetics have identical combat values.

## 9. Character equipment policy

Provide two clearly separated rulesets:

1. **Signature Duel:** each character has a curated signature weapon, passive, and ability. Primary online and balance ruleset.
2. **Custom Duel:** choose compatible weapons and a limited preset effect loadout. Available in local and private online matches and bot practice.

Both players see the ruleset before accepting the match. No hidden statistical equipment upgrades. Equal access to all completed options. Armor and helmets are cosmetic in Signature Duel; any Custom Duel modifiers come from a fixed point budget and must be visible.

Do not support every character/weapon combination by pretending incompatible animations work. A disabled combination explains why and offers compatible choices. A compatible custom weapon can suppress a signature that depends on the original equipment.

## 10. Combat and control contract

Use side-view movement in one combat plane. No free depth movement. Facing flips only under explicit conditions; no sudden turns during committed attacks.

Keyboard defaults: WASD or arrows for direction, J attack, K kick, L ranged, U magic, I signature, Escape pause. Remapping is mandatory. Controller has directional movement plus five actions with clear prompts. Mobile uses a directional pad and clustered attack/kick buttons, with smaller ranged/magic/signature buttons.

Input rules:

- Distinguish press, hold, release, double tap, and direction-plus-action.
- Start with a four-tick input buffer; adjust from tests.
- Back and forward are relative to facing, while raw input records remain unambiguous.
- Provide a close-range throw input, such as forward plus attack and kick together, with a defined priority over individual attacks.
- No simultaneous conflicting inputs may execute two moves from one fighter in the same tick.
- Handle opposite directions consistently, including keyboard plus controller conflicts.
- Clear held input on focus loss and device disconnect.

Movement and common actions: idle, walk, step, crouch, jump, roll, quick retreat, punches, directional kicks, sweep, aerial kick, front/back throws, knockdown, get-up, victory, defeat.

Prototype automatic guard while grounded and eligible in neutral, facing the opponent. Moving forward, attacking, recovery, airborne states, and rolls have declared guard behavior. Test high/mid/low defense as an explicit ruleset; do not assume every duck blocks all attacks. Publish the final rule in the tutorial.

Each family gets neutral, advancing, retreating/spinning, high, low, heavy, and special attacks, with selected follow-ups. Avoid dozens of redundant moves. Every move must answer: when should I use this, and what happens if I am wrong?

### 10A. Defense rules, throw breaks, and frame-data correctness

Resolve the guard prototype into one tested competitive rule before content expansion. The initial canonical test uses automatic neutral standing guard when eligible, plus holding back to guard deliberately and down-back for crouch guard. Both players use the same rules. Holding down without back ducks but does not automatically protect against lows.

| Attack type | Standing guard | Crouch guard / crouch avoidance | Additional rule |
|---|---|---|---|
| High | Blocks | Passes over an adequately crouched hurtbox | Check physical trajectory |
| Mid | Blocks | Hits crouching opponents | Do not call a crouch-blockable attack a standard mid |
| Low | Hits | Crouch guard blocks | Jump can avoid if the actual shapes separate |
| Throw | Beats guard | Standard standing throws miss crouched or airborne targets | Exceptions require explicit move tags |
| Projectile / magic | Per-move declared rule | Per-move declared rule | The move guide and startup tell must communicate it |
| Unblockable | Cannot block | Cannot block | Must have an evasion or interruption answer and substantial commitment |

Do not import the supplied prompt's contradictory mid/special-mid terminology. Use one clear taxonomy. A high/mid/low label alone never substitutes for collision geometry.

Start with one accessible throw command and a 14-tick break window using attack plus kick. Direction chooses front/back throw where legal. Throws cannot grab an invulnerable, airborne, already thrown, or protected recovering target. Define strike/throw collision by tick and move rules, not the blanket claim that any active attack always beats every throw. Expand to distinct break cues only if the control scheme and animation make them learnable.

Frame indexing: an N-tick startup first becomes active on the declared Nth tick after accepted input. Define this convention in code and tests. Frame advantage is derived from the defender's remaining stun minus the attacker's remaining recovery after contact, with shared hit-stop excluded. Multi-hit and late-contact attacks can have different effective advantage. Published move data must agree with measured simulation behavior.

Starting timing bands: fast close poke around 10 ticks; medium attacks 12-18; standard launchers at least 15; heavy commitments 20-30 or more. These are UMBRA proposals, not a universal Tekken specification. Weapon geometry and reach can justify exceptions recorded in the balance report.

Critical correction: a move at -13 cannot automatically be punished by a 15-tick launcher. A guaranteed punish requires an available attack fast enough for the disadvantage, in range after pushback, with a valid hit level and collision path. Even a -10 attack is not universally jab-punishable if spacing leaves the jab out of range. Test actual situations.

Counter hit means striking during the opponent's attack startup. Punish hit means striking during committed recovery. They are separate event tags. Begin with 1.20x counter-hit damage on marked moves and limited extra hitstun; a precision critical uses the 1.35x rule from section 12. If both conditions qualify, use the larger bonus, not their product. Head-hit combination still obeys the combined cap. No hidden random chance.

Move-data lint must reject negative durations, invalid windows, undefined follow-ups, missing hit shapes, malformed hit counts, unavailable animation clips, illegal effect references, and unbounded self-cancel loops. It should report suspicious frame advantage and move dominance for review. Do not encode a false universal balance claim as a build-breaking invariant.

### 10B. Bounded juggles, walls, and wake-up

Add controlled launcher routes and wall pressure without turning every exchange into a long noninteractive sequence. Airborne opponents use deterministic gravity, juggle eligibility tags, progressive gravity or pushback, and a finite re-launch budget. Start with at most seven airborne combo contacts and one wall splat per combo. Multi-hit moves count their actual connected hits.

Start with a 350-damage combo cap against nominal 1,000 health, with explicit policy for character-specific health and deferred damage. Metered routes can receive a separately tested limit; do not quietly bypass caps through delayed bombs or wound ticks. Display both direct combo damage and pending effect damage in training. The cap is a backstop, not a replacement for removing infinite setups.

All stages share a canonical fight width, initially 22 body-width units, with no ring-out. Wall splat applies only to tagged hits in valid states. After one splat, follow-ups use scaling and cannot re-splat before control recovery. A wall decal and dust are cosmetic. The boundary cannot trap a fighter inside geometry.

Wake-up choices: neutral rise, backward recovery roll, and one risky low or mid wake-up kick. Give each declared timings, vulnerable windows, and punishability. No invincible damaging escape without a specific justified rule. Training can reset to either corner and record wake-up choices.

Do not introduce fast crouch or power crouch as undefined states. Add crouch transitions only when a move needs them, with measured transition costs and documented cancel windows.

### 10C. Eclipse and Last Breath: preserved experimental ideas

The UMBRA source proposes an eight-second Eclipse power state and a low-health Last Breath attack. Keep them in an experimental Custom Duel ruleset, disabled in default Signature Duel until the basic weapons and character signatures are balanced. They are not required to make every character recognizable.

If enabled, Eclipse is once per round, lasts at most 480 simulation ticks, and affects only explicitly tagged moves. Specify whether timers pause in hit-stop. Any chip is capped, initially 15% of the blocked move's scaled damage, and cannot KO in the experiment. A cancel costs the remaining state or a defined resource so it cannot create infinite pressure.

Last Breath can initially unlock one clearly telegraphed armored move below 25% health. Do not also apply a universal +15% damage multiplier by default. Armor absorbs at most one eligible hit and remains vulnerable to defined counters. The move has punishable recovery. Its command is a remappable action and must not collide with throw or signature input.

Reject permanent low-health advantages that encourage deliberately taking damage without sufficient tradeoff. Promote a system to ranked only after human tests, a versioned ruleset decision, and updating every affected character, replay, and tutorial.

## 11. Simulation, collision, animation, and frame data

Run combat at a fixed 60 ticks per second independently of rendering. Display interpolation cannot alter authoritative collisions or timing.

Fighter states: neutral, moving, crouching, jumping, startup, active, recovery, guarding, blockstun, hitstun, thrown, knockedDown, gettingUp, disarmed, defeated. Some conditions are overlays, not mutually exclusive states; document the actual model rather than forcing an unwieldy flat state list.

Each move declares:

```text
id, family, input, startupTicks, activeWindows, recoveryTicks,
rootMotionByTick, attackShapesByTick, hurtboxProfile,
baseDamage, guardRule, hitstun, blockstun, knockback,
airborneRules, groundHitRules, armorWindows, invulnerabilityWindows,
cancelWindows, allowedFollowUps, meterCost, effectRules,
animationClip, soundEvents, visualEvents
```

Authoritative hit shapes are sampled from checked animation data or authored alongside it. Do not ask an independently interpolated render skeleton for the authoritative hitbox. Use deterministic math and stable iteration order; compare state hashes across real browser engines.

Collision requirements:

- Head, torso, and legs have distinguishable hurtboxes.
- Weapon and limb trajectories match their visible motion.
- Fast attacks use swept checks rather than only endpoint overlap.
- One hit per intended hit ID per target; multi-hit moves explicitly define repeated hits.
- Collect both fighters' hit candidates before applying results, so player index does not decide trades.
- Define simultaneous KO, wall interaction, corner pushback, throw immunity, and recovery protection.
- Do not let attacks strike through the floor or from behind the weapon's true arc.
- Grounded fighters cannot be looped indefinitely by a repeated sweep.

Animation requirements:

- Anatomically readable articulated bodies, not capsule placeholders in the final game.
- Clear anticipation, contact, follow-through, and recovery.
- Foot planting, hip rotation, shoulder rotation, weight shift, breathing.
- Correct grip alignment for every weapon and rig.
- Different impact reactions for head, body, legs, heavy hits, launches, and falls.
- Paired throw animations align both bodies and release correctly at walls.
- Blend movement where appropriate; do not blend away an attack's silhouette or timing.
- Slow-motion training and frame-step reveal correct contact and no major clipping.

Prototype a rigged 3D silhouette renderer with an orthographic camera and authored animation. Three.js is a candidate with documented animation support, not a promise that it creates animation assets automatically. A coherent 2D skeletal pipeline is acceptable if it meets the same quality gates. Use one pipeline after the comparison spike. [Three.js documentation](https://threejs.org/docs/)

## 12. Fair damage, criticals, disarm, and effects

All following values are starting proposals. Do not present them as measured Shadow Fight 2 values.

| Parameter | Initial proposal |
|---|---|
| Normal health | 1,000; character variation normally within 950-1,100 |
| Quick hit | 35-55 |
| Medium hit | 65-90 |
| Heavy hit | 105-145 |
| Throw | 80-100 |
| Multi-hit special total | 110-160 before scaling |
| Precision/critical multiplier | 1.35 |
| Head-hit multiplier | 1.15 |
| Combined location/critical cap | 1.55 |
| Default set | First to three rounds, 99 seconds per round |
| Local/private options | First to two, three, or five rounds |
| Target ordinary round length | 35-70 seconds after player tests |

Damage pipeline: base move damage, character/loadout rule, location modifier, critical modifier with combined cap, combo scaling, defense, rounding, then capped secondary effects. Round once at a documented stage. Process healing only from actual health damage, excluding overkill.

Competitive Signature Duel uses earned criticals: a declared precision move landing during a punish window, or a limited visible character condition. Do not stack a random critical on an already earned one. Random criticals can exist as an explicitly enabled Custom Duel setting only. Critical feedback remains strong even when the trigger is deterministic.

Prototype disarm as visible buildup from designated attacks. At threshold, remove weapon access temporarily, initially three seconds, and allow shared unarmed actions. Add a lockout against immediate repeat disarm. Permanent random loss of the main weapon is not the default competitive rule.

Combo damage scales by hit count, initially 100%, 90%, 80%, 70%, then a 50% floor. Repeated launches and stun have separate limits. Test these values instead of assuming they prevent every infinite. Most ordinary confirmed combos should stay below roughly 30% health; expensive signatures may exceed that only with meaningful risk and no guaranteed reset.

Reference effects include bleed, poison, precision, overheat, lifesteal, regeneration, stun, and timed bombs. [Enchantment reference](https://shadowfight2.fandom.com/wiki/Enchantments)

Initial effect rules:

- Bleed/poison: capped stacks and duration, explicit refresh policy, no proc recursion.
- Overheat: one visible next-hit buff with expiry; consumed according to an explicit hit/block rule.
- Lifesteal: capped per activation and per round; no healing from blocked or overkill damage.
- Shield: one visible charge or a fixed finite absorb value; never both without a distinct rule.
- Timed bomb: one marker, clear delay, limited follow-up advantage.
- Stun/root/freeze: short competitive duration, diminishing returns, guaranteed eventual control recovery.
- Magic recharge: cannot generate an infinite ability cycle.
- Reflected damage: cannot reflect itself or trigger endless reactive effects.

Resource meter must have fixed, transparent gain rules. Ability gains during rollback and repeated hit resolution cannot duplicate. Ranged attacks have startup and recovery; no unlimited safe projectile spam.

## 13. Dark art direction

The reference combines black silhouettes with comparatively luminous scenery. Official Nintendo imagery shows both traditional courtyards and later industrial environments. Our darker reinterpretation preserves this contrast rather than applying a uniform black overlay. [Official screenshot collection](https://www.nintendo.com/fr-fr/Jeux/Jeux-a-telecharger-sur-Nintendo-Switch/Shadow-Fight-2-1439834.html)

Suggested palette, as original art direction:

- Fighter body: near-black ink #090B10.
- Deep environment shadow: blue charcoal #17202A.
- Fog and background separation: #6D7C89.
- Warm light: restrained amber #B8753A.
- Warning and heavy impact: muted vermilion #A93E35.
- Cold magic: desaturated cyan #80AEBB.
- Rare occult accent: dusty violet #87749F.
- Menu text: warm bone #E1D8C7.

Use painterly layered scenery, mist, aged materials, strong architecture, and believable proportions. Characters remain identifiable through headwear, shoulders, posture, clothing silhouette, weapon outline, and motion. Use colored portraits in menus if helpful, but keep combat silhouettes dominant.

Avoid neon cyberpunk everywhere, glossy toy-like bodies, thick cartoon outlines, excessive bloom, generic purple gradients, and constant screen-filling particles. A small bright accent is more effective against the restrained base.

### Eight initial arenas

| Arena | Composition and palette | Ambient motion | Combat readability rule |
|---|---|---|---|
| Moonlit rooftops | Blue-gray sky, layered roof shapes, distant moon | Mist and occasional drifting leaves | Pale midground behind both standing fighters |
| Mountain monastery | Desaturated jade, stone, warm lanterns | Prayer fabric and cloud drift | No pillars covering the combat lane |
| Abandoned courtyard | Dust, ochre, deep red cloth | Dust motes and hanging cloth | Flat visible ground and sparse central props |
| Storm harbor | Slate sea, dark timber, distant warm lamps | Rain and distant ropes | Foreground rain reduced near silhouettes |
| Drowned Cloister | Green-gray water, aged shrine stone, candlelight | Rain and slow water ripples | Rain and reflected light never hide weapon paths |
| Burning fortress | Ember sky, ruined walls, dark tiles | Distant fire, ash | Flames stay behind fighters, never hide attack tells |
| Alien foundry | Cold teal machinery and dull steel | Steam and slow machinery | Bright equipment is away from the action plane |
| Abyss gate | Stone, gray mist, restrained violet portal | Slow portal pulse | Portal brightness stays stable during defensive cues |

All competitive arenas share the same fight-space width, boundary behavior, camera framing, and wall-dependent ability anchors. Scenery cannot change matchup balance. No damage hazards or ring-outs in the default ruleset.

For mirrors, use subtle edge tint, waist marker, or selected costume variation. Do not recolor the entire fighter into a bright glowing blob. Test screenshots at mobile size and in grayscale.

### Original background asset brief

"Create a painterly side-view martial-arts arena background with aged architecture, layered atmospheric depth, restrained charcoal and blue-gray colors, localized warm light, and a clear horizontal combat floor. Keep the middle combat lane uncluttered and lighter than near-black fighter silhouettes. No characters, text, UI, logos, or large foreground occluders. Deliver separated background, midground, floor, and optional foreground layers. Design for a 16:9 frame with safe crop margins for mobile."

Adapt the brief to each arena. Generated concept art is not automatically a game-ready layered asset; inspect, separate, optimize, and verify it.

## 14. Music and sound direction

The documented soundtrack credits Lind Erebros and assigns distinct tracks to encounters. Useful reference labels include Black Warrior for Lynx, Old Sensei for Hermit, Sparring for Butcher, Ship Battle for Wasp, Shadow Lady for Widow, Burning Town for Shogun, and Titan Epic Fight for Titan. Different editions have different recordings. These are listening references, not tracks to embed or melodies to reproduce. [Soundtrack catalogue](https://shadowfight.fandom.com/wiki/Soundtrack_%28SF2%29)

The following is ORIGINAL proposed music direction, not an asserted transcription of those tracks:

- Dark martial-arts atmosphere with space for combat cues.
- Deep hand and barrel drums, restrained metallic hits, low drones, sparse plucked strings, breathy flute colors, and subtle modern bass.
- Use instruments intentionally rather than mixing unrelated cultural signifiers randomly.
- Menacing, focused, and rhythmically grounded. Avoid cheerful arcade tunes or nonstop trailer-style crescendos.
- No copied melody, recordings, dialogue, or sound effects from the reference game.

### Cue plan

| Cue | Tempo target | Length / loop | Musical design |
|---|---|---|---|
| Menu / roster | 72-84 BPM | 90-150 seconds, seamless | Sparse low motif, plucked accents, distant percussion |
| Training | 80-96 BPM | 120-180 seconds, seamless | Minimal arrangement, gentle pulse, low fatigue |
| Rooftop / monastery duel | 104-116 BPM | 120-180 seconds, seamless | Tight drums, restrained flute phrases, tense bass |
| Courtyard / heavy fighter duel | 92-108 BPM | 120-180 seconds, seamless | Weighty drum strikes and short metallic accents |
| Harbor duel | 112-124 BPM | 120-180 seconds, seamless | Rolling percussion and dark sustained texture |
| Winter duel | 96-110 BPM | 120-180 seconds, seamless | Cold spacious texture with a clear rhythmic core |
| Fortress duel | 116-132 BPM | 120-180 seconds, seamless | Strong rhythm, low strings, restrained distorted layer |
| Foundry / abyss duel | 100-120 BPM | 120-180 seconds, seamless | Mechanical pulse, sub bass, sparse ominous motif |
| Round start | Unmetered or cue-synced | 1-2 seconds | Short distinct strike, no long interruption |
| Round win / defeat | Cue-synced | 3-6 seconds | Two related short stingers |
| Match victory | Cue-synced | 6-10 seconds | Restrained release of tension |

Optional tension stems enter smoothly in the final round or low-health situation. Do not speed up the entire song every time someone lands a hit. Combat audio takes priority over musical density.

### Original music generation / composer brief

"Compose an original seamless instrumental loop for a dark, side-view martial-arts duel. Use grounded percussion, a restrained low drone, sparse plucked-string and breathy wind colors, and an understated repeating motif. Keep the center frequencies open for weapon impacts and defensive cues. Build tension without a large cinematic climax. No vocals, no borrowed melody, no existing soundtrack samples. Deliver a 2-minute loop with a clean loop point, plus separate percussion and tension stems if available. Match the requested arena tempo and palette."

### Sound requirements

- Separate light/medium/heavy weapon contact, flesh impact, guarded hit, critical, sweep, landing, throw, disarm, and knockout sounds.
- Weapon families should have different material and motion character.
- At least three variations for frequent impacts, with restrained pitch variation.
- Sound from a predicted hit must not play twice after rollback.
- Distinct startup sounds for teleport, beam, dive, stomp, and shield.
- Music, effects, and UI volume controls; mute persists.
- Unlock audio on user interaction and handle suspension/resume correctly. [Web Audio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

If original audio assets are unavailable, mark synthesized temporary sounds as placeholders. A single repeating oscillator is not finished music. Do not claim generated tracks have been listened to or approved without actually checking them.

### Additional UMBRA presentation details

Use this canonical eight-arena release manifest: Ashen Ferry (storm harbor), Lantern Steps (mountain monastery), Bone Quarry (abandoned quarry/courtyard), Drowned Cloister (rain-soaked shrine), Iron Hall (burning fortress), Hollow Throne (abyss gate), Moonveil Roofs (moonlit rooftops), and Cinder Foundry (alien foundry). Drowned Cloister uses rain and green-gray water rather than snow. Winter-shrine art remains an optional future variant, not a ninth promised launch arena. Do not double-count renamed backgrounds.

Use four or five parallax layers when performance permits, fog behind the fighters, one dominant light direction, thin health bars with a delayed damage ghost, restrained ink framing, and legible numbers. Cormorant Garamond and Inter are typography candidates only after checking redistribution rights and bundling appropriately. Pixel rim widths must scale with device resolution and cannot be the only mirror-match identifier.

Optional subtle grain/vignette should be disabled at low quality or reduced-motion settings. Weapon ribbons can start with a roughly 120 ms fade. Counter-hit flashes stay localized. Reject the source prompt's mandatory 0.3-second slow motion on every counter hit: repeated gameplay slowdown would undermine pacing and online consistency. Reserve cinematic slowdown for the resolved final knockout or an optional replay view.

Procedural Web Audio is useful for original ambience, responsive layers, and prototypes. A polished procedural score is acceptable after listening tests; a generic pentatonic pluck loop is not automatically final audio. Use one coherent audio implementation rather than requiring both Howler and a separate duplicated mixer.

## 15. Impact, VFX, and camera

Use brief hit-stop for confirmed impact, initially 2-3 ticks for light contact and 4-6 for heavy contact. Both fighters and relevant projectile logic follow the same declared pause rule. Camera effects are cosmetic and cannot shift hitboxes.

Criticals get a stronger sound, compact impact flash, brief pause, and meaningful reaction. A short text callout is optional. Not every hit needs fireworks.

Weapon trails follow actual paths and fade quickly. Dust appears at feet and ground impacts. Magic shows startup, travel, contact, and recovery consistently. Smoke cannot hide all defensive information. Knockout slowdown happens only after the winner is resolved and cannot change the result.

Provide reduced-flash and reduced-shake settings. No rapid full-screen strobe effects. Camera follows both fighters with stable framing and limited smoothing; never zoom so far that mobile readability collapses.

## 16. Match flow and interface

Main menu: Play (Ranked, Casual, Private, Local), Sparring, Training, Fundamentals, Replays, Customize, Move Guide, Settings. A development build may hide unfinished modes, but the content ledger must keep them outstanding.

Human flow: choose mode, assign controls, choose character, choose allowed loadout, choose arena, confirm, fight, results, rematch or change character. Bot flow adds difficulty and behavior options. Avoid unnecessary menus between rematches.

Character selection shows a full-body preview, signature weapon, concise playstyle, difficulty, and special ability. Filter by weapon style. Never show planned characters as available; reserve them for the developer manifest.

HUD: health, rounds won, timer, character names, ability/magic resource, small status icons, and optional input prompts. Online adds connection quality in a small unobtrusive area. Training adds frame and hit data only when enabled.

Default ranked match: first to three rounds, 99-second timer, full health reset each round. Casual defaults to first to two; local/private offer first to one through five and a timer option. A ranked result is one completed match, not each round. Timer expiry compares health percentage, not raw health, because maximum health can differ. Simultaneous KO and equal-health timeout produce a draw round; replay it, with a documented repeated-draw policy. Do not award a round to player one by default.

Pause is allowed offline. Online opening a menu does not stop the opponent; show a clear notice. Rematch requires both players. Report disconnects distinctly from earned KOs.

Mobile: landscape layout, safe-area handling, adjustable controls, simultaneous touch input, no accidental browser scroll during combat. Offer a rotate hint in portrait without corrupting the match. Mobile same-device versus is supported through compatible controllers; do not promise comfortable two-person touch play on one small screen.

## 17. Bots and training

Bots are practice opponents, not a campaign. They give no rating, currency, unlocks, or cosmetic progression. All selectable characters should be usable by bots.

Four difficulty levels with starting reaction-delay ranges:

- Beginner: 300-450 ms, frequent mistakes, limited strings.
- Normal: 220-320 ms, basic spacing and punishment.
- Hard: 150-240 ms, better matchup knowledge and resource use.
- Expert: 120-200 ms, strong decisions but no hidden-input reading.

These are tuning values; no artificial claim that they reproduce human reactions exactly. Bots may anticipate based on observed patterns, but cannot inspect future inputs or react to an uncommitted button press.

Behavior profiles: balanced, aggressive, counterattacking, evasive, zoner, throw-focused. Give each character preferred distance and legal tactical options. Higher difficulty does not secretly multiply health or damage.

Training features:

- Infinite health and selectable resource refill.
- Dummy stand, crouch, jump, guard, guard-after-first-hit, and counterattack.
- Record and replay at least five dummy sequences, optionally randomized.
- Input history and command display.
- Move name, startup, recovery, hit/block advantage, damage, combo total.
- Hitbox/hurtbox overlay, frame-step, slow motion.
- Reset positions at center or either corner.
- Practice specific boss-inspired signatures and their counters.
- Replay takeover as a later tool if feasible, not a substitute for the basic trainer.

### Fundamentals course: twelve playable lessons

Each lesson is a short exercise with input prompts, a concrete success condition, immediate retry, and optional explanation. It is not story content and awards no power.

1. Movement and spacing: leave an attack's reach and return safely.
2. Weapon attack versus kick: land each at the appropriate range.
3. Standing guard: block a recorded high or mid sequence.
4. Crouch and low defense: duck a high, then block a low.
5. Throw and throw break: perform and escape a visibly cued throw.
6. Roll, jump, and evasion: avoid a declared attack lane without a depth sidestep.
7. Whiff punishment: punish a missed committed strike.
8. Block punishment: select a fast enough in-range punish using displayed frame data.
9. Counter hits and precision: distinguish interrupting startup from punishing recovery.
10. Short juggle and wall route: execute one bounded route and see its scaling.
11. Signature, ranged, and magic counterplay: defend a recorded special and punish it.
12. Knockdown and wake-up: practice rise, retreat, and a punishable wake-up attack.

Drill bots include high/low defense, throw breaks, unsafe-move punishment, pressure gaps, projectile response, signature evasion, and wake-up choices. A drill records attempts and success rate locally, with no rating or currency. Expert bots observe visible animation/state only; they cannot access the player's hidden input buffer.

The original UMBRA six-frame expert reaction is not a required baseline. Use the human-readable reaction ranges in section 17 and test anticipation separately from reaction. A bot that wins by reading commands is not a useful sparring partner.

## 18. Local 1v1 and controller support

Support keyboard versus controller, two controllers, and configurable two-player keyboard input. Warn about keyboard rollover limitations only when relevant in the control screen; provide an input tester.

Explicitly assign devices to players. Connecting or disconnecting a device cannot silently swap fighters. Offline disconnect pauses and requests reassignment. Menus work with keyboard and controller, including back/cancel and focus indicators. [Gamepad API guidance](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)

## 19. Online 1v1 architecture and requirements

Online private rooms are a required deliverable, not a decorative disabled button. Public casual matchmaking, ranked play, and spectating are required full-product milestones added from the UMBRA prompt. They follow the verified private-match foundation and must not be represented by mock queues or fabricated opponents.

Use deterministic input-based simulation with rollback. Implement a small server for room creation, join codes, ready states, version/ruleset agreement, input relay, connection state, and results. A WebSocket relay is a reasonable initial transport; do not treat transport choice as a substitute for rollback or verification. Avoid making direct peer-to-peer connectivity the only path.

Required behavior:

- Both clients agree on build, content hash, ruleset, characters, loadouts, arena, and random seed.
- Inputs carry sequence/tick numbers and are validated for format, bounds, and rate.
- Keep a bounded history of snapshots and inputs.
- Predict missing remote input with a documented policy, then resimulate on correction.
- Simulation owns outcomes; render-only randomness never enters game state.
- Cosmetic events have stable IDs so rollback does not duplicate sounds, particles, damage, meter, or rewards.
- Send state hashes; detect mismatch and resynchronize or terminate with a clear explanation.
- When delay exceeds the supported rollback window, use a bounded wait/resync policy rather than unlimited catch-up.
- Handle room expiry, host departure, duplicate join, reconnect grace, and both players disconnecting.
- Background-tab throttling must trigger a declared online connection policy; it must not silently change combat speed.

Do not trust client-reported winners for a ranked leaderboard. Private casual play can launch with an explicitly documented trust model; competitive ranking requires authoritative validation or server replay verification and abuse controls.

Test 40, 100, and 180 ms RTT, jitter, short outages, and delayed/lost application messages. With reliable ordered transports, test head-of-line delay rather than pretending packets are independently delivered. Record actual rollback frequency and perceived interruptions. Same-machine tabs do not establish real cross-network compatibility.

### 19A. Transport, rollback, and recovery details

Use a transport interface so the game can support a reliable relay first and optional WebRTC later. If adding WebRTC, budget signaling, ICE, STUN, and TURN or the tested WebSocket fallback. PeerJS alone does not guarantee reachability through restrictive networks. [MDN WebRTC protocol reference](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols)

The source prompt's phrase "inputs only, never state" is too absolute. Normal combat traffic is input-based; authenticated snapshots are allowed for reconnect, spectators, diagnosis, and controlled resynchronization. Never accept an arbitrary client snapshot as a ranked result.

Start with a maximum eight-tick rollback window and one to three ticks of negotiated input delay. Measure round-trip delay and jitter rather than applying an unvalidated fixed table. Eight ticks are about 133 ms of simulation, not a guarantee of support for every 133 ms RTT connection. Input transit is one-way, scheduling and jitter matter, and both clients must agree on delay changes. Do not permit one player to alter delay asymmetrically during a round.

Hash gameplay state every 30 ticks using canonical serialization, while excluding audio, render interpolation, and non-gameplay UI. On mismatch, retain recent inputs and snapshots for diagnosis. Private play may resync; ranked resync/termination follows server policy. Deliberately forcing a mismatch must not become a free way to erase a losing match.

For an unreliable channel, repeat recent unacknowledged inputs in bounded packets. Include match ID, tick, sequence number, and protocol version. Reject out-of-window input injection. Reliable transport requires tests for stalls and ordered-delivery delay. Keep a separate confirmed input history for replay.

Reconnect grace starts at a proposed ten seconds, with server-owned timing. Distinguish a player abandoning, a server outage, and simultaneous connection loss. Never decide a ranked forfeit solely from the opponent's accusation. Private rooms may offer a longer reconnect option.

### 19B. Public casual, ranked, and accounts

Private and local play remain usable without a permanent account. Use a recoverable identity for ranked and persisted cosmetic entitlements. Guest tokens may support casual rooms but are not sufficient protection against ranked abuse. If email sign-in is selected, use a supported authentication provider and configure it properly; do not invent a fake login or put secrets in client variables.

Use Glicko-2 after validating an implementation against the author's published example and documenting rating period, initial rating, deviation, and volatility policy. Reference: [Glicko author's site](https://www.glicko.net/glicko.html). Do not invent formula constants from memory. Display tiers Ash, Ember, Cinder, Iron, Obsidian, and Eclipse, with a Top 100 board after enough legitimate matches exist. Freeze tier thresholds in versioned configuration and label provisional ratings.

Matchmaking starts with region/connection quality, then rating. An initial experiment is a +/-100 rating window that expands by 50 every ten seconds to +/-400. A proposed ranked RTT gate is 150 ms with a jitter/rollback gate measured during warmup. These are tunable service policies, not proof that every eligible match will feel good. Ask the player before relaxing quality substantially; never fill a human queue with an undisclosed bot.

Use blind character selection for ranked. Lock the ruleset and approved loadout before reveal. Private rooms let the host select arena, round count, and legal custom rules. Ranked stage selection uses the full approved mechanically equivalent pool; random stage choice is cosmetic randomness, not combat randomness.

The service owns match IDs, participants, input receipt deadlines, final results, ratings, and idempotent reward writes. Replaying a completed result request cannot grant more rating or currency. Begin with a single-instance SQLite deployment if sufficient; use Postgres when deployment or concurrency requires it. Publish a migration and backup strategy.

Server validation requirement: run the shared deterministic simulation authoritatively, or verify the accepted input log server-side before committing a result. Clients submitting matching winners is not adequate anti-cheat: they can collude, falsify results, or exploit deliberate desyncs. Determinism detects divergence; it does not stop bots, collusion, or a modified client that stays within legal state transitions. Document those limits.

Record disconnect/void outcomes with reason codes and enforce a reviewed abandonment policy. Limit farming repeated opponents, duplicate sessions, impossible input rates, and replayed requests. No invasive device fingerprinting is required for the initial product. Collect only necessary match diagnostics, with retention and deletion rules.

### 19C. Replays and spectating

Replay header: format version, simulation/build hash, content hash, ruleset ID, roster/loadouts, arena, seed if relevant, initial state, confirmed inputs, and checksum. Save input logs rather than video as the canonical record. The replay viewer supports pause, speed, frame-step, and optional hitboxes.

A version number alone does not make old replays compatible. Either retain matching simulation/content bundles for playback or show an honest incompatible-version message and preserve the export. Never replay an old match under new balance values and call it accurate. An exported video can be an optional archival feature.

Private-room spectators need host/player permission and cannot send fighter commands. Ranked spectators use a server-enforced ten-second delay as a starting policy. Delay all relevant state and inputs, including reconnect snapshots; hiding only the camera does not prevent information leakage. Allow late joins from a trusted checkpoint followed by confirmed input catch-up. Enforce spectator limits and backpressure.

Spectating and replay are read-only paths through the same simulation. Their UI and playback speed cannot mutate the live match.

### 19D. Cosmetic progression

All completed characters, weapons, and competitive loadouts remain immediately available. Cosmetic progression is an optional retention layer added from UMBRA, never a launch blocker for combat quality.

If implemented, human matches may award capped Ink and an account cosmetic level. Bots and training award none. Rewards are server-owned, idempotent, and protected against repeated-opponent farming. Local unverified matches may update a local-only cosmetic profile but cannot mint server entitlements or rating.

Ink purchases only reviewed weapon skins, trail accents, silhouette accessories, emotes, and nameplate frames. No loot boxes, paid power, or statistical upgrades. No payment integration is required by this prompt. Cosmetic stage variants keep identical mechanics. Accessories cannot hide startup tells or alter perceived range substantially. Every purchase has a preview and clear confirmation.

## 20. Implementation organization and assets

Suggested approach: TypeScript and a browser build tool; Three.js or one selected skeletal renderer for combat; ordinary HTML/CSS UI; a small Node server for online rooms. Inspect the environment before choosing versions. Do not adopt a large framework solely for menus.

Keep these responsibilities separate:

```text
src/sim/          deterministic combat, state, collision, effects
src/content/      characters, weapon families, moves, arenas, rulesets
src/render/       rigs, animation presentation, camera, VFX
src/audio/        mixing, cues, rollback-safe events
src/input/        keyboard, controller, touch, recording
src/ui/           menus, HUD, settings, move guide
src/net/          input exchange, rollback, snapshots, room client
server/           room and relay service
assets/           licensed or original visual/audio assets
tests/            simulation, browser flows, network scenarios
docs/             research, controls, content ledger, validation
```

This layout is guidance, not a requirement to create empty abstractions. Prefer straightforward modules and data over a bespoke engine framework.

Asset manifest fields: asset ID, file, author/source, license or generation provenance, intended use, placeholder status, dimensions/duration, file size, verification status. Do not hotlink fragile remote images or stream an unlicensed reference soundtrack.

Load only common assets and the chosen fighters/arena before a match. Cache subsequent loads. Provide progress, error handling, and retry. Cap texture sizes and pixel ratio on mobile. Save preferences, local records, replays, and loadouts with versioned migrations and export/import. Server-owned ratings and cosmetic entitlements use authenticated server records. No character unlock grind.

Installed tools to consider at implementation time: Product Design for concrete HUD/roster visual exploration, image generation for original arena layers and portraits, and a suitable audio tool/composer for original loops. Ask before paid generation or external publication when required by the environment. Asset tools do not replace animation authoring or combat engineering. This prompt itself requires no cloud document or plugin dependency.

### Developer tools and deterministic implementation standards

Prefer integer or fixed-point gameplay coordinates with explicit precision, overflow bounds, and rounding. JavaScript Number is acceptable for bounded exact integer arithmetic; avoid non-deterministic floating-point transforms in collision. Rendering can freely use floats. The simulation must import no DOM, renderer, real-time clock, audio, or network API. Inject tick inputs and serialize state explicitly.

Suggested tools:

- tools/lint-moves: schema validation and structural invariants.
- tools/replay-check: headless replay, checksums, and first-divergence report.
- tools/balance-sim: seeded bot/scripted matchup sweeps with JSON/CSV reports.
- Development animation inspector: pose/frame scrubber, bone/weapon attachments, hit/hurt shapes, contact preview, left/right and large/small matchup previews.
- Network diagnostics: input delay, confirmed tick, prediction age, rollback count, resimulation cost, desync exports.

Reuse an existing compatible authoring tool before building a full rig editor. A small development-only /editor or inspector can edit timing and collision curves, but must not become a second large product. Shared humanoid rigs need enough articulation for readable martial arts; do not enforce a fourteen-bone cap on Titan, unusual weapons, or paired throw motion.

Version simulation and content together. Hot reload move data in development only; online clients must not quietly load different balance data mid-match. Include manifest validation in the production build.

For the initial stack, TypeScript plus Vite and one selected renderer is the default. PixiJS with authored 2D skeletal animation is an acceptable alternative to the 3D silhouette spike, especially in an existing Pixi project. Do not replace a working renderer just to satisfy a brand preference. Verify current APIs in official documentation during implementation and lock dependencies.

Deployment artifacts should support a static web host and a persistent server host. Vercel plus Render is one possible deployment topology, not a mandatory service purchase. WebSocket services need a suitable long-lived runtime; database storage must persist across deploys. Provide CLIENT_ORIGIN, server port, database connection, and VITE_RELAY_URL examples with no credentials. Test HTTPS/WSS, allowed origins, room rate limits, health checks, migrations, and reconnection after server restart.

## 21. Performance and accessibility gates

- Target 60 FPS on the agreed PC baseline with a 60-tick simulation.
- Target 60 FPS on selected mid-range phones; allow a 30-FPS render setting while preserving simulation timing.
- Measure demanding spells, mirrors, large rigs, and long sessions, not just idle scenes.
- Record median and 95th-percentile frame times, memory trend, loading time, and hardware/browser details.
- Target first playable offline match within 10 seconds on the chosen test network and cached rematch within 2 seconds. Report actual measurements if missed.
- A lower effect setting never removes mandatory tells or changes hitboxes.
- Support remapping, readable menu focus, readable text, adjustable sound, reduced motion, and non-color-only ability cues.
- Verify refresh-rate independence at 60, 120, and 144 Hz where available.
- Handle resized windows, device rotation, audio interruption, context loss, tab suspension, and controller disconnects.

These are goals until measured. Desktop emulation is not evidence of physical phone performance.

## 22. Build phases with honest exit gates

### Phase A: reference and skeleton

Inspect existing files and instructions. Create the content manifest and unresolved-evidence register. Establish a runnable game shell, input tester, fixed-tick simulation, one arena, and a training dummy. Select the art pipeline through a small animation proof. Do not spend this phase polishing a landing page.

Exit: an actual interactive fighter moves, attacks, guards, receives hits, falls, gets up, and completes a round.

### Phase B: combat quality proof

Implement unarmed, claws, a sword, and a staff or spear. Author real articulated animations and matching collision. Add input history, frame-step, sound categories, and basic bot behavior. Test Titan's size and throws as a parallel content concern within this phase, without requiring a full kit yet.

Exit: contrasting weapons produce distinct decisions; no major clipping, phantom reach, or frame-rate-dependent damage. Human testers can identify startup and punish windows.

### Phase C: complete small 1v1 game

Implement four polished playable characters, two polished arenas, full local versus, bot matches, training, rematch flow, controller support, touch support, original temporary-to-final asset tracking, and working online private rooms.

Exit: two humans can play a complete local set and a complete online set; both see identical outcomes; bots can use each character; the trainer works. This is a milestone, not final project completion.

### Phase D: principal roster release

Complete all seven main boss-inspired kits plus Corvin as the baseline and two additional UMBRA originals, making ten distinct playable kits. Include eight arenas, signature rules, custom compatible loadouts, twelve weapon families, approximately forty weapon items, complete menus/audio, replays, and robust network handling. Remaining original concepts stay in the expansion manifest.

Exit: every roster member is playable, distinguishable, and beatable; main flows pass; real-device and network limitations are reported honestly.

### Phase E: full arsenal and permanent roster

Expand to twenty production families, at least one hundred weapon items, and all fourteen permanent Underworld-inspired characters. Complete bot behavior, move guide, training sequences, and matchup review for additions.

Exit: counts refer to real usable content. Cosmetic variants are counted separately from mechanical styles. No characters inherit encounter-only immunity or raid power.

### Phase F: expanded character catalogue

Complete remaining researched story-origin, challenger, bodyguard, and event kits in waves. Verify unresolved reference details or mark intentional original adaptations. If the user later changes the roster target, update the manifest explicitly; do not quietly omit planned content.

Exit: the agreed finite roster manifest is complete, including source status and adaptation decisions. "Every boss ever" cannot be declared complete against an unbounded live-service catalogue; freeze and date the release inventory.

### Phase G: public competitive services

Implement public casual queue, server-validated ranked results, accounts, Glicko-2 ratings, tiers, leaderboard, spectator permissions/delay, and replay compatibility handling. Complete the fundamentals course and drill bots. Optional cosmetic progression may follow without blocking the fight modes.

Exit: two actual clients can queue, match, finish, and receive one correct server-owned result; reconnect and abandoned matches follow documented rules; spectator clients cannot inject fighter inputs; no fake users or fabricated ratings.

### Phase H: balancing and release preparation

Run human sets, bot sweeps, deterministic replays, real-network sessions, mobile checks, audio listening, and screenshot review. Fix failures, optimize assets, and produce a reproducible build and deployment instructions. Public deployment follows the owner's authorization and environment access.

## 23. Testing and balance evidence

Automated tests must cover actual failure risks:

- One-hit versus multi-hit damage behavior.
- Startup/active/recovery transitions and legal cancels.
- Guard, throw, airborne, ground-hit, and invulnerability rules.
- Critical and effect ordering, stack caps, and no recursive triggers.
- Simultaneous hit/KO, timeout, and round reset.
- Input logs produce matching state hashes across repeated runs.
- Rollback restores health, position, meter, effects, and timers correctly.
- All roster entries have valid moves, animations, effects, and compatible loadouts.
- Local, bot, online, rematch, reconnect, and settings browser flows.

Human and visual checks:

- Slow-motion inspection of every family and signature.
- Every weapon has believable contact and a usable tactical purpose.
- No repeated guaranteed loop removes control indefinitely.
- Each signature has at least one tested counter in ordinary conditions.
- Large-body and small-body matchups work in both corners and both facing directions.
- Mirror matches remain readable.
- No default character wins through permanent immunity or oversized free range.
- Audio loops cleanly, cues are audible, and frequent sounds are not fatiguing.
- Real controllers, touchscreens, and separate networks are actually tested when claimed.

Balance targets are diagnostics, not proof: investigate characters outside roughly 45-55% overall win rate in sufficiently varied, skill-matched human sets; inspect individual matchups rather than hiding them inside an average. Log sample size, player skill, ruleset, patch, and confidence limitations. Bot-versus-bot sweeps find obvious problems but cannot establish human competitive balance.

### Balance telemetry and practical test budgets

Track fighter/matchup win rates, sample sizes, round length, damage per opening, throw breaks, signature usage, wall routes, connection quality, and abandonment. Separate ranked, casual, custom, and bot data. Do not combine unequal skill pools into a confident balance claim.

Tune in this order when appropriate: recovery/startup, hit/block advantage, resource/cancel constraints, damage, then collision or hit-level redesign. Geometry edits require animation review. No invisible multiplier patch that contradicts the move guide.

Start automated balance sweeps small, then expand suspicious matchups. Ten thousand matches for every pairing on every commit is not mandatory and would grow quickly with the full roster. Use a fast smoke suite per change, nightly or milestone broad sweeps, and targeted deeper runs. A 45-55% bot result is a review signal, not a pass/fail definition of competitive fairness.

Suggested human diagnostic bands: investigate overall rates outside 47-53% after sufficient comparable samples, and individual matchups outside 40-60%. Do not enforce these bounds on tiny samples or intentionally different bot levels. Record evidence and uncertainty.

Network testing must exceed the supplied prompt's 1,000-frame smoke test, which is under seventeen seconds at 60 Hz. Keep that smoke test, then run complete sets and repeated long sessions across different browsers and real networks. Report actual tested duration, transport, RTT, jitter, loss/stall model, disconnect cases, and state-hash results.

Always include assertions for cross-browser replay equality, rollback after a multi-hit effect, end-of-round rollback, duplicate result submission, unauthorized spectator input, disconnect during rematch, stale invite links, and incompatible build rejection. Automated checks complement human feel and actual-device tests.

## 24. Required deliverables and execution behavior

Produce:

1. Runnable source and a production build.
2. Local startup instructions for client and online server.
3. Working local, bot practice, training, fundamentals, private online, public casual, ranked, replay, and spectating flows.
4. Original or properly licensed assets with a provenance manifest.
5. Character, weapon, move, effect, and arena manifests.
6. Controls and concise player instructions.
7. Automated test results and human/device/network verification matrix.
8. A development handoff and next-action ledger if the work spans sessions.

Track requirements as NOT STARTED, IN PROGRESS, IMPLEMENTED, VERIFIED, or BLOCKED, with evidence. Never mark something verified solely because a build succeeded or a UI button exists.

When beginning implementation, summarize the chosen stack and immediate work briefly, then build. Make reversible implementation decisions autonomously. Ask only about genuine missing constraints or approvals. Do not repeatedly ask whether to continue after each milestone.

If a session limit prevents completion, leave a runnable checkpoint, exact startup commands, current failing checks, unfinished requirements, and the next implementation steps. Do not describe that checkpoint as the finished requested game.

Final quality standard: it must feel like a serious dark martial-arts roster fighter with substantial weapons, readable boss-inspired identities, and dependable human 1v1. A beautiful menu surrounding shallow combat does not meet the goal.

## 25. Research gaps to preserve honestly

- No authoritative full original-game frame-data or damage-formula extraction was performed.
- Main-boss identities are better established than every seasonal kit variation.
- Gatekeeper and Saturn special behaviors, several event kits, the full remaining bodyguard inventory, and exact mini-boss equipment need focused follow-up before fidelity claims.
- The weapon sampling is broad but not every item from every edition. The 100-item implementation target requires a finite reviewed manifest.
- Official imagery supports the silhouette contrast reference. The proposed palette, arena layouts, and music instrumentation are creative direction, not claims of exact original values.
- Soundtrack associations were researched; the full soundtrack was not listened to in this research pass.
- No game was implemented, no online connection tested, and no actual-device performance established by preparing or merging this prompt.

These limits should guide verification, not become excuses to replace the requested game with a smaller unrelated product.


## 26. What Claude should do first

1. Inspect repository instructions, existing code, and available asset/testing tools.
2. Create the requirement ledger and record the canonical choices from the opening table.
3. Build one baseline mirror match with real input, movement, guard, hit detection, throw/break, knockdown, rounds, and a dummy.
4. Add a contrasting weapon and a replay/hash test before expanding the roster.
5. Add local device assignment and private online rollback early.
6. Improve the animation and impact until the small game meets the quality gate.
7. Continue into roster, training, public services, and full-content milestones.

Invite a human playtest at meaningful checkpoints, but continue independent implementation and test work while feedback is pending. If a requested human decision is genuinely necessary, identify exactly what it blocks. Do not automatically stop after Milestone 1 merely because the older UMBRA source ended with that instruction.

At every handoff, report what runs, how to run it, what was tested, what remains, and the next concrete action. The finish line is the agreed playable product, not this document being restated.
