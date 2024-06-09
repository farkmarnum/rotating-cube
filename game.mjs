import { sleep, range, setup, cleanup, drawLine, max } from "./helpers.mjs";
import { WIDTH, HEIGHT, ON_CHAR, OFF_CHAR, FPS } from "./constants.mjs";

const p = (str) => process.stdout.write(str);

const run = async () => {
  // prettier-ignore
  const lines = [ 
    // unit cube:
    [-1, -1, -1, -1, -1,  1],
    [-1, -1, -1, -1,  1, -1],
    [-1, -1, -1,  1, -1, -1],
    [-1, -1,  1, -1,  1,  1],
    [-1, -1,  1,  1, -1,  1],
    [-1,  1, -1, -1,  1,  1],
    [-1,  1, -1,  1,  1, -1],
    [-1,  1,  1,  1,  1,  1],
    [ 1, -1, -1,  1, -1,  1],
    [ 1, -1, -1,  1,  1, -1],
    [ 1, -1,  1,  1,  1,  1],
    [ 1,  1, -1,  1,  1,  1],
  ].map((line) => line.map((v) => v - 0.5));

  // buffer for screen pixel values
  const screen = range(HEIGHT).map(() => range(WIDTH).fill(0));

  const camera = {
    pos: { x: -0.5, y: -0.5, z: 2.5 },
    direction: { x: 0, y: 0, z: -1 },
    up: { x: 0, y: 1, z: 0 },
    fov: (0.66 * Math.PI) / 4,
    aspect: 1,
  };

  try {
    setup();

    let t; // keep track of time

    while (true) {
      t = performance.now();

      // start by clearing the console
      console.clear();

      // reset the screen buffer
      for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
          screen[i][j] = 0;
        }
      }

      // draw the lines
      lines.forEach((line) => drawLine(line, screen, camera));

      // render the pixels
      for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
          p(screen[i][j] ? ON_CHAR : OFF_CHAR);
        }
        p("\n");
      }

      // TODO: rotate cube

      // wait until next frame
      const msSinceStartOfThisFrame = performance.now() - t;
      const msUntilNextFrame = 1000 / FPS - msSinceStartOfThisFrame;
      await sleep(max(0, msUntilNextFrame));
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