import type { GameId } from './platform';

export type GameCategory = 'Quick Play' | 'Logic & Numbers' | 'Elegant Classics' | 'Brain & Focus';
export type GameStatus = 'playable' | 'coming-soon';

export interface GameDefinition {
  id: GameId | 'mahjong-solitaire' | 'sudoku' | 'solitaire' | 'nonogram';
  title: string;
  description: string;
  category: GameCategory;
  route?: `#/${string}`;
  theme: string;
  bestScoreKey?: string;
  status: GameStatus;
  icon: string;
  load?: () => Promise<unknown>;
}

export const gameRegistry: readonly GameDefinition[] = [
  { id: 'block', title: 'Ovolar Block', description: 'Classic falling-block puzzle', category: 'Quick Play', route: '#/block', theme: 'aubergine-lime', bestScoreKey: 'ovolar.block.best', status: 'playable', icon: '▦', load: () => import('./main') },
  { id: 'snake', title: 'Ovolar Snake', description: 'Eat. Grow. Don’t crash.', category: 'Quick Play', route: '#/snake', theme: 'cranberry-pistachio', bestScoreKey: 'ovolar.snake.best', status: 'playable', icon: '⌁', load: () => import('./snake') },
  { id: '2048', title: 'Ovolar 2048', description: 'Merge tiles. Reach 2048.', category: 'Logic & Numbers', route: '#/2048', theme: 'olive-milk', bestScoreKey: 'ovolar.2048.best', status: 'playable', icon: '2048', load: () => import('./twenty48') },
  { id: 'sudoku', title: 'Sudoku', description: 'A calm number ritual.', category: 'Logic & Numbers', theme: 'dusty-blue-oak', status: 'coming-soon', icon: '⊞' },
  { id: 'mahjong-solitaire', title: 'Mahjong Solitaire', description: 'Pair tiles. Clear the table.', category: 'Elegant Classics', theme: 'chocolate-ice-blue', status: 'coming-soon', icon: '◫' },
  { id: 'solitaire', title: 'Solitaire', description: 'A familiar deck, unhurried.', category: 'Elegant Classics', theme: 'graphite-walnut', status: 'coming-soon', icon: '♢' },
  { id: 'nonogram', title: 'Nonogram', description: 'Reveal a picture, one clue at a time.', category: 'Brain & Focus', theme: 'terracotta-sand', status: 'coming-soon', icon: '▧' },
];

export const gameByRoute = (hash: string): GameDefinition | undefined => gameRegistry.find((game) => game.route === hash);

export const categories: readonly GameCategory[] = ['Quick Play', 'Logic & Numbers', 'Elegant Classics', 'Brain & Focus'];
