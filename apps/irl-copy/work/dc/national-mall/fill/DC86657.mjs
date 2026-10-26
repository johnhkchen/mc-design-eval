import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86657";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 28, D = 22;
const g = new Voxels([W, H, D]);

const fp = new Map(cells.map(c => [`${c[0]},${c[1]}`, c]));
const has = (x, z) => fp.has(`${x},${z}`);

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Outward face of an edge cell, with inward offset and pane connection axis.
function faceOf(x, z) {
  if (!has(x - 1, z)) return { side: "w", u: z, inx: 1, inz: 0, conn: "ns" };
  if (!has(x + 1, z)) return { side: "e", u: z, inx: -1, inz: 0, conn: "ns" };
  if (!has(x, z - 1)) return { side: "n", u: x, inx: 0, inz: 1, conn: "ew" };
  if (!has(x, z + 1)) return { side: "s", u: x, inx: 0, inz: -1, conn: "ew" };
  return null;
}

const paneProps = conn => conn === "ew"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const GLASS = "cyan_stained_glass_pane";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const FLOOR = "light_gray_concrete";
const BASE = "polished_granite";
const SURROUND = "stone_bricks";
const FOUND = "stone_bricks";
const CORNICE = "stone_brick_slab";
const LIGHT = "glowstone";

// Smooth lidar noise into storey-aligned tiers (3 blocks per storey).
// Lower wings keep a tier that is still at least one storey above their ground.
const tierOf = (gr, rr) => {
  let t = Math.round(rr / 3) * 3;
  t = Math.max(t, gr + 3);
  return Math.min(H - 4, t);
};

// Entrance: two-wide doorway centred on the north (z = 0) face.
const isDoorCol = (face, x) => face && face.side === "n" && (x === 6 || x === 7);

for (const [x, z, gr, rr] of cells) {
  const ground = gr;
  const top = tierOf(gr, rr);

  // Foundation up to the cell's ground so nothing floats on a slope.
  for (let y = 0; y < ground; y++) put(x, y, z, FOUND);

  const face = faceOf(x, z);
  const isPenthouse = x >= 4 && x <= 9 && z >= 6 && z <= 15 && top + 2 < H;

  if (face) {
    for (let y = ground; y < top; y++) {
      const rel = y - ground;

      // Roof cornice course.
      if (y === top - 1) {
        put(x, y, z, CORNICE, { type: "bottom", waterlogged: "false" });
        continue;
      }

      // Base course, with an entrance door and stone surround.
      if (rel === 0) {
        if (isDoorCol(face, x)) {
          put(x, y, z, "dark_oak_door", {
            facing: "north", half: "lower",
            hinge: x === 6 ? "left" : "right",
            open: "false", powered: "false",
          });
        } else if (face.side === "n" && (x === 5 || x === 8)) {
          put(x, y, z, SURROUND);
        } else {
          put(x, y, z, BASE);
        }
        continue;
      }

      if (rel === 1 && isDoorCol(face, x)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north", half: "upper",
          hinge: x === 6 ? "left" : "right",
          open: "false", powered: "false",
        });
        continue;
      }

      // Lintel above the door: solid stone so the entrance reads.
      if (rel === 2 && face.side === "n" && (x === 5 || x === 6 || x === 7 || x === 8)) {
        put(x, y, z, SURROUND);
        continue;
      }

      // Storey spandrel lines.
      if (rel % 3 === 0) {
        put(x, y, z, SPANDREL);
        continue;
      }

      // Piers between window bays.
      if (face.u % 3 === 0) {
        put(x, y, z, PIER);
        continue;
      }

      put(x, y, z, GLASS, paneProps(face.conn));

      // Warm light behind some windows, inside the air gap.
      if (rel % 3 === 1 && face.u % 6 === 2) {
        put(x + face.inx, y, z + face.inz, LIGHT);
      }
    }
  } else {
    // Interior: storey slabs only (no interiors), roof closes the top.
    for (let y = ground; y < top - 1; y++) {
      if ((y - ground) % 3 === 0) put(x, y, z, FLOOR);
    }
    put(x, top - 1, z, FLOOR);
  }

  // Penthouse setback on the smoothed roof, inset from the edges.
  if (isPenthouse) {
    const rim = x === 4 || x === 9 || z === 6 || z === 15;
    for (let y = top; y <= top + 1; y++) {
      if (rim) {
        if ((x + z) % 3 === 0) put(x, y, z, PIER);
        else put(x, y, z, GLASS, paneProps("ew"));
      }
    }
    put(x, top + 2, z, FLOOR);
  }
}

g.save(`${DIR}/${ID}.nbt`);
