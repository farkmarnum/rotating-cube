import {
  MAX_SCREEN_DIMENSION,
  OFF_CHAR,
  TERM_CHAR_ASPECT,
} from "./constants.mjs";

export const sleep = async (ms) =>
  await new Promise((resolve) => setTimeout(resolve, ms));

export const {
  abs,
  sqrt,
  floor,
  round,
  ceil,
  random,
  min,
  max,
  sin,
  cos,
  tan,
} = Math;

export const sum = (arr) => arr.reduce((a, b) => a + b);

export const range = (n) => [...Array(n).keys()];

const normalize = (vec) => {
  const magnitude = sqrt(sum(vec.map((v) => v * v)));
  if (magnitude === 0) throw new Error("Can't normalize 0 vector");
  return vec.map((v) => v / magnitude);
};

const normalizeXYZ = ({ x, y, z }) => {
  const [_x, _y, _z] = normalize([x, y, z]);
  return { x: _x, y: _y, z: _z };
};

const crossProduct = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

const dotProduct = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

/** scale vectors */
const scale = (vec, k) => ({
  x: vec.x * k,
  y: vec.y * k,
  z: vec.z * k,
});

/** add vectors */
const add = (a, b) => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

/** subtract vectors */
const sub = (a, b) => add(a, scale(b, -1));

/**
 * Rotates `vec` by `a` radians around the x-axis, `b` radians around the
 * y-axis, and `v` radians around the z-axis. Rotation center is the origin.
 */
export const rotate = (vec, a, b, c) => {
  const x = vec.x;
  const y = vec.y;
  const z = vec.z;

  const sinA = sin(a);
  const cosA = cos(a);
  const sinB = sin(b);
  const cosB = cos(b);
  const sinC = sin(c);
  const cosC = cos(c);

  const x1 = x * cosA - y * sinA;
  const y1 = x * sinA + y * cosA;
  const z1 = z;

  const x2 = x1 * cosB + z1 * sinB;
  const y2 = y1;
  const z2 = z1 * cosB - x1 * sinB;

  const x3 = x2 * cosC - y2 * sinC;
  const y3 = x2 * sinC + y2 * cosC;
  const z3 = z2;

  return { x: x3, y: y3, z: z3 };
};

export const setup = (width, height) => {
  console.clear();
  process.stderr.write("\x1B[?25l"); // Hide cursor

  // initialize the screen with the off character
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      print(OFF_CHAR, j, i);
    }
  }
};

export const cleanup = () => {
  console.clear();
  process.stderr.write("\x1B[?25h"); // Show cursor
};

export const getTerminalDimensions = () => {
  const width = process.stdout.columns - 1;
  const height = process.stdout.rows - 1;

  // Ensure the height is at least as tall as the width
  const minHeight = Math.floor(width / TERM_CHAR_ASPECT);

  return { width, height: Math.min(height, minHeight) };
};

const terminalDimensions = getTerminalDimensions();

export const getWidth = () =>
  Math.min(terminalDimensions.width, MAX_SCREEN_DIMENSION);

export const getHeight = () =>
  Math.min(terminalDimensions.height, MAX_SCREEN_DIMENSION);

export const setWidth = (width) => {
  terminalDimensions.width = width;
};

export const setHeight = (height) => {
  terminalDimensions.height = height;
};

export const getCamera = () => ({
  pos: { x: 0, y: 0, z: 4 },
  direction: { x: 0, y: 0, z: -1 },
  up: { x: 0, y: 1, z: 0 },
  fov: Math.PI / 6, // (45 degrees)
  aspect: (getHeight() / getWidth()) * TERM_CHAR_ASPECT,
});

/**
 * @param {[number, number, number]} point
 * @param {{
 *   pos: { x: number, y: number, z: number };
 *   direction: { x: number, y: number, z: number };
 *   up: { x: number, y: number, z: number };
 *   fov: number;
 *   aspect: number;
 * }} camera
 *
 * @returns {[number, number] | null} `[sx, sy]`, or null if not in view
 */
const projectToCamera = (point, camera) => {
  const { pos, direction, up: _up, fov, aspect } = camera;
  const dir = normalizeXYZ(direction);
  const up = normalizeXYZ(_up);

  // the view plane must be:
  // - perpendicular to `dir`
  // - 1 unit away from `pos`
  //
  // let's define it as ax + by + cz + d = 0
  // we know that a = dir.x, b = dir.y, and c = dir.z, since `direction` is the normal vector of this plane
  //
  // for the plane to pass through a certain point, we need to set `d` such that:
  //   a * point.x + b * point.y + c * point.z + d = 0
  //
  // this point is pos + dir, so:
  //   p = pos + dir
  //   d = -(a * p.x + b * p.y + c * p.z)
  const _p = add(pos, dir);
  const a = dir.x;
  const b = dir.y;
  const c = dir.z;
  const d = -(a * _p.x + b * _p.y + c * _p.z);
  // We'll keep this point around and call it `center`
  const center = _p;

  // Okay! Now we just need project `point` onto this plane
  // This is the same as finding the intersection between the plane and the line that connects `point` and `pos` (the camera position)
  //
  // If v is the vector that points from `point` to `pos`, we want to travel from `point` in the direction of `v` until we intersect the plane
  // So there is some `k` such that `point + v * k` will be on the plane
  // a * (point.x + v.x * k) + b * (point.y + v.y * k) + c * (point.z + v.z * k) + d = 0
  // a * v.x * k + b * v.y * k + c * v.z * k = -(a * point.x + b * point.y + c * point.z) - d
  // k * (a * v.x + b * v.y + c * v.z) = -(a * point.x + b * point.y + c * point.z) - d
  // k = -(a * point.x + b * point.y + c * point.z) + d)/(a * v.x + b * v.y + c * v.z)
  const v = sub(pos, point);
  const k =
    -(a * point.x + b * point.y + c * point.z + d) /
    (a * v.x + b * v.y + c * v.z);

  // So by travelling `k` units in the direction of `v` from `point`, we get our projected point:
  const pointOnPlane = add(point, scale(v, k));

  // Now we need to find the plane segment for the screen
  // - it's on the plane
  // - its center is `center`
  // - `aspect = h/w, so w = h/aspect`
  // - height should be tan(fov) * 2
  // - the "right" direction should be the cross product of `dir` and `up`
  const h = tan(fov) * 2;
  const w = h / aspect;
  const right = normalizeXYZ(crossProduct(dir, up));
  const topLeftPoint = add(add(center, scale(up, h / 2)), scale(right, -w / 2));

  // Now let's get the coordinates of `pointOnPlane` within this plane segment
  // if it's at topLeft, it'll be (0, 0), and if it's at bottomRight, it'll be (1, 1)
  // so our output will be (sx, sy), where each are 0.0 to 1.0
  // the "x" direction is `right`, and the "y" direction is `up`
  // The steps for the calculation are:
  // - find the vector from `topLeft` to `pointOnPlane`
  // - project this vector onto `right` and `up`
  // - divide the projections by the width and height of the plane segment
  const toPoint = sub(pointOnPlane, topLeftPoint);
  const sx = dotProduct(toPoint, right) / w;
  const sy = -dotProduct(toPoint, up) / h;

  if (sx < 0 || sy < 0 || sx > 1 || sy > 1) return null; // point is not in view
  return [sx, sy];
};

const screenToPixel = (sx, sy, width, height) => [
  round(sx * (width - 1)),
  round(sy * (height - 1)),
];

/**
 * Draws `line` to the `screen` buffer.
 *
 * @param {[number, number, number, number, number, number]} line 2 points (x,y,z,x,y,z) in world coordinates
 * @param {number[][]} screen
 * @param {Record<string, any>} camera
 */
export const drawLine = (line, screen, camera) => {
  const height = getHeight();
  const width = getWidth();

  // worlds coords
  const [x0, y0, z0, x1, y1, z1] = line;

  // screen coords
  const s0 = projectToCamera({ x: x0, y: y0, z: z0 }, camera);
  const s1 = projectToCamera({ x: x1, y: y1, z: z1 }, camera);
  if (!s0 || !s1) return;
  const [sx0, sy0] = s0;
  const [sx1, sy1] = s1;

  // pixel coords:
  const [px0, py0] = screenToPixel(sx0, sy0, width, height);
  const [px1, py1] = screenToPixel(sx1, sy1, width, height);

  // determine which dimension has more change (0 = x, 1 = y)
  const mainDirection = abs(px1 - px0) > abs(py1 - py0) ? 0 : 1;

  // draw the pixels to the screen buffer
  if (mainDirection === 0) {
    const dx = px1 > px0 ? 1 : -1;
    for (let px = px0; (px1 - px) * dx >= 0; px += dx) {
      const py = round(((px - px0) / (px1 - px0)) * (py1 - py0) + py0);
      screen[py][px] = 1;
    }
  } else {
    const dy = py1 > py0 ? 1 : -1;
    for (let py = py0; (py1 - py) * dy >= 0; py += dy) {
      const px = round(((py - py0) / (py1 - py0)) * (px1 - px0) + px0);
      screen[py][px] = 1;
    }
  }
};

/** print `char` at `x` `y` in terminal */
export const print = (char, x, y) => {
  process.stdout.cursorTo(x, y);
  process.stdout.write(char);
};
