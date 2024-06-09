export const MAX_SCREEN_DIMENSION = 300;

// screen dimensions
const terminalDimensions = {
  width: process.stdout.columns - 1,
  height: process.stdout.rows - 1,
};

process.on("SIGWINCH", () => {
  terminalDimensions.width = process.stdout.columns - 1;
  terminalDimensions.height = process.stdout.rows - 1;
});
export const getWidth = () =>
  Math.min(terminalDimensions.width, MAX_SCREEN_DIMENSION);
export const getHeight = () =>
  Math.min(terminalDimensions.height, MAX_SCREEN_DIMENSION);

// render characters
export const ON_CHAR = "■";
export const OFF_CHAR = "_";

export const FPS = 120;

const TERM_CHAR_ASPECT = 1.85; // the monospace font aspect ratio, roughly

export const getCamera = () => ({
  pos: { x: 0, y: 0, z: 3.6 },
  direction: { x: 0, y: 0, z: -1 },
  up: { x: 0, y: 1, z: 0 },
  fov: Math.PI / 6, // (45 degrees)
  aspect: (getHeight() / getWidth()) * TERM_CHAR_ASPECT,
});
