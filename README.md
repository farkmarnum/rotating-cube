# notes

how do we take world coordinates (`x, y, z`) and a camera position and project
them to screen coordinates?

what information do we need?

- camera's position, an `xyz` point
- camera's main direction, an `xyz` vector
- camera's "up" direction, an `xyz` vector
- camera's field of view, a float
- camera's aspect ratio, a float

```

\                                           /
 \                                         /
  \            (a point) ---> X           /  
   \                                     /
    \                                   /
     \                                 /
      \                               /
       \-----------------------------/ <--- a plane segment to project onto (maybe a unit length away? idk. it matches the aspect ratio)
        \             |             /
         \            |            /
          \           |           /
           \          |          /
            \         |         /
             \        |        /
              \       |       /
               \      |      /
                \     |     /
                 \    |    /
                  \   |   /  <--- the angle the view spans is the `fov`
                   \  |  /
                    \ | /
                     \|/
                  [ CAMERA ] <- points in a direction defined by `direction` and `up`
```

Hm... looking at the 2d case (2d world, 1d camera screen), to determine where a point in the world is in the camera's screen coordinates, we can sort of pretend the screen is a line segment perpendicular to the camera's direction. If it's a unit away from the camera, we can set the width and height accordingly so that the fov is satisfied.

Now the 3d case (3d world, 2d camera screen):
- the screen is on a plane that
  - is perpendicular to the camera `direction`
  - is one unit away from the camera (at its closest point)
- the screen itself is a plane segment that
  - is aligned so that its sides are parallel or perpendicular to the camera's `up`
  - has width & height that satisfy `aspect` ratio and also `fov` (the vertical angle)
- we project the point onto the plane, and if its within the plane segment, it's in view!

---

# terms

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
