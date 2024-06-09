# `draw-cube`

draws a rotating cube in the terminal

## installing

`yarn`

## running

`yarn start`

## other

To show FPS, set env var `DRAW_CUBE_SHOW_FPS=1`.

## notes

There are a lot of different kinds of coordinates. Here's what I'm currently calling them:

- "world" coordinates are the locations of 3d points in the world
  - floats, unbounded
  - `x, y, z`
- "screen" coordinates are the locations we're drawing to on the screen
  - floats, from `0.0` to `1.0`
  - `sx, sy`
- "pixel" coordinates are the coordinates of the individual pixels
  - integers, from `0` to `width-1` and `0` to `height-1`
  - `px, py`
