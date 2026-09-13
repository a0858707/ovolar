# MULTIGAME_SPEC.md — Ovolar 3-Game MVP

## 1. Goal

Transform the current single-game project into one lightweight multi-game app.

The first version contains:

- Ovolar Block
- Ovolar 2048
- Ovolar Snake

This is one product, one web app and one Android package.

## 2. Navigation model

Recommended app states:

- `home`
- `block`
- `2048`
- `snake`

A lightweight state-based shell is sufficient.

A full routing framework is not required unless the repository already uses one.

Expected behavior:

```text
Launch app
   ↓
Ovolar Home
   ├── Block
   ├── 2048
   └── Snake

Inside any game:
   ← Home
```

For browser use, optional URL/hash states are acceptable, for example:
- `#/`
- `#/block`
- `#/2048`
- `#/snake`

But URL routing is not required for the Android MVP.

## 3. Home screen

### Header

Display:
- Ovolar logo/name
- short subtitle such as: `Pick a game`

### Game cards

Three cards.

#### Ovolar Block
Description:
`Classic falling-block puzzle`

#### Ovolar 2048
Description:
`Merge tiles. Reach 2048.`

#### Ovolar Snake
Description:
`Eat. Grow. Don’t crash.`

Each card:
- title
- visual thumbnail/icon
- one-line description
- large tap target
- opens immediately

Do not add settings/account/store tabs yet.

## 4. Shared game header

Each game should have a compact shared top bar:

```text
← Ovolar          Game Name
```

Optional:
- pause
- restart

Do not make the header consume excessive mobile height.

## 5. Shared visual direction

Keep the current Ovolar dark-game aesthetic.

Design goals:
- dark navy/blue background
- bright game colors
- rounded panels
- high contrast
- minimal text
- large mobile controls
- clean modern casual-game feel

Avoid:
- heavy gradients everywhere
- complex 3D
- asset-heavy screens
- large animation libraries

## 6. Ovolar Block layout

Preserve the current game.

Mobile layout must fit inside one usable viewport.

Priority order:
1. game board
2. score/best/level
3. controls
4. secondary information

Touch controls:
- left
- right
- rotate
- soft drop
- hard drop

All controls must stay visible.

## 7. Ovolar 2048 detailed behavior

### Board

- 4x4
- starts with two tiles
- each valid move spawns one new tile
- typical spawn distribution:
  - 2: 90%
  - 4: 10%

### Move rules

- compress tiles toward move direction
- merge equal adjacent tiles
- a tile may merge only once per move
- compress again after merging
- invalid moves do not spawn a tile

### Scoring

When two tiles merge:
- add the resulting tile value to score

Example:
- 8 + 8 → 16
- score += 16

### Win

When 2048 is first created:
- show a lightweight win overlay
- actions:
  - Continue
  - Restart

The user may continue beyond 2048.

### Game over

Game over when:
- board is full
- no horizontal merge exists
- no vertical merge exists

### Controls

Mobile:
- swipe up/down/left/right

Desktop:
- arrow keys

Avoid interpreting tiny accidental movements as swipes.

### Persistence

Save:
- best score

Optional later:
- current board resume

Do not implement current-board resume unless trivial.

## 8. Ovolar Snake detailed behavior

### Board

Use a regular grid.

Recommended initial grid:
- 20x20 or similar

Choose dimensions based on mobile fit.

### Start

- snake starts near center
- initial length around 3
- initial direction should be deterministic

### Food

Food:
- spawns only on empty cells
- one food item at a time

### Movement

Snake advances on a timer.

Input changes direction.

Do not allow:
- left → right instantly
- right → left instantly
- up → down instantly
- down → up instantly

### Difficulty

Increase speed gradually based on score/food count.

Keep difficulty curve simple.

Example:
- start around 140–160ms per step
- reduce interval gradually
- enforce a reasonable minimum

### Scoring

Simple option:
- +1 per food

Display:
- Score
- Best

### Game over

Game ends on:
- wall collision
- self collision

Actions:
- Restart
- Home

### Controls

Mobile:
- swipe

Desktop:
- arrow keys
- optionally WASD

No on-screen D-pad required unless swipe proves unreliable.

## 9. Shared persistence

Suggested keys:

```text
ovolar.block.best
ovolar.2048.best
ovolar.snake.best
```

If old Block storage keys already exist:
- preserve compatibility where practical,
- migrate only if needed,
- do not wipe the existing best score unnecessarily.

## 10. Lifecycle behavior

For Capacitor/mobile:

When app goes to background:
- pause active game when appropriate

When app resumes:
- do not reset unexpectedly

Block:
- resume paused state

Snake:
- pause timer

2048:
- no special timer behavior required

## 11. Web behavior

Web version is for:
- quick testing
- sharing
- gameplay capture
- future marketing landing

Requirements:
- responsive
- keyboard support
- touch support
- no mandatory backend

## 12. Performance

Keep all games lightweight.

Avoid:
- unnecessary asset downloads
- giant dependencies
- large animation libraries

The app should feel instant on a normal Android phone.

## 13. Development sequence

Recommended implementation order:

### Phase 1
Finish current Android packaging for Block.

### Phase 2
Create Ovolar home shell.

### Phase 3
Move/integrate Block into the shell without rewriting it.

### Phase 4
Implement 2048.

### Phase 5
Implement Snake.

### Phase 6
Build and test Android APK with all 3 games.

### Phase 7
Physical-device QA.

## 14. QA checklist

### Home
- launches correctly
- all three game cards visible
- cards tappable
- no overflow
- Android back behavior acceptable

### Block
- movement
- rotate
- soft drop
- hard drop
- line clear
- score
- best score
- game over
- restart
- home navigation

### 2048
- all four swipes
- arrow keys
- merges correct
- no double merge bug
- valid spawn behavior
- score
- best score
- win state
- game over
- restart
- home navigation

### Snake
- all four directions
- no instant reversal
- food never spawns inside snake
- growth
- score
- speed increase
- wall collision
- self collision
- restart
- home navigation

### Android
- install
- launch
- portrait
- no browser chrome
- no unwanted scrolling
- safe areas
- background/resume
- offline launch
- debug APK path reported

## 15. Stop condition

Do not add fourth game until:
- all three games work,
- Android APK installs,
- physical-device QA is complete,
- obvious bugs are fixed.

The goal is not maximum game count yet.

The goal is a stable multi-game foundation.
