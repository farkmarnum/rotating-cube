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

    // the directions we'll be moving
    const dx = px1 === px0 ? 0 : px1 > px0 ? 1 : -1;
    const dy = py1 === py0 ? 0 : py1 > py0 ? 1 : -1;

    // current pixel
    let px = px0;
    let py = py0;

    // console.log("start");
    // console.log({ px0, py0 });
    // console.log({ px1, py1 });
    // console.log({ px, py });
    // console.log({ dx, dy });

    // draw the first point
    screen[py][px] = 1;

    let i = 0; // safety valve
    let slopeIfWeChangeX;
    let slopeIfWeChangeY;
    let slopeOfLine;
    let xSlopeDiff;
    let ySlopeDiff;
    console.log({ px0, py0 });
    console.log({ px1, py1 });
    try {
      while (px !== px1 || py !== py1) {
        if (i++ > 100) {
          console.log();
          console.log(JSON.stringify({ px, py, px0, py0, px1, py1 }));
          throw new Error("max loop exceeded!");
        }

        // figure where to go next, either [px + dx, py] or [px, py + dy]
        // for each point, we'll calculate the slope of line from it to [px1, py1]
        // and we'll pick the one whose slope is closer to the actual slope
        slopeIfWeChangeX = (py1 - py) / (px1 - (px + dx));
        slopeIfWeChangeY = (py1 - (py + dy)) / (px1 - px);
        slopeOfLine = (py1 - py0) / (px0 - px1);
        xSlopeDiff = Math.abs(slopeIfWeChangeX - slopeOfLine);
        ySlopeDiff = Math.abs(slopeIfWeChangeY - slopeOfLine);

        if (xSlopeDiff <= ySlopeDiff) px += dx;
        if (xSlopeDiff >= ySlopeDiff) py += dy;

        console.log({ px, py });

        // draw the point
        screen[py][px] = 1;
        // console.log(py, px);
      }
    } catch {
      console.log({
        slopeIfWeChangeX,
        slopeIfWeChangeY,
        slopeOfLine,
        xSlopeDiff,
        ySlopeDiff,
      });
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
