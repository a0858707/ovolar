/** Clears a fixed top band, leaving the lower stack and the active run intact. */
export const rescueBlockBoard = <T>(board: T[][], empty: T, clearanceRows = 8): T[][] =>
  board.map((row, index) => index < clearanceRows ? Array<T>(row.length).fill(empty) : [...row]);
