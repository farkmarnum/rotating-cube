import fs from "fs";
export const log = (...msg) => fs.appendFileSync("./log.txt", `${msg}\n`);

export const sleep = async (ms) =>
  await new Promise((resolve) => setTimeout(resolve, ms));
export const { abs, sqrt, floor, round, ceil, random, min, max, tan } = Math;
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
 * Returns a vector with random values from -1.0 to 1.0
 *
 * `norm` can be boolean (whether or not to normalize) or a number to normalize the magnitude to
 */
export const getRandomVec = (dimensions = 2, norm = false) => {
  if (![1, 2, 3].includes(dimensions)) {
    throw new Error("dimensions must be 1, 2, or 3");
  }

  const coords = Array(dimensions)
    .fill()
    .map(() => (random() - 0.5) * 2);

  if (!norm) return coords;

  const normalizeTo = norm === true ? 1 : norm; // norm

  try {
    const normalized = normalize(coords);

    // Set magnitude to target
    return normalized.map((v) => v * normalizeTo);
  } catch {
    // if vector was 0, normalize will fail. retry
    return getRandomVec();
  }
};

/** Returns a random [x,y] point in the domain [0,1] for each */
export const getRandomPoint = () => [Math.random(), Math.random()];

export const setup = () => {
  console.clear();
  process.stderr.write("\x1B[?25l"); // Hide cursor
};

export const cleanup = () => {
  console.clear();
  process.stderr.write("\x1B[?25h"); // Show cursor
};

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
  // - height / width should be `aspect`
  // - height should be tan(fov) * 2
  // - the "right" direction should be the cross product of `dir` and `up`
  const h = tan(fov) * 2;
  const w = h / aspect;
  const right = crossProduct(dir, up);
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
  const sx =
    sum([toPoint.x * right.x, toPoint.y * right.y, toPoint.z * right.z]) / w; // (dot product)
  const sy = -sum([toPoint.x * up.x, toPoint.y * up.y, toPoint.z * up.z]) / h; // (dot product)

  console.log([sx, sy]);
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
 * @param {[[number, number], [number, number]]} line (point coordinates, 0.0 to 1.0)
 * @param {number[][]} screen
 * @param {Record<string, any>} camera
 */
export const drawLine = (line, screen, camera) => {
  const height = screen.length;
  const width = screen[0].length;

  // worlds coords
  const [[x0, y0, z0], [x1, y1, z1]] = line;

  // screen coords
  const s0 = projectToCamera({ x: x0, y: y0, z: z0 }, camera);
  const s1 = projectToCamera({ x: x1, y: y1, z: z1 }, camera);
  if (!s0 || !s1) return;
  const [sx0, sx1] = s0;
  const [sy0, sy1] = s1;

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
