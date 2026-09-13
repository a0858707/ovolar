import './style.css';

type Route = 'home' | 'block' | '2048' | 'snake';

const app = document.querySelector<HTMLElement>('#app');

if (!app) throw new Error('Ovolar app root is missing.');

const homeMarkup = `
  <main class="app-shell home-shell">
    <header class="home-header">
      <div class="brand" aria-label="Ovolar">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>OVOLAR</span>
      </div>
      <p>Pick a game</p>
    </header>

    <section class="game-cards" aria-label="Games">
      <article class="game-card block-card">
        <span class="game-card-icon" aria-hidden="true">▦</span>
        <div class="game-card-copy">
          <h1>Ovolar Block</h1>
          <p>Classic falling-block puzzle</p>
        </div>
        <button class="primary-button card-play" type="button" data-open-block>Play <span aria-hidden="true">→</span></button>
      </article>

      <article class="game-card twenty48-card">
        <span class="game-card-icon" aria-hidden="true">2048</span>
        <div class="game-card-copy">
          <h1>Ovolar 2048</h1>
          <p>Merge tiles. Reach 2048.</p>
        </div>
        <button class="primary-button card-play" type="button" data-open-2048>Play <span aria-hidden="true">→</span></button>
      </article>

      <article class="game-card snake-card">
        <span class="game-card-icon" aria-hidden="true">⌁</span>
        <div class="game-card-copy">
          <h1>Ovolar Snake</h1>
          <p>Eat. Grow. Don’t crash.</p>
        </div>
        <button class="primary-button card-play" type="button" data-open-snake>Play <span aria-hidden="true">→</span></button>
      </article>
    </section>
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
      </div>
      <div class="twenty48-frame">
        <div id="twenty48-board" class="twenty48-board" aria-label="2048 board"></div>
        <div id="twenty48-overlay" class="twenty48-overlay" hidden>
          <p class="eyebrow">OVOLAR 2048</p><h1 id="twenty48-overlay-title"></h1><p id="twenty48-overlay-text"></p>
          <div class="twenty48-overlay-actions"><button id="twenty48-continue" class="primary-button" type="button">Continue</button><button class="secondary-button" type="button" data-twenty48-restart>Restart</button></div>
        </div>
      </div>
      <p class="twenty48-hint">Swipe any direction to merge</p>
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
      <div class="snake-stats"><div class="score-card main-score"><span class="label">Score</span><output id="snake-score">0</output></div><div class="score-card"><span class="label">Best</span><output id="snake-best">0</output></div></div>
      <div class="snake-frame">
        <div id="snake-board" class="snake-board" aria-label="Snake board"></div>
        <div id="snake-overlay" class="snake-overlay" hidden><p class="eyebrow">OVOLAR SNAKE</p><h1 id="snake-overlay-title"></h1><p id="snake-overlay-text"></p><div class="snake-overlay-actions"><button id="snake-resume" class="primary-button" type="button">Resume</button><button class="secondary-button" type="button" data-snake-restart>Restart</button></div></div>
      </div>
      <p class="snake-hint">Swipe to steer</p>
      <button class="secondary-button snake-restart" type="button" data-snake-restart>Restart</button>
    </section>
  </main>
`;

const route: Route = window.location.hash === '#/block' ? 'block' : window.location.hash === '#/2048' ? '2048' : window.location.hash === '#/snake' ? 'snake' : 'home';
document.body.dataset.route = route;

if (route === 'home') {
  document.title = 'Ovolar';
  app.innerHTML = homeMarkup;
  app.querySelector<HTMLButtonElement>('[data-open-block]')?.addEventListener('click', () => {
    window.location.hash = '#/block';
  });
  app.querySelector<HTMLButtonElement>('[data-open-2048]')?.addEventListener('click', () => {
    window.location.hash = '#/2048';
  });
  app.querySelector<HTMLButtonElement>('[data-open-snake]')?.addEventListener('click', () => {
    window.location.hash = '#/snake';
  });
} else {
  document.title = route === 'block' ? 'Ovolar Block' : route === '2048' ? 'Ovolar 2048' : 'Ovolar Snake';
  app.innerHTML = route === 'block' ? blockMarkup : route === '2048' ? twenty48Markup : snakeMarkup;
  app.querySelector<HTMLButtonElement>('[data-home]')?.addEventListener('click', () => {
    window.history.replaceState(null, '', '#/');
    window.location.reload();
  });
  void import(route === 'block' ? './main' : route === '2048' ? './twenty48' : './snake');
}

window.addEventListener('hashchange', () => window.location.reload());
