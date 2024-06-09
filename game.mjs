import {
  sleep,
  range,
  setup,
  cleanup,
  drawLine,
  max,
  rotate,
  sin,
  print,
} from "./helpers.mjs";
import {
  getWidth,
  getHeight,
  getCamera,
  ON_CHAR,
  OFF_CHAR,
  FPS,
  MAX_SCREEN_DIMENSION,
} from "./constants.mjs";

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
  ];

  // buffer for screen pixel values
  const screen = range(MAX_SCREEN_DIMENSION).map(() =>
    range(MAX_SCREEN_DIMENSION).fill(0)
  );

  try {
    setup();

    let frameStart; // keep track of frame start for fps
    let rotX = 0;
    let rotY = 0;
    let rotZ = 0;

    while (true) {
      frameStart = performance.now();

      const height = getHeight();
      const width = getWidth();
      const camera = getCamera();

      // reset the screen buffer
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          screen[i][j] = 0;
        }
      }

      // draw the lines
      lines.forEach((line) => drawLine(line, screen, camera));

      // render the pixels
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const char = screen[i][j] ? ON_CHAR : OFF_CHAR;
          print(char, j, i);
        }
      }

      // Rotate the cube
      range(lines.length).forEach((i) => {
        const line = lines[i];

        // we rotate the cube around each axis
        // each rotation changes over time, and the
        // derivative of each rotation is the sine of
        // the current time.
        const T = 5; // time factor
        rotX += sin((performance.now() / (1000 * T)) * Math.PI * 2);
        rotY += sin((performance.now() / (2000 * T)) * Math.PI * 2);
        rotZ += sin((performance.now() / (3000 * T)) * Math.PI * 2);

        const [x0, y0, z0, x1, y1, z1] = line;
        const rot = (x, y, z) => {
          const rotated = rotate(
            { x, y, z },
            rotX / (100 * T * FPS),
            rotY / (100 * T * FPS),
            rotZ / (100 * T * FPS)
          );
          return [rotated.x, rotated.y, rotated.z];
        };

        lines[i] = [...rot(x0, y0, z0), ...rot(x1, y1, z1)];
      });

      // wait until next frame
      const msSinceStartOfThisFrame = performance.now() - frameStart;
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
