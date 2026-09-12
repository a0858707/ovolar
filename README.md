# Ovolar Block

A mobile-first falling-block puzzle game built with TypeScript, Phaser 3, and Vite. It has 7-bag tetromino spawning, scoring, gradually faster levels, keyboard and touch controls, restart support, and local best-score storage.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite (normally `http://localhost:5173`).

## Controls

- Left / Right arrows: move
- Up arrow: rotate clockwise
- Down arrow: soft drop
- Space: hard drop
- R: restart

On a phone, use the large controls at the bottom of the game. Hold left, right, or down after the initial tap to repeat that movement.

## Project layout

- `src/main.ts` contains the Phaser game scene and game rules.
- `src/style.css` contains the responsive mobile-first interface.
- Future features can be added as focused modules, for example `src/features/daily-challenges`, `src/features/leaderboard`, and platform-specific Capacitor setup, without changing the core game scene.
