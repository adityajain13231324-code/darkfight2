# Shadow Fight 2 source and asset research catalog

Research date: 10 November 2026. Scope: public websites, official stores, GitHub repositories, fan modding tools, ripped asset indexes, soundtrack listings, and technical writeups relevant to a PC first browser 1v1 game with local and online PvP and practice bots.

## What this search actually found

There is **no verified official release of Shadow Fight 2's original source project**. A major community lead is [Project Eclipse's public Unity repository](https://github.com/samir419/ProjectEclipse), which describes itself as an exported/recovered SF2 project with game code, art, configuration XML, tools, and locally added code. A [larger public fork](https://github.com/kaankutluturk/ProjectEclipse) is also accessible. This is the most extensive source-like collection I found, but recovered Nekki material is not an open license and the Unity project is not a ready to paste browser implementation.

The best purpose-built source for **smooth, articulated silhouette animation** is [Gymnast Tool Suite](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite), especially its [animation system notes](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite/wiki/How-Nekki%27s-system-works). The best lead for **native 1v1 networking architecture** is [SF2Recomp's LAN sparring document](https://github.com/bipinkrish/sf2recomp/blob/master/docs/lan-sparring.md). The most directly relevant **browser prototype code** is [ShadowClash](https://github.com/Yoi-Nakama/ShadowClash), but its quality and use of Shadow Fight names need an independent review.

Important ownership line: a repo's MIT or GPL license covers only its author's original contributions. The [Gymnast README](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite) explicitly excludes Nekki's assets from its GPL license. [Nekki's Shadow Fight 2 EULA](https://shadowfight2.com/en/eula.html) permits installation and play, and disallows unlisted forms of use. Buying the game, downloading a rip, or receiving a file from another person does not by itself provide a license to ship that art, animation, audio, characters, or game code in our own game. We can use these as study references and build original equivalents, or seek a separate license from Nekki.

### Legend

- **Code, licensed:** a public license was visible for the author's code. Check the actual license and dependencies before integrating.
- **Code, unclear:** source is visible, but I did not verify permission to copy it into another project.
- **Game content:** original or ripped Shadow Fight 2 files. Useful as references, rights are separate.
- **Reference:** gameplay, data, research, or audio reference, not reusable production content.
- **Purchase / sign-in / blocked:** an access step or page failure was observed. The linked landing page may still work for you manually.

## 1. Official game builds and gameplay reference

| Source | What is available | Access and usefulness |
|---|---|---|
| [Shadow Fight 2 website](https://shadowfight2.com/) and [browser play](https://shadowfight2.com/play/) | Playable web version and platform links | Free browser reference for animation, timing, presentation, and controls. It does not expose an openly licensed source project. Nekki's [main website](https://nekki.com/) links to `shadowfight2.com`. |
| [Google Play, standard edition](https://play.google.com/store/apps/details?id=com.nekki.shadowfight) | Official Android install | Free download with possible purchases. Good current gameplay reference; game files are proprietary. |
| [Apple App Store, standard edition](https://apps.apple.com/us/app/shadow-fight-2/id696565994) | Official iOS install | Region and device availability may vary. Proprietary game files. |
| [Nintendo Switch listing](https://www.nintendo.com/us/store/products/shadow-fight-2-switch/) | Console game with local two-player mode | **Purchase required.** Best official same-device 1v1 reference. Game files are required for SF2Recomp and are not included in its repo. |
| [Microsoft Store](https://apps.microsoft.com/detail/9mwzkj1ft6kl) | Windows version | Store availability depends on region. Useful PC control and visual reference. |
| [Google Play, Special Edition](https://play.google.com/store/apps/details?id=com.nekki.shadowfight2.paid) | Paid Android edition | **Purchase required.** Price varies by region. |
| [App Store, Special Edition](https://apps.apple.com/us/app/shadow-fight-2-special-edition/id1261834568) | Paid iOS edition | **Purchase required.** Check regional listing. |
| [Shadow Fight 2 support center](https://nekki.helpshift.com/hc/en/4-shadow-fight-2/) | Official support and game behavior explanations | Reference only. |
| [Nekki contact and legal pages](https://nekki.com/) | Publisher contact route and legal terms | Route for asking about a content license if exact game assets or characters are essential. |

**Version caution:** old mobile releases, the current browser build, and the Switch edition differ. A file format, move list, or animation finding from one version should not be assumed to apply to all others.

## 2. Highest value animation and model tools

| Source | What is inside | Access / rights / fit |
|---|---|---|
| [Gymnast Tool Suite repository](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite) | Blender add-on for SF2 and Vector models and animations, XML tools, sample scenes, documentation | **Code, licensed GPL-3.0** for the author's work. Very useful to study node based silhouettes and make original rigged fighters. GPL duties matter if we incorporate the code. Nekki assets are explicitly excluded. |
| [Gymnast releases](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite/releases) | Packaged releases of the add-on | GitHub page accessible; its dynamic binary asset area did not render in my web reader. **Manual download may be needed.** Repo source is also available. |
| [Gymnast wiki](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite/wiki) | Installation, import/export, model and animation usage | Open documentation. |
| [How Nekki's system works](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite/wiki/How-Nekki%27s-system-works) | Fan analysis of skeletal nodes, custom XML models, `.bin` animations, source frames and interpolation | **Reference.** It describes SF2 as node based, with animation sampled at about 20 FPS and interpolated to a smoother display rate. Verify implementation details against the version you study. |
| [Gymnast linked Shadow Fight 2 Assets.zip](https://drive.google.com/file/d/1jZDNW6Ph6IOkBLoTV5yEWbNvtp8v8YBp/view?usp=drive_link) | Separately hosted SF2 asset archive linked by the tool author | **Game content; Google Drive sign-in screen in my web reader.** Try the link manually. Its content is not GPL licensed. Do not put it into our published game without permission. |
| [ShadowFIght2_Blender_AnimationTool](https://github.com/hwindinkg/ShadowFIght2_Blender_AnimationTool) | `anim_sf2.py`, `skeleton_import.py`, Blender scene, example skeleton XML and binary dump | **Code, license unclear.** Useful independent format and rig reference; check ownership and behavior before reuse. |
| [Vector-Animator](https://github.com/FlipThoseTitle/Vector-Animator) and [SF2 rig file](https://github.com/FlipThoseTitle/Vector-Animator/blob/main/Rig/Shadow%20Fight%202%20Rig/SF2RigNodeOnly.blend) | Older fan animation work and rig | Archived precursor, useful for studying joint layout. Verify its license and provenance per file. |
| [ShadowFightAnimationTool](https://github.com/UAETeams/ShadowFightAnimationTool) | C++ animation deserializer for the latest Shadow Fight series | Repo reports MIT licensing. **SF2 compatibility was not demonstrated in this search**, so test on a known SF2 file before depending on it. |

For our browser game, the right technical takeaway is an **original articulated fighter rig** with smooth keyframe interpolation, stable bone lengths, separate attack poses, foot planting, and responsive transitions. A reference asset file does not automatically become a browser ready sprite, model, or animation.

## 3. Source code and reverse engineering projects

| Source | What it contains | Access / rights / relevance |
|---|---|---|
| [Project Eclipse public repo](https://github.com/samir419/ProjectEclipse), [developed fork](https://github.com/kaankutluturk/ProjectEclipse), and [fork ZIP](https://github.com/kaankutluturk/ProjectEclipse/archive/refs/heads/main.zip) | Exported Unity project with recovered SF2 code/assets, art catalog, vanilla gameplay XML, deobfuscation workflow, modding tools, and Eclipse-written additions. The developed fork documents local two-player versus and a desktop/Android build pipeline. | **Public source-like collection, but no clear license allowing reuse of recovered Nekki code or assets.** This is a Unity project, not a browser starter. Study architecture and file layout; do not incorporate the recovered game files into a distributable UMBRA build without rights. The original `dawc17/ProjectEclipse` URL currently returned 404, while these two forks opened. |
| [SF2Recomp](https://github.com/bipinkrish/sf2recomp) and [releases](https://github.com/bipinkrish/sf2recomp/releases) | Open source static recompilation and native platform support for the Switch edition | **Code, MIT for its additions.** Does **not** include the original game executable, assets, or keys. Requires a legally owned Switch game dump and required keys. Native project, not a drop-in browser engine. |
| [SF2Recomp LAN sparring design](https://github.com/bipinkrish/sf2recomp/blob/master/docs/lan-sparring.md) | Deterministic synchronized input design for local network sparring | Excellent architecture reference for 1v1. The documented native solution uses fixed 60-step simulation, a small input delay, and no rollback. Browser internet play will need latency testing and likely stronger netcode. |
| [Shadow Fight 2 PS Vita port](https://github.com/franciscoclou/shadowfight2-vita) and [reverse engineering notes](https://github.com/franciscoclou/shadowfight2-vita/blob/main/docs/RE_NOTES.md) | Loader for an old Android Marmalade build, with notes on `.s3e` layout | **Code, check repo license.** Needs the user's own APK and does not include game code or data. Technical history, low value for our browser runtime. |
| [shadowfight2_s3e_idb](https://github.com/autisoid/shadowfight2_s3e_idb) | IDA database for old `.s3e` builds | **Reverse engineering artifact, not source code.** Version specific, unclear reuse rights, low priority for our project. |
| [AutoShadow](https://github.com/NikkaGames/AutoShadow) | Android Unity/IL2CPP modding and dumping tool | Android specific, not browser combat code. Check version support and licensing. |
| [sf2mod](https://github.com/moltinginstar/sf2mod) and [writeup](https://github.com/moltinginstar/sf2mod/blob/main/WRITEUP.md) | SF2 save/hash format analysis | Narrowly useful for understanding old game data, not for our 1v1 combat engine. |
| [Stalker](https://github.com/onerdna/stalker) | Flutter SF2 save viewer/editor | GPL-3.0 according to repo. Save tooling, little direct value to a no-story 1v1 game. |
| [sf2tools](https://github.com/Lowi9179/sf2tools) | Work-in-progress node/tooling experiments | Early tooling; inspect before relying on it. |
| [sf2-se-research](https://github.com/steven-vvv/sf2-se-research) | Research on Unity IL2CPP data access in Special Edition 3.0.9, plus a separately released helper | MIT for author's notes/tools. About save/runtime values, not combat or browser code. Version specific. |
| [shadowfight-restored](https://github.com/gitnurdun/shadowfight-restored) | Offline restoration and modified game builds | Game content/code are not a freely licensed browser starter. Its own repo cautions that game content has no permissive license. Use only as reference if you have appropriate access. |

## 4. Independent fighting game code that could shorten our build

| Source | What it contains | Access / fit |
|---|---|---|
| [ShadowClash](https://github.com/Yoi-Nakama/ShadowClash) | HTML5 Canvas browser fighting prototype with fighters, weapons, AI, and touch controls | Repo has an **MIT license for the author's code**. This is the closest browser starter found. Review code quality and dependencies. Its named SF2 characters and other potentially copied content are not cleared by MIT. |
| [Full-Gor/fight](https://github.com/Full-Gor/fight) | Kotlin/LibGDX Shadow Fight 2 inspired clone | Android/desktop code, small project. I did not find a clear reuse license; educational README language is not a license. Porting work would be needed. |
| [StickMan](https://github.com/redeyessssss/StickMan) | Canvas stick fighter | Browser combat patterns, but no clear license verified. Review concepts; do not copy code without permission. |
| [Shadow-fight-2-AI](https://github.com/TheRealRazbi/Shadow-fight-2-AI) | Python DQN agent trained on screen images | MIT licensed agent code; possible inspiration for bot evaluation. A scripted, readable practice bot is more practical for our first release. |
| [ShadowFightAnalysis](https://github.com/The-Dark-Productions/ShadowFightAnalysis) | Python/OpenCV screenshot analysis | Research utility, not an in-game bot or engine. |

I also checked GitHub search for additional SF2 clones, source releases, extractors, and ports. Many results were save editors, modded APK mirrors, tiny coursework projects, empty repos, or forks of the same files. Those are not equivalent to a game source release, and I excluded unverified executable mirrors from the recommended path.

## 5. Direct art and sound reference indexes

These are **ripped game content**, not original open game art or licensed production assets. Use them to inspect visual language and sound categories. If we want to ship exact files, we need Nekki's permission.

### Sprites and backgrounds

| Link | Listed content | Access |
|---|---|---|
| [Shadow Fight 2 sprite hub](https://www.spriters-resource.com/mobile/shadowfight2/) | Index of visible packs | Open page. |
| [Effects](https://www.spriters-resource.com/mobile/shadowfight2/asset/144594/) | 11 listed items | Open asset page / download control. |
| [Locations](https://www.spriters-resource.com/mobile/shadowfight2/asset/144593/) | 28 listed images | Open asset page / download control. |
| [User icons](https://www.spriters-resource.com/mobile/shadowfight2/asset/144595/) | 66 listed images | Open asset page / download control. |

### Sound effects

| Link | Listed content | Access |
|---|---|---|
| [Shadow Fight 2 sound hub](https://sounds.spriters-resource.com/mobile/shadowfight2/) | Index of four sound packs | Open page. |
| [Characters](https://sounds.spriters-resource.com/mobile/shadowfight2/asset/430524/) | 97 listed sound items | Open asset page / download control. |
| [Magic](https://sounds.spriters-resource.com/mobile/shadowfight2/asset/430525/) | 65 listed sound items | Open asset page / download control. |
| [Menu](https://sounds.spriters-resource.com/mobile/shadowfight2/asset/430526/) | Menu sounds | **403 Forbidden in my web reader.** Try the direct link in your browser. |
| [Weapons](https://sounds.spriters-resource.com/mobile/shadowfight2/asset/430527/) | 42 listed sound items | Open asset page / download control. |

I did not find a verified, complete public pack of every boss rig, every move, and every weapon with a license allowing us to redistribute them. The asset archive linked from Gymnast is the broadest lead, but it needs manual inspection and does not confer reuse rights.

## 6. Bosses, weapons, move data, and audiovisual study

| Reference | What it helps with | Limit |
|---|---|---|
| [SF2 bosses](https://shadowfight.fandom.com/wiki/Bosses_%28SF2%29) | Names, weapons, abilities, and boss structure | Fan maintained, crosscheck against the game. Exact characters remain Nekki content. |
| [SF2 weapons category](https://shadowfight.fandom.com/wiki/Category%3ASF2_Weapons) | Large weapon index | Fan data; not a ready balance table. |
| [Weapon classes](https://shadowfight.fandom.com/wiki/Weapon_%28SF2%29/Weapon_Classes) | Category taxonomy and fighting styles | Useful for original move class design. |
| [Fighters list](https://shadowfight.fandom.com/wiki/Fighters) | Roster research | Fan data, not a license. |
| [SF2 soundtrack wiki](https://shadowfight.fandom.com/wiki/Soundtrack_%28SF2%29) | Track names and composer research | Fan index; audio rights remain with owners. |
| [Animation showcase video](https://www.youtube.com/watch?v=GtTChwLVVdU) | Visual survey of general, magic, ranged, weapon, and Titan animations | Fan recording of an older build, not source frames. |
| [Apple Music soundtrack Vol. 2](https://music.apple.com/us/album/shadow-fight-2-original-game-soundtrack-vol-2/1630994549) | Official soundtrack listening/purchase | **Purchase or subscription may be required** for full tracks. No license to put tracks in another game. |
| [Qobuz soundtrack Vol. 2](https://www.qobuz.com/ca-en/album/shadow-fight-2-original-game-soundtrack-vol-2-nekki-games-amp-lind-erebros/f6wsznl2ohnab) | Official soundtrack listing/purchase | **Purchase or subscription may be required.** Regional availability differs. |
| [Community notes on SF2 XML files](https://www.reddit.com/r/ShadowFight2dojo/comments/1t5kngb/things_ive_learned_messing_with_xml_files_in/) | Names and roles of game config files | Informal, version specific, not a verified full data dump. |

For our game, the useful design extraction is a set of **original** weapon archetypes with unique range, startup, recovery, pushback, combo routes, and counters. The Fandom data and gameplay recordings can help us define those categories; they should not be copied verbatim into a clone roster.

## 7. Links with access barriers or no verified release

| Link | Barrier observed | What you can try |
|---|---|---|
| [Gymnast Shadow Fight 2 Assets.zip](https://drive.google.com/file/d/1jZDNW6Ph6IOkBLoTV5yEWbNvtp8v8YBp/view?usp=drive_link) | Google sign-in page in my web reader; I could not inspect archive contents | Open while signed into Google. Share a file listing if you want me to map formats, with rights kept separate. |
| [Nintendo Switch game](https://www.nintendo.com/us/store/products/shadow-fight-2-switch/) for [SF2Recomp](https://github.com/bipinkrish/sf2recomp) | Paid game plus user-supplied dump/keys required | Buy/use your own copy if studying that version. The recomp repo itself is public. |
| [Android Special Edition](https://play.google.com/store/apps/details?id=com.nekki.shadowfight2.paid) | Paid store build | Buy through the official store if you need that edition as a reference. |
| [iOS Special Edition](https://apps.apple.com/us/app/shadow-fight-2-special-edition/id1261834568) | Paid store build | Buy through the official store if needed. |
| [Sound Resource Menu pack](https://sounds.spriters-resource.com/mobile/shadowfight2/asset/430526/) | 403 Forbidden to my web reader | Try the normal browser directly. |
| [Gymnast release assets](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite/releases) | Dynamic GitHub attachment list failed to render in my reader | Open Releases in a normal browser or download the repository source. |
| [Fandom SF2 pages](https://shadowfight.fandom.com/wiki/Bosses_%28SF2%29) | Some direct requests were blocked by the web reader's robots handling, while search snippets were indexed | Open directly in your browser. |
| [Original Project Eclipse URL](https://github.com/dawc17/ProjectEclipse) | **404 Not Found** in my web reader, though [two forks](https://github.com/samir419/ProjectEclipse) remain public | Use the accessible forks for research. No clear license for recovered Nekki material was visible. |
| [Forge announcement](https://www.reddit.com/r/ShadowFight2dojo/comments/1x7j8s4/introducing_forge_a_new_modding_tool_for_shadow/) | Author says public source is planned; no verified release found | Monitor its updates; it is not yet a source download. |
| [Definitive Edition mod post](https://www.reddit.com/r/ShadowFight2dojo/comments/1qxuouc/its_finally_done_sf2_definitive_edition/) and [MediaFire ZIP](https://www.mediafire.com/file/qloitol70af02va/ShadowFight2.zip/file) | A community modified game bundle, **not** a licensed engine/source release. MediaFire download was inaccessible to my web reader | Manual browser access may work. Verify provenance before opening an executable; do not use its copyrighted content in our game. |

There may be other private Discord, Drive, MEGA, or paywalled collections. I cannot verify a complete inventory of every private archive on the internet, and a file offered behind a payment page is not automatically licensed for reuse. If you find a specific archive, send its link and I can evaluate its contents, provenance, and practical value.

## 8. Recommended acquisition order for our project

1. **Study the actual feel:** play the [official web version](https://shadowfight2.com/play/) and, if desired, the [Switch local sparring version](https://www.nintendo.com/us/store/products/shadow-fight-2-switch/). Capture our own notes for silhouettes, timings, weapon reach, hit pause, knockback, transitions, and audio mix.
2. **Map the recovered project without importing it:** inspect [Project Eclipse](https://github.com/samir419/ProjectEclipse) or its [developed fork](https://github.com/kaankutluturk/ProjectEclipse) for animation formats, config categories, move organization, and local versus behavior. Do not treat recovered game code/art as reusable UMBRA production files.
3. **Get animation know-how:** download [Gymnast Tool Suite](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite) source and read its [wiki](https://github.com/FlipThoseTitle/Gymnast-Tool-Suite/wiki). Share any sample **original rig/scene** it includes; I can use the ideas to replace our current crude figures with smooth original articulated fighters.
4. **Inspect browser code:** review [ShadowClash](https://github.com/Yoi-Nakama/ShadowClash) for input, rendering, touch, and AI patterns. Reuse licensed code only after checking quality and removing any unlicensed game-specific content.
5. **Design online 1v1:** study [SF2Recomp LAN sparring](https://github.com/bipinkrish/sf2recomp/blob/master/docs/lan-sparring.md) as a deterministic simulation reference. Build a browser suitable networking layer with measurable latency and synchronization.
6. **Use ripped packs only as reference:** the [Gymnast linked archive](https://drive.google.com/file/d/1jZDNW6Ph6IOkBLoTV5yEWbNvtp8v8YBp/view?usp=drive_link), [sprite packs](https://www.spriters-resource.com/mobile/shadowfight2/), and [sound packs](https://sounds.spriters-resource.com/mobile/shadowfight2/) can tell us what categories and details exist. Create new art, music, and effects for UMBRA unless Nekki grants a license.

### Files most useful to send me

- A ZIP of the **Gymnast source/add-on** and any openly licensed sample `.blend` scenes you choose to download.
- A directory listing or screenshots of the Google Drive asset archive, if you can access it, so I can identify formats and scope before working with it. Keep its exact game assets out of any distributable build unless you have the rights.
- Any written **license/permission** covering an asset pack or codebase you want incorporated.
- A link to a new source, mod engine, or archive that this catalog missed. I can check whether it actually contains code, data, or only a modified APK.

This catalog is a broad, verified search as of the research date, not a guarantee that every private or newly published file on the internet has been located. The strongest practical path is to use the open tooling and technical notes to create a polished original browser fighter, then add networked 1v1 after the local combat simulation is stable.
