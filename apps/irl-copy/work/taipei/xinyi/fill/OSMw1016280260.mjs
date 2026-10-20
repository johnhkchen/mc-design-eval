import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280260";
const W = 8, H = 33, D = 21;

const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const shellAt = (x, z) => has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Front = street side (-z). Door sits on the middle front cell.
const frontXs = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const INWARD = { front: [0, 1], back: [0, -1], left: [1, 0], right: [-1, 0] };
const OUTFACING = { front: "north", back: "south", left: "west", right: "east" };

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const front = !has(x, z - 1), back = !has(x, z + 1);
  const left = !has(x - 1, z), right = !has(x + 1, z);
  const shell = front || back || left || right;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!shell) {
    // interior: air gap behind glass, floor slab per storey, roof slab
    for (const o of [0, 5, 10, 15]) put(x, gr + o, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    put(x, gr + 20, z, "light_gray_concrete");
    continue;
  }

  const face = front ? "front" : back ? "back" : left ? "left" : "right";
  const zFace = face === "front" || face === "back";
  const along = zFace ? x : z;
  const [ix0, iz0] = INWARD[face];
  const paneProps = zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let off = 0; off <= 21; off++) {
    const y = gr + off;
    let id = "white_concrete", p;

    if (off === 0) {
      id = "polished_andesite";                      // base course
    } else if (off === 20) {
      id = "light_gray_concrete";                    // roof edge
    } else if (off === 21) {
      id = "white_concrete";                         // parapet
    } else if (off === 19) {
      id = "light_gray_concrete";                    // cornice
    } else {
      const L = Math.floor(off / 5), rel = off % 5;
      const groundFront = L === 0 && face === "front";
      if (L === 0 && rel === 4) {
        id = "black_concrete";                       // shopfront header
      } else if (rel === 0) {
        id = "light_gray_concrete";                  // storey line
      } else if (rel === 4) {
        id = "white_concrete";                       // spandrel
      } else {
        // window zone rel 1..3
        const isDoor = groundFront && x === doorX && (off === 1 || off === 2);
        if (isDoor) {
          id = "dark_oak_door";
          p = {
            facing: "north",
            half: off === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else if (along % 3 === 0) {
          id = groundFront ? "black_concrete" : "white_concrete";  // mullion
        } else if (groundFront) {
          id = "light_blue_stained_glass";           // shopfront glass
        } else {
          id = "light_blue_stained_glass_pane";
          p = paneProps;
        }

        // warm light behind some mid-row windows (inside the air gap)
        if (rel === 2 && !isDoor && along % 3 !== 0 && (along + L + gr) % 4 === 1) {
          const ix = x + ix0, iz = z + iz0;
          if (has(ix, iz) && !shellAt(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }

    put(x, y, z, id, p);
  }
}

// Roof plant: a water tank and a stair/lift housing on interior roof cells
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (shellAt(x, z)) continue;
  if (x >= 2 && x <= 3 && z >= 7 && z <= 8) {
    for (let o = 21; o <= 23; o++) put(x, gr + o, z, "white_concrete");
    put(x, gr + 24, z, "light_gray_concrete");
  }
  if (x >= 5 && x <= 6 && z >= 14 && z <= 15) {
    for (let o = 21; o <= 23; o++) put(x, gr + o, z, "light_gray_concrete");
  }
}

g.save(`${SRC}/${ID}.nbt`);
