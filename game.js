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

const WIDTH = 30;
const HEIGHT = 15;

// quit gracefully
process.on("SIGINT", () => {
  cleanup();
  process.exit();
});

const run = async () => {
  const lines = [[0.25, 0.25, 0.25, 0.75]];

  const checkPixel = (x, y) => {
    return lines.some((line) => {
      const [x0, y0, x1, y1] = line;
      const diff = Math.abs(((y1 - y0) * (x - x0)) / (x1 - x0) - y);
      log(diff);
      return diff < 0.5;
    });
  };

  try {
    setup();

    while (true) {
      // start by clearing the screen
      console.clear();

      // render the pixels
      for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
          const x = j / (WIDTH - 1);
          const y = i / (HEIGHT - 1);
          p(checkPixel(x, y) ? "#" : "_");
        }
        p("\n");
      }

      throw new Error("quit");
      // wait for next frame
      // await sleep(1000 / 60); // 60 fps
    }
  } finally {
    cleanup();
  }
};

run();
