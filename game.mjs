import {
  p,
  sleep,
  abs,
  round,
  range,
  getRandomVec,
  getRandomPoint,
  setup,
  cleanup,
} from "./helpers.mjs";
import { LINES, WIDTH, HEIGHT, ON_CHAR, OFF_CHAR } from "./constants.mjs";

const pointToPixel = ([x, y]) => {
  return [round(x * (WIDTH - 1)), round(y * (HEIGHT - 1))];
};

const run = async () => {
  const lines = range(LINES).map(() => [getRandomPoint(), getRandomPoint()]);
  const velocities = range(LINES).map(() => [
    getRandomVec(2, 1 / 60),
    getRandomVec(2, 1 / 60),
  ]);

  // buffer for screen pixel values
  const screen = range(HEIGHT).map(() => range(WIDTH).fill(0));

  const drawLine = (line) => {
    // point coords
    const [[x0, y0], [x1, y1]] = line;

    // pixel coords:
    const [px0, py0] = pointToPixel([x0, y0]);
    const [px1, py1] = pointToPixel([x1, y1]);

    // determine which dimension has more change 0 = x, 1 = y
    const mainDirection = abs(px1 - px0) > abs(py1 - py0) ? 0 : 1;

    // draw the pixels
    if (mainDirection === 0) {
      const dx = px1 > px0 ? 1 : -1;
      for (let px = px0; (px1 - px) * dx > 0; px += dx) {
        const py = round(((px - px0) / (px1 - px0)) * (py1 - py0) + py0);
        screen[py][px] = 1;
      }
    } else {
      const dy = py1 > py0 ? 1 : -1;
      for (let py = py0; (py1 - py) * dy > 0; py += dy) {
        const px = round(((py - py0) / (py1 - py0)) * (px1 - px0) + px0);
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
      range(LINES).forEach((i) => {
        for (let j = 0; j < 4; j++) {
          const j0 = j >> 1;
          const j1 = j % 2;

          lines[i][j0][j1] += velocities[i][j0][j1];

          // if out of bounds, adjust position to be in bounds and flip velocity (i.e., bounce)
          const val = lines[i][j0][j1];
          if (val < 0 || val > 1) {
            lines[i][j0][j1] = Math.max(Math.min(val, 1), 0);
            velocities[i][j0][j1] *= -1;
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
