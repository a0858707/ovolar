import './style.css';
import { categories, gameByRoute, gameRegistry } from './game-registry';
import { goHome, livesMarkup } from './platform';

const app = document.querySelector<HTMLElement>('#app');

if (!app) throw new Error('Ovolar app root is missing.');

const homeMarkup = (): string => `
  <main class="app-shell home-shell">
    <header class="home-header">
      <div class="brand" aria-label="Ovolar">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>OVOLAR</span>
      </div>
      <p>Pick a game</p>
    </header>

    <div class="library" aria-label="Games">
      ${categories.map((category) => {
        const games = gameRegistry.filter((game) => game.category === category);
        return `<section class="library-section" aria-labelledby="category-${category.replace(/ /g, '-').toLowerCase()}">
          <h1 id="category-${category.replace(/ /g, '-').toLowerCase()}" class="category-title">${category}</h1>
          <div class="game-cards">${games.map((game) => `<article class="game-card ${game.status === 'coming-soon' ? 'coming-soon-card' : ''}" data-theme="${game.theme}">
            <span class="game-card-icon" aria-hidden="true">${game.icon}</span>
            <div class="game-card-copy"><h2>${game.title}</h2><p>${game.description}</p></div>
            ${game.status === 'playable' ? `<button class="primary-button card-play" type="button" data-game-route="${game.route}">Play <span aria-hidden="true">→</span></button>` : '<span class="coming-soon">Coming soon</span>'}
          </article>`).join('')}</div>
        </section>`;
      }).join('')}
    </div>
  </main>
`;

const blockMarkup = `
  <main class="app-shell">
    <header class="topbar">
      <button class="home-button" type="button" data-home aria-label="Return to Ovolar home">
        <span aria-hidden="true">←</span>
        <span>OVOLAR</span>
      </button>
      <span class="game-title">BLOCK</span>
      <div class="header-actions">
        <button id="pause-button" class="icon-button" type="button" aria-label="Pause game" title="Pause game">Ⅱ</button>
        <button id="restart-top" class="icon-button" type="button" aria-label="Restart game" title="Restart game">↻</button>
      </div>
    </header>

    <section class="game-layout" aria-label="Ovolar Block game">
      <div class="play-column">
        <div class="game-frame">
          <div id="game-root" aria-label="Falling block game board"></div>
          <div id="game-over" class="game-over" hidden>
            <p class="eyebrow">RUN OVER</p>
            <h1>Stack reset.</h1>
            <p>Final score <strong id="final-score">0</strong></p>
            <p class="final-best">Best <strong id="final-best">0</strong></p>
            <button id="restart-overlay" class="primary-button" type="button">Play again</button>
          </div>
          <div id="pause-overlay" class="pause-overlay" hidden>
            <p class="eyebrow">PAUSED</p>
            <h1>Take a breath.</h1>
            <button id="resume-overlay" class="primary-button" type="button">Resume</button>
          </div>
          <div id="line-clear" class="line-clear" aria-live="polite" hidden></div>
        </div>
      </div>

      <aside class="score-panel" aria-label="Game statistics">
        <div class="score-card main-score">
          <span class="label">Score</span>
          <output id="score">0</output>
        </div>
        <div class="score-card">
          <span class="label">Best</span>
          <output id="best-score">0</output>
        </div>
        <div class="stat-row">
          <div><span class="label">Lines</span><output id="lines">0</output></div>
          <div><span class="label">Level</span><output id="level">1</output></div>
          ${livesMarkup('block-lives')}
        </div>
        <div class="next-card">
          <span class="label">Next</span>
          <div id="next-piece" class="next-piece" aria-label="Next piece"></div>
        </div>
        <p class="gesture-hint">Swipe to move · tap to turn · hold or drag down to drop</p>
        <p class="hint"><kbd>←</kbd><kbd>→</kbd> move &nbsp; <kbd>↑</kbd> turn<br /><kbd>↓</kbd> soft drop &nbsp; <kbd>Space</kbd> slam</p>
      </aside>
    </section>

    <nav class="touch-controls" aria-label="Touch game controls">
      <button class="control-button wide" type="button" data-action="left" aria-label="Move left">←</button>
      <button class="control-button wide" type="button" data-action="right" aria-label="Move right">→</button>
      <button class="control-button accent" type="button" data-action="rotate" aria-label="Rotate clockwise">↻</button>
      <button class="control-button" type="button" data-action="down" aria-label="Soft drop">↓</button>
      <button class="control-button hard-drop" type="button" data-action="drop" aria-label="Hard drop">⇩</button>
    </nav>
  </main>
`;

const twenty48Markup = `
  <main class="app-shell twenty48-shell">
    <header class="topbar">
      <button class="home-button" type="button" data-home aria-label="Return to Ovolar home"><span aria-hidden="true">←</span><span>OVOLAR</span></button>
      <span class="game-title">2048</span>
      <div class="header-actions"><button class="icon-button" type="button" data-twenty48-restart aria-label="Restart 2048" title="Restart 2048">↻</button></div>
    </header>
    <section class="twenty48-layout" aria-label="Ovolar 2048 game">
      <div class="twenty48-stats">
        <div class="score-card main-score"><span class="label">Score</span><output id="twenty48-score">0</output></div>
        <div class="score-card"><span class="label">Best</span><output id="twenty48-best">0</output></div>
        ${livesMarkup('twenty48-lives')}
      </div>
      <div class="twenty48-frame">
        <div id="twenty48-board" class="twenty48-board" aria-label="2048 board"></div>
        <div id="twenty48-overlay" class="twenty48-overlay" hidden>
          <p class="eyebrow">OVOLAR 2048</p><h1 id="twenty48-overlay-title"></h1><p id="twenty48-overlay-text"></p>
          <div class="twenty48-overlay-actions"><button id="twenty48-continue" class="primary-button" type="button">Continue</button><button class="secondary-button" type="button" data-twenty48-restart>Restart</button></div>
        </div>
      </div>
      <p class="twenty48-hint">Swipe any direction to merge</p>
      <p id="twenty48-life-notice" class="life-notice" aria-live="polite" hidden></p>
      <button class="secondary-button twenty48-restart" type="button" data-twenty48-restart>Restart</button>
    </section>
  </main>
`;

const snakeMarkup = `
  <main class="app-shell snake-shell">
    <header class="topbar">
      <button class="home-button" type="button" data-home aria-label="Return to Ovolar home"><span aria-hidden="true">←</span><span>OVOLAR</span></button>
      <span class="game-title">SNAKE</span>
      <div class="header-actions"><button id="snake-pause" class="icon-button" type="button" aria-label="Pause game" title="Pause game">Ⅱ</button><button class="icon-button" type="button" data-snake-restart aria-label="Restart Snake" title="Restart Snake">↻</button></div>
    </header>
    <section class="snake-layout" aria-label="Ovolar Snake game">
      <div class="snake-stats"><div class="score-card main-score"><span class="label">Score</span><output id="snake-score">0</output></div><div class="score-card"><span class="label">Best</span><output id="snake-best">0</output></div>${livesMarkup('snake-lives')}</div>
      <div class="snake-frame">
        <div id="snake-board" class="snake-board" aria-label="Snake board"></div>
        <div id="snake-overlay" class="snake-overlay" hidden><p class="eyebrow">OVOLAR SNAKE</p><h1 id="snake-overlay-title"></h1><p id="snake-overlay-text"></p><div class="snake-overlay-actions"><button id="snake-resume" class="primary-button" type="button">Resume</button><button class="secondary-button" type="button" data-snake-restart>Restart</button></div></div>
      </div>
      <p class="snake-hint">Swipe to steer</p>
      <button class="secondary-button snake-restart" type="button" data-snake-restart>Restart</button>
    </section>
  </main>
`;

const activeGame = gameByRoute(window.location.hash);
document.body.dataset.route = activeGame?.id ?? 'home';

if (!activeGame) {
  document.title = 'Ovolar';
  app.innerHTML = homeMarkup();
  app.querySelectorAll<HTMLButtonElement>('[data-game-route]').forEach((button) => {
    button.addEventListener('click', () => { window.location.hash = button.dataset.gameRoute!; });
  });
} else {
  document.title = activeGame.title;
  app.innerHTML = activeGame.id === 'block' ? blockMarkup : activeGame.id === '2048' ? twenty48Markup : snakeMarkup;
  app.querySelector<HTMLButtonElement>('[data-home]')?.addEventListener('click', () => {
    goHome();
  });
  void activeGame.load?.();
}

window.addEventListener('hashchange', () => window.location.reload());
