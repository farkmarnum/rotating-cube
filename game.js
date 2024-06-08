const fs = require("fs");

const p = (str) => process.stdout.write(str);
const sleep = async (ms) =>
  await new Promise((resolve) => setTimeout(resolve, ms));
const log = (msg) => fs.appendFileSync("./log.txt", `${msg}\n`);

const setup = () => {
  console.clear();
  process.stderr.write("\x1B[?25l"); // Hide cursor
};

const cleanup = () => {
  console.clear();
  process.stderr.write("\x1B[?25h"); // Show cursor
};

// screen dimensions
const WIDTH = 30;
const HEIGHT = 15;

const pointToPixel = ([x, y]) => {
  return [Math.round(x * (WIDTH - 1)), Math.round(y * (HEIGHT - 1))];
};

const distance = ([x0, y0], [x1, y1]) => (x1 - x0) ** 2 + (y1 - y0) ** 2;

const run = async () => {
  const lines = [[0.25, 0.25, 0.5, 0.5]];

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

    if (mainDirection === 0) {
      const dx = px1 > px0 ? 1 : -1;
      for (let px = px0; (px += dx); (px1 - px0) * dx > 0) {
        const py = Math.round(((px - px0) / (px1 - px0)) * (py1 - py0));
        screen[py][px] = 1;
      }
    } else {
      const dy = py1 > py0 ? 1 : -1;
      for (let py = py0; (py += dy); (py1 - py0) * dy > 0) {
        const px = Math.round(((py - py0) / (py1 - py0)) * (px1 - px0));
        screen[py][px] = 1;
      }
    }
  };

  try {
    setup();

    while (true) {
      // start by clearing the screen
      console.clear();

      // draw the lines
      lines.forEach((line) => drawLine(line));

      // render the pixels
      for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
          p(screen[i][j] ? "#" : "_");
        }
        p("\n");
      }

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
