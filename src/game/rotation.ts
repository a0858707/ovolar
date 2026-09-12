export type Matrix = number[][];

export interface RotationResult {
  shape: Matrix;
  x: number;
  y: number;
}

type CollisionCheck = (shape: Matrix, x: number, y: number) => boolean;

// A deliberately small kick set: horizontal nudges for walls and upward nudges for floors.
// Every candidate still goes through the board collision check before it can be accepted.
const KICK_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0],
  [0, -1], [-1, -1], [1, -1], [0, -2],
];

export const rotateClockwise = (shape: Matrix): Matrix => {
  const size = shape.length;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => shape[size - 1 - x][y]),
  );
};

export const findClockwiseRotation = (
  shape: Matrix,
  x: number,
  y: number,
  collides: CollisionCheck,
): RotationResult | null => {
  const rotated = rotateClockwise(shape);
  for (const [kickX, kickY] of KICK_OFFSETS) {
    const candidateX = x + kickX;
    const candidateY = y + kickY;
    if (!collides(rotated, candidateX, candidateY)) {
      return { shape: rotated, x: candidateX, y: candidateY };
    }
  }
  return null;
};
