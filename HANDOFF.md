# Handoff

## Run
```
npm install
npm run server      # room relay on :8787 (needed for Online)
npm run dev         # game on the Vite URL
npm test            # 35 tests
npm run bake        # after editing any move animation
npx vite-node tools/net-soak.ts -- 45 50 20   # real-relay soak (relay must be running)
```
Online: one player clicks Online → Create room and sends the link (`?room=CODE`); the other opens it. Both pick a fighter and press Ready. Set `VITE_RELAY_URL` (or `?relay=wss://...`) when the relay is hosted elsewhere.

## Layout
- `src/content/` fighters (frame data + keyframes), rig math, baker, compiled roster
- `src/sim/` deterministic sim (no DOM)
- `src/render/` Pixi renderer, posing (planted-feet walk, sub-tick interpolation, reactions), figure drawing, VFX, stage
- `src/ai/bot.ts` bots and training dummies · `src/net/` rollback + room client · `server/relay.mjs`
- `src/ui/` controls (keyboard, gamepad, touch), HUD

## Adding a fighter
Copy `src/content/fighters/lynx.ts`, author moves with `strike()` keys (arms in absolute angles via `R`/`F`/`arms`), add it to `FIGHTER_DEFS` in `bake.ts` and `ROSTER` in `roster.ts`, run `npm run bake`, then `npm test`. The frame-data test will tell you if a move's geometry contradicts its hit level.

## Next actions
1. Hermit and Butcher kits (new families: paired blades with marked lightning; cleavers with ground quake).
2. Second arena; settings screen (volumes, remap, reduced flash/shake); training record/playback.
3. Deploy relay (Render) + static client (Vercel); test on separate networks and a phone.
