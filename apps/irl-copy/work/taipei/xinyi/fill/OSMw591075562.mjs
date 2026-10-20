import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial/office block, Xinyi district, Taipei: 1970s-80s reinforced-concrete frame,
// white tiled facade, blue-tinted glazing in white frames, stone-clad plinth, quartz storey bands,
// three storeys plus a cornice parapet, rooftop plant. Roof at y=13 above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075562";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 25, D = 17;
const g = new Voxels([W, H, D]);

const ROOF = 13;            // parapet top course
const CORNICE = ROOF + 1;   // stone-brick cap on the parapet
const SLABS = [4, 8, 12];   // storey floor / spandrel levels (absolute y)

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const has = (x, z) => fp.has(key(x, z));

const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const outs = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));

let minX = Infinity, minZ = Infinity;
for (const [x, z] of fp.keys().map((k) => k.split(",").map(Number))) {
  minX = Math.min(minX, x);
  minZ = Math.min(minZ, z);
}
const along = (x, z, dir) => (dir === "north" || dir === "south" ? x - minX : z - minZ);

// Ring (facade) cells and per-face lists
const ringSet = new Set();
const faces = { north: [], south: [], west: [], east: [] };
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const o = outs(x, z);
  if (o.length) {
    ringSet.add(key(x, z));
    if (o.length === 1) faces[o[0][0]].push([x, z]);
  }
}

// Entrance: on the south face if it exists, else the first single-face wall; nearest its midpoint
let door = null;
{
  const faceOrder = ["south", "north", "east", "west"];
  const face = faceOrder.find((f) => faces[f].length > 0);
  if (face) {
    const vals = faces[face].map(([x, z]) => along(x, z, face));
    const mid = (Math.min(...vals) + Math.max(...vals)) / 2;
    let best = null;
    for (const [x, z] of faces[face]) {
      const s = Math.abs(along(x, z, face) - mid);
      if (!best || s < best.s) best = { x, z, s };
    }
    const d = DIRS.find(([n]) => n === face);
    door = { x: best.x, z: best.z, dir: d };
  }
}

for (const [x, z, gr] of cells) {
  // Plinth / foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (ringSet.has(key(x, z))) {
    const o = outs(x, z);
    const corner = o.length >= 2;
    const od = o[0];
    const a = od ? along(x, z, od[0]) : 0;
    const pillar = corner || (od && a % 3 === 0);
    const isDoor = door && door.x === x && door.z === z;

    for (let y = gr; y <= ROOF; y++) {
      let id = null;
      let props;

      if (y === gr) {
        id = "stone_bricks";                       // base course
      } else if (y === ROOF) {
        id = "white_concrete";                     // parapet
      } else if (SLABS.includes(y) && y > gr) {
        id = "quartz_block";                       // storey band
      } else {
        // sb = slab level under this row (or ground)
        let sb = gr;
        for (const s of SLABS) if (s < y && s > sb) sb = s;
        const rel = y - sb;

        if (isDoor && (y === gr + 1 || y === gr + 2)) {
          id = "dark_oak_door";
          props = {
            facing: door.dir[0],
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else if (pillar || rel === 3) {
          id = "white_concrete";                   // mullions and lintels
        } else {
          id = "light_blue_stained_glass";         // glazing
        }

        // Warm light just inside some windows
        if (!pillar && !isDoor && rel === 2 && od && a % 6 === 2) {
          const ix = x - od[1], iz = z - od[2];
          if (has(ix, iz) && !ringSet.has(key(ix, iz))) {
            g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
          }
        }
      }

      if (id) g.set(x, y, z, id, props);
    }

    // Cornice cap sitting on the parapet
    if (CORNICE <= 14 && CORNICE >= gr) {
      g.set(x, CORNICE, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  } else {
    // Interior: floor slabs only, air everywhere else (no interiors)
    if (gr < H) g.set(x, gr, z, "smooth_stone");
    for (const s of SLABS) if (s >= gr) g.set(x, s, z, "smooth_stone");

    // Rooftop plant on the roof deck (y=12 slab)
    if (x % 5 === 2 && z % 5 === 2) {
      g.set(x, ROOF, z, "light_gray_concrete");
      g.set(x, ROOF + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
