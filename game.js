const fs = require("fs");

const p = (str) => process.stdout.write(str);
const sleep = async (ms) =>
  await new Promise((resolve) => setTimeout(resolve, ms));
const log = (...msg) => fs.appendFileSync("./log.txt", `${msg}\n`);
const { abs, round, floor, ceil } = Math;

const setup = () => {
  console.clear();
  process.stderr.write("\x1B[?25l"); // Hide cursor
};

const cleanup = () => {
  console.clear();
  process.stderr.write("\x1B[?25h"); // Show cursor
};

// screen dimensions
const WIDTH = 36;
const HEIGHT = 18;

const pointToPixel = ([x, y]) => {
  return [Math.round(x * (WIDTH - 1)), Math.round(y * (HEIGHT - 1))];
};

const run = async () => {
  const lines = [[0, 0, 1, 1]];

  // buffer for screen pixel values
  const screen = new Array(HEIGHT).fill().map(() => new Array(WIDTH).fill(0));

  const drawLine = (line) => {
    // point coords
    const [x0, y0, x1, y1] = line;
    // pixel coords:
    const a = pointToPixel([x0, y0]);
    const b = pointToPixel([x1, y1]);

    // determine which dimension has more change (0 = x, 1 = y)
    const dim = abs(b[0] - a[0]) > abs(b[1] - a[1]) ? 0 : 1;

    // determine which direction we're moving along this dimension
    const sign = b[dim] > a[dim] ? 1 : -1;

    // the (signed) length we'll travel in this dimension
    const span = b[dim] - a[dim];

    // the (signed) length we'll travel in the other dimension
    const otherSpan = b[1 - dim] - a[1 - dim];

    // follow dimension from a to b, tracking `c` along that dimension and calculating `d` for the other
    for (let c = a[dim]; c !== b[dim]; c += sign) {
      const d = round(((c - a[dim]) / span) * otherSpan + a[1 - dim]);
      const px = dim ? c : d;
      const py = dim ? d : c;
      screen[py][px] = 1;
    }
    // draw last point
    screen[end[1]][end[0]] = 1;
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
