# Cat Burglar: The Amber Gallery

[![make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/bangpateng/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/bangpateng/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A stealth heist game for the [make.fun](https://make.fun/bounty/best-heist-game-20261122-0559) **best heist game** bounty. One thief, three museum rooms, one very shiny star.

## The game

You are Moth, a cat burglar with one night to empty the Amber Gallery. Each room is a single screen: cross it, dodge the guards' vision cones and the sweeping security cameras, pocket the loot, steal the star, and slip out the green exit before the alarm locks you in.

- **Guards** patrol waypoints and watch a yellow cone. Get seen and their suspicion climbs — at full, they chase you down.
- **Cameras** sweep red cones across the room. Being spotted fills the **alarm meter** fast.
- **Alarm meter** (top of the screen): at 100% the museum locks down for 8 seconds and every guard converges on you.
- **Tools**: toss a **coin** (E or click) to lure a guard away; pop a **smoke pellet** (Q) to blind guards and cameras.
- **Sneak** (Shift) to move slow and silent; hide in the **shadow patches** where suspicion grows half as fast; mind the **lasers** in rooms 2 and 3 — they blink on and off.
- **Score**: loot values + time bonus + a 400-point ghost bonus for finishing a room with the alarm never past 50%.

Three rooms — The Amber Gallery, The Vault Corridor, The Penthouse — then the getaway screen and your rank, from Amateur Burglar to Master Thief.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak (slow, silent, half suspicion) |
| E or mouse click | Toss a coin toward the mouse |
| Q | Smoke pellet |
| R | Restart the room |
| M | Mute |
| Enter | Start / continue |

## Play it

No build step, no network — plain static files:

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static server. The game runs on a single `<canvas>` with synthesised WebAudio sound effects (no audio files).

## Layout

- `game/index.html` — the page and its canvas
- `game/src/main.js` — boot, game loop, alarm, loot, lockdown, screens
- `game/src/levels.js` — the three rooms (walls, guards, cameras, lasers, loot)
- `game/src/guards.js` — guard patrol, suspicion, chase and investigate AI
- `game/src/cameras.js` — security camera sweep and spotting
- `game/src/player.js` — the thief: movement, sneaking, coin and smoke
- `game/src/vision.js` — line of sight, vision cones, collision math
- `game/src/render.js` — all canvas drawing: room, cones, HUD, screens
- `game/src/audio.js` — synthesised sound effects (WebAudio, no files)
- `game/src/input.js` — keyboard and mouse
- `game/src/shots.js` — staged screenshot scenes (`?shot=cover|play|alarm|win`)
- `main.ts` — the make.fun hand-in program (writes `game/`, `screenshots/`, `dossier.json`)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Screenshots

`?shot=cover` (title over room 1), `?shot=play` (mid-heist), `?shot=alarm` (lockdown chase in room 2), `?shot=win` (the getaway) — each a real render of the game's own code, frozen at one frame.

## License

MIT — see [LICENSE](LICENSE).
