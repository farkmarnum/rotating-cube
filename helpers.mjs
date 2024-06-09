import fs from "fs";

export const p = (str) => process.stdout.write(str);
export const sleep = async (ms) =>
  await new Promise((resolve) => setTimeout(resolve, ms));
export const log = (...msg) => fs.appendFileSync("./log.txt", `${msg}\n`);
export const { abs, sqrt, floor, round, ceil, random } = Math;
export const sum = (arr) => arr.reduce((a, b) => a + b);
export const range = (n) => [...Array(n).keys()];

/** Returns a vector with random values from -1.0 to 1.0 */
export const getRandomVec = (dimensions = 2, normalize = false) => {
  if (![1, 2, 3].includes(dimensions)) {
    throw new Error("dimensions must be 1, 2, or 3");
  }

  const coords = Array(dimensions)
    .fill()
    .map(() => (random() - 0.5) * 2);

  if (!normalize) return coords;

  const normalizeTo = normalize === true ? 1 : normalize;

  // Calculate the magnitude of the vector
  const magnitude = sqrt(sum(coords.map((v) => v * v)));

  // If the magnitude is zero, retry
  if (magnitude === 0) return getRandomUnitVector();

  // Normalize
  return coords.map((v) => (v / magnitude) * normalizeTo);
};

/** Returns a random [x,y] point in the domain [0,1] for each */
export const getRandomPoint = () => [Math.random(), Math.random()];

export const setup = () => {
  console.clear();
  process.stderr.write("\x1B[?25l"); // Hide cursor
};

export const cleanup = () => {
  console.clear();
  process.stderr.write("\x1B[?25h"); // Show cursor
};
