const fs = require("fs");

const p = (str) => process.stdout.write(str);
const sleep = async (ms) =>
  await new Promise((resolve) => setTimeout(resolve, ms));
const log = (...msg) => fs.appendFileSync("./log.txt", `${msg}\n`);

const getRandomUnitVector = () => {
  const x = Math.random() * 2 - 1;
  const y = Math.random() * 2 - 1;

  // Calculate the magnitude of the vector
  const magnitude = Math.sqrt(x * x + y * y);

  // If the magnitude is zero, retry
  if (magnitude === 0) return getRandomUnitVector();

  // Normalize
  return [x / magnitude, y / magnitude];
};

const setup = () => {
  console.clear();
  process.stderr.write("\x1B[?25l"); // Hide cursor
};

const cleanup = () => {
  console.clear();
  process.stderr.write("\x1B[?25h"); // Show cursor
};

const pointToPixel = ([x, y]) => {
  return [Math.round(x * (WIDTH - 1)), Math.round(y * (HEIGHT - 1))];
};

// number of lines to render
const LINES = 10;

// screen dimensions
const WIDTH = 64;
const HEIGHT = 32;

// render characters
const ON_CHAR = "■";
const OFF_CHAR = " ";

const run = async () => {
  const lines = Array(LINES)
    .fill()
    .map(() => [Math.random(), Math.random(), Math.random(), Math.random()]);
  const velocities = lines.map(() => [
    ...getRandomUnitVector().map((v) => v / 60),
    ...getRandomUnitVector().map((v) => v / 60),
  ]);

  // buffer for screen pixel values
  const screen = new Array(HEIGHT).fill().map(() => new Array(WIDTH).fill(0));

  const drawLine = (line) => {
    // point coords
    const [x0, y0, x1, y1] = line;

    // pixel coords:
    const [px0, py0] = pointToPixel([x0, y0]);
    const [px1, py1] = pointToPixel([x1, y1]);

    // determine which dimension has more change 0 = x, 1 = y
    const mainDirection = Math.abs(px1 - px0) > Math.abs(py1 - py0) ? 0 : 1;

    // draw the pixels
    if (mainDirection === 0) {
      const dx = px1 > px0 ? 1 : -1;
      for (let px = px0; (px1 - px) * dx > 0; px += dx) {
        const py = Math.round(((px - px0) / (px1 - px0)) * (py1 - py0) + py0);
        screen[py][px] = 1;
      }
    } else {
      const dy = py1 > py0 ? 1 : -1;
      for (let py = py0; (py1 - py) * dy > 0; py += dy) {
        const px = Math.round(((py - py0) / (py1 - py0)) * (px1 - px0) + px0);
        screen[py][px] = 1;
      }
    }
    // draw the last pixel
    screen[py1][px1] = 1;
  };

  try {
    setup();

    while (true) {
      // start by clearing the console
      console.clear();

      // reset the screen buffer
      for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
          screen[i][j] = 0;
        }
      }

      // draw the lines
      lines.forEach((line) => drawLine(line));

      // render the pixels
      for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
          p(screen[i][j] ? ON_CHAR : OFF_CHAR);
        }
        p("\n");
      }

      // move the points
      lines.forEach((_line, i) => {
        for (j = 0; j < 4; j++) {
          // log(lines[i][i], velocities[i][j]);
          lines[i][j] += velocities[i][j];

          // log(`lines[${i}][${j}] += ${velocities[i][j]} (now: ${lines[i][i]})`);

          if (lines[i][j] < 0) {
            lines[i][j] = 0;
            velocities[i][j] *= -1;
          }
          if (lines[i][j] > 1) {
            lines[i][j] = 1;
            velocities[i][j] *= -1;
          }
        }
      });

      // wait for next frame
      await sleep(1000 / 60); // 60 fps
    }
  } finally {
    cleanup();
  }
};

// quit gracefully
process.on("SIGINT", () => {
  cleanup();
  process.exit();
});

run();
