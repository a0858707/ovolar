# AGENTS.md — Ovolar Development Instructions

## Role

Act as the primary implementation engineer for Ovolar.

Work autonomously on engineering tasks, but keep scope controlled.

Do not ask for approval for routine technical decisions.

Ask only when a genuine product decision, credential, external account, paid service, or irreversible action is required.

## Source of truth

Before making changes, read:

1. `PRODUCT.md`
2. `MULTIGAME_SPEC.md`
3. the existing repository

The existing repository is the source of truth for current implementation details.

Do not assume code is missing without checking.

## Current product goal

Ship one Android app called Ovolar containing:

- Ovolar Block
- Ovolar 2048
- Ovolar Snake

Do not create three separate applications.

## Engineering priorities

Use this priority order:

1. keep existing working functionality intact,
2. fix blockers,
3. finish Android packaging,
4. build shared Ovolar app shell,
5. integrate Block,
6. implement 2048,
7. implement Snake,
8. test mobile behavior,
9. polish only where necessary.

## Important constraints

Do not add:
- backend,
- authentication,
- ads,
- analytics,
- leaderboards,
- multiplayer,
- Daily Challenge,
- additional games.

Do not rewrite working systems without a strong reason.

Prefer small targeted changes over broad refactors.

## Stack

Current preferred stack:

- TypeScript
- Phaser 3 where appropriate
- Vite
- Capacitor for Android

Use the current repository setup unless there is a clear blocker.

Do not introduce a new frontend framework simply for navigation or the home screen.

## Mobile-first rules

Always treat portrait mobile as the primary layout.

Requirements:
- use dynamic viewport sizing where appropriate (`100dvh` with fallback),
- respect safe-area insets,
- no required vertical scrolling during gameplay,
- prevent accidental zoom/scroll gestures,
- touch targets must remain visible,
- common narrow Android screens must work,
- desktop keyboard support must not regress.

## Ovolar Block

The existing Block implementation is already substantially complete.

Do not rebuild it.

Preserve:
- gameplay rules,
- scoring,
- 7-bag logic,
- rotation behavior,
- touch controls,
- local best score.

Only change it where required for:
- shared navigation,
- shared shell,
- bug fixes,
- mobile layout,
- visual consistency.

## Ovolar 2048

Implement a lightweight client-side version.

Must include:
- 4x4 grid,
- swipe controls,
- desktop arrow controls,
- score,
- local best score,
- restart,
- win state,
- game-over state,
- simple smooth movement/merge feedback.

Do not over-engineer the animation system.

## Ovolar Snake

Implement a lightweight client-side version.

Must include:
- grid-based snake,
- food spawning,
- growth,
- increasing speed,
- score,
- local best score,
- swipe controls,
- desktop controls,
- game over,
- restart.

Prevent illegal immediate 180-degree direction reversal.

## Shared app shell

Create one Ovolar home screen.

It should:
- show cards for Block, 2048 and Snake,
- open games inside the same app,
- provide a consistent back-to-home action,
- preserve a shared visual language,
- work in both browser and Capacitor.

Avoid unnecessary routing dependencies if a simple app-level state/router is sufficient.

## Storage

Use localStorage for MVP persistence.

Use distinct keys per game, for example:
- `ovolar.block.best`
- `ovolar.2048.best`
- `ovolar.snake.best`

Do not introduce database persistence.

## Android

Use Capacitor.

Target:
- app name: Ovolar
- application id: `games.ovolar.app`
- portrait orientation
- bundled local web assets
- offline-capable after install

Generate a debug APK.

Verify:
- build succeeds,
- app launches,
- game selection works,
- each game launches,
- back navigation works,
- background/resume does not break gameplay.

## Testing expectations

After meaningful changes:

- run `npm run build`,
- fix TypeScript/build errors,
- test affected functionality,
- check mobile viewport behavior.

For Android-related changes:
- sync Capacitor,
- build debug APK,
- report exact APK path.

Do not claim physical-device validation unless it actually happened.

## Reporting

After each meaningful chunk of work, report only:

1. what changed,
2. what was tested,
3. what remains,
4. blockers that genuinely need user input.

Avoid long essays unless asked.

## Token / context efficiency

Do not repeatedly re-audit the entire repository.

Read only the files needed for the current task when possible.

Do not perform large speculative refactors.

Do not spend time rewriting documentation unless requested.

Prefer completing one concrete milestone per session.
