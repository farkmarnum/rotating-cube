import {
  range,
  setup,
  cleanup,
  drawLine,
  rotate,
  sin,
  print,
  cos,
  round,
  sleep,
  getWidth,
  getHeight,
  getCamera,
  setWidth,
  setHeight,
  getTerminalDimensions,
} from "./helpers.mjs";
import { ON_CHAR, OFF_CHAR, MAX_SCREEN_DIMENSION } from "./constants.mjs";

const fpsBuffer = []; // buffer to store fps values so we can smooth them
const fpsBufferLength = 300; // number of frames to average over
const getFps = () => fpsBuffer.reduce((a, b) => a + b, 0) / fpsBuffer.length;
const storeFps = (fps) => {
  fpsBuffer.push(fps);
  if (fpsBuffer.length > fpsBufferLength) {
    fpsBuffer.shift();
  }
};

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
  // buffer to track previous screen state
  const prevScreen = range(MAX_SCREEN_DIMENSION).map(() =>
    range(MAX_SCREEN_DIMENSION).fill(0)
  );

  process.on("SIGWINCH", () => {
    const { width, height } = getTerminalDimensions();

    // update the screen dimensions
    setWidth(width);
    setHeight(height);

    // reset the screen
    setup(width, height);

    // reset the screen buffer that tracks previous state
    prevScreen.forEach((row) => row.fill(0));
  });

  try {
    setup(getWidth(), getHeight());

    let frameStart = performance.now(); // keep track of frame start for fps

    while (true) {
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
          // only write to the terminal if the pixel has changed
          const isOn = screen[i][j];
          const wasOn = prevScreen[i][j];
          if (isOn !== wasOn) {
            print(isOn ? ON_CHAR : OFF_CHAR, j, i);
          }

          // update prevScreen
          prevScreen[i][j] = isOn;
        }
      }

      const msSinceStartOfThisFrame = performance.now() - frameStart;
      frameStart = performance.now();

      // smooth rotation that changes over time
      const t = Date.now() / 1000;
      const [a, b] = [sin, cos];
      const c = (x) => sin(x + Math.PI / 6);
      const rotX = 0.7 * b(t * 0.06) + 2 * c(t * 0.2) + 4 * a(t * 1.9);
      const rotY = 0.3 * c(t * 0.04) + 3 * a(t * 0.3) + 2 * b(t * 1.5);
      const rotZ = 0.5 * a(t * 0.05) + 4 * b(t * 0.4) + 3 * c(t * 1.1);
      const f = msSinceStartOfThisFrame / 2000; // rotation factor
      const rot = (x, y, z) => {
        const rotated = rotate({ x, y, z }, rotX * f, rotY * f, rotZ * f);
        return [rotated.x, rotated.y, rotated.z];
      };

      // Rotate the cube
      range(lines.length).forEach((i) => {
        const line = lines[i];

        const [x0, y0, z0, x1, y1, z1] = line;

        lines[i] = [...rot(x0, y0, z0), ...rot(x1, y1, z1)];
      });

      await sleep(0); // give up the thread so we can accept interrupts

      const thisFrameFps = round(1000 / msSinceStartOfThisFrame);
      storeFps(thisFrameFps);
      print(round(getFps()) + " fps " + OFF_CHAR.repeat(3), 0, 0);
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
