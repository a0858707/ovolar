# Ovolar — Product Definition

## 1. Product vision

Ovolar is a mobile-first mini-game hub: one app containing multiple simple, instantly understandable games.

The first release should prove that users are willing to:
- open the app,
- choose a game,
- play immediately,
- replay,
- return later.

The long-term direction is a large catalog of lightweight casual games inside one app, but the current scope is intentionally small.

## 2. MVP scope

The first multi-game MVP contains exactly three games:

1. Ovolar Block
2. Ovolar 2048
3. Ovolar Snake

All three games must live inside one application and one Android package.

Do not build separate apps for each game.

## 3. Core product principles

- Mobile portrait first.
- Very fast time-to-play.
- No account required.
- No backend required for the MVP.
- Fully usable offline.
- Shared Ovolar design language.
- Simple controls.
- Local best scores.
- Small bundle and simple architecture.
- Avoid unnecessary frameworks and abstraction.
- Prefer practical implementation over theoretical architecture.

## 4. Target platform

Primary:
- Android via Capacitor.

Secondary:
- Web version for testing and sharing.

Later:
- iOS.

## 5. Product structure

### Home screen

The app opens to an Ovolar home screen.

The home screen shows three game cards:
- Ovolar Block
- Ovolar 2048
- Ovolar Snake

Each card should include:
- game title,
- simple visual/icon,
- short one-line description,
- Play action.

Tapping a card opens the selected game inside the same app.

Each game must have a clearly visible way to return to the Ovolar home screen.

## 6. Shared app behavior

Shared across all games:
- Ovolar branding
- typography
- spacing
- button style
- dark/mobile-friendly visual language
- pause behavior where appropriate
- game-over UX
- restart UX
- best-score persistence using localStorage
- mobile portrait responsiveness

No authentication.
No cloud sync.
No leaderboard.
No ads yet.
No analytics yet.
No Daily Challenge yet.

These come only after the 3-game MVP works well on a real Android phone.

## 7. Game 1 — Ovolar Block

Ovolar Block is the existing falling-block game.

Current core mechanics:
- 10x20 board
- I/J/L/O/S/T/Z tetrominoes
- 7-bag randomizer
- left/right movement
- clockwise rotation
- basic wall/floor kicks
- soft drop
- hard drop
- collision detection
- line clearing
- score
- levels
- game over
- restart
- local best score
- keyboard controls
- mobile touch controls

Important:
Do not rewrite Ovolar Block from scratch.

Treat the current implementation as working code and only change it where required for:
- integration into the shared Ovolar shell,
- navigation,
- mobile fixes,
- bug fixes,
- visual consistency.

## 8. Game 2 — Ovolar 2048

Core rules:
- 4x4 board
- swipe controls on mobile
- arrow keys on desktop
- identical values merge once per move
- a new tile spawns after a valid move
- score increases based on merged tile values
- save best score locally
- restart action
- win state when reaching 2048
- allow continuing after 2048
- game over when no valid moves remain

UX:
- smooth tile movement
- merge feedback
- readable tile values
- no page scrolling while swiping
- portrait-friendly layout
- back-to-home control
- consistent Ovolar styling

Keep it fully client-side and offline.

## 9. Game 3 — Ovolar Snake

Core rules:
- grid-based snake movement
- food spawns on unoccupied cells
- eating food grows the snake
- score increases when food is eaten
- game ends on collision with wall or self
- speed increases gradually
- save best score locally
- restart action

Controls:
- swipe on mobile
- arrow keys / WASD on desktop
- prevent 180-degree instant reversal

UX:
- responsive portrait layout
- large readable board
- no accidental browser scroll
- clear game-over overlay
- back-to-home control
- consistent Ovolar styling

Keep it fully client-side and offline.

## 10. Android requirements

Use Capacitor.

App name:
Ovolar

Suggested application id:
games.ovolar.app

Requirements:
- portrait orientation
- local bundled web assets
- no development server dependency
- debug APK builds successfully
- launches on physical Android device
- works offline after install
- safe-area aware
- correct behavior after background/resume

## 11. Definition of MVP complete

The 3-game MVP is complete when:

- Ovolar launches to the home screen.
- Block, 2048 and Snake can all be launched.
- All games work on a physical Android phone.
- All games can return to the home screen.
- No vertical scrolling is required during gameplay.
- Touch controls work reliably.
- Best scores persist locally.
- App survives background/resume.
- Debug APK builds and installs.
- `npm run build` passes.
- No obvious runtime errors appear.

## 12. Explicitly out of scope for now

Do not implement yet:
- backend
- Supabase
- Firebase
- authentication
- cloud save
- leaderboards
- multiplayer
- ads
- subscriptions
- purchases
- analytics
- Daily Challenge
- push notifications
- social login
- user profiles
- more than 3 games

Finish the 3-game app first.
