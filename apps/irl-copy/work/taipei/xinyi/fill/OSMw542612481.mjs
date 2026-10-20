import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Reads as a 1980s-90s Taipei low-rise commercial block:
// two storeys of 5 blocks, stone-bricked plinth, white-concrete piers,
// light-blue glass windows, dark shopfront glass, a light-grey fascia and
// cornice, a flat gray roof with a white parapet and rooftop AC units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612481";
const W = 13, H = 23, D = 17;
const S = 5; // storey height in blocks

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Normalise ground so the lowest cell sits at y 0.
const key = (x, z) => `${x},${z}`;
let minG = Infinity;
for (const [, , gr] of cells) minG = Math.min(minG, gr);
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr - minG);
const list = [...gmap.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

const inF = (x, z) => gmap.has(key(x, z));
const base = Math.max(...list.map((c) => c.gr)); // common floor datum
const floor2 = base + S;
const roofY = base + 2 * S;
const parapetY = roofY + 1;
if (parapetY > H - 1) throw new Error(`parapet at ${parapetY} exceeds height ${H}`);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};
const ORDER = ["north", "south", "east", "west"];

// Outward facing for a wall cell: first neighbour direction that is outside the footprint.
function outward(x, z) {
  for (const f of ORDER) {
    const [dx, dz] = DIRS[f];
    if (!inF(x + dx, z + dz)) return f;
  }
  return null; // interior cell
}

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pre-compute the wall map and entrance (middle of the south-facing wall).
const walls = new Map();
for (const c of list) {
  const f = outward(c.x, c.z);
  if (f) walls.set(key(c.x, c.z), f);
}
const southCells = list
  .filter((c) => walls.get(key(c.x, c.z)) === "south")
  .sort((a, b) => a.x - b.x);
let entrance = null;
if (southCells.length) entrance = southCells[Math.floor(southCells.length / 2)];
else {
  const anyWall = list.filter((c) => walls.has(key(c.x, c.z))).sort((a, b) => a.x - b.x);
  entrance = anyWall[Math.floor(anyWall.length / 2)];
}
const entranceFacing = walls.get(key(entrance.x, entrance.z)) || "south";

// Helper: along-facade index (x for north/south faces, z for east/west faces).
const along = (f, x, z) => (f === "north" || f === "south" ? x : z);

for (const c of list) {
  const { x, z, gr } = c;
  const f = walls.get(key(x, z)); // undefined => interior cell
  const isWall = !!f;

  // Foundation: solid from y 0 up to the datum, so nothing floats on the slope.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Base course / floor slab at datum.
  put(x, base, z, isWall ? "stone_bricks" : "smooth_quartz");

  // Floor slab (second storey) across the footprint.
  put(x, floor2, z, isWall ? "light_gray_concrete" : "smooth_quartz");

  // Roof slab and cornice.
  put(x, roofY, z, isWall ? "light_gray_concrete" : "gray_concrete");

  if (!isWall) {
    // Rooftop AC units on interior roof cells, sitting on the roof slab.
    if (x % 5 === 2 && z % 5 === 2) put(x, parapetY, z, "iron_block");
    continue;
  }

  const a = along(f, x, z);
  const isWindow = a % 3 === 1;
  const [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz;
  const insideFree = inF(ix, iz) && !walls.has(key(ix, iz));

  // Parapet.
  put(x, parapetY, z, "white_concrete");

  // Storey-2 band (rows base+S+1 .. base+2S-1).
  for (let y = floor2 + 1; y < roofY; y++) {
    if (!isWindow) {
      put(x, y, z, "white_concrete");
    } else if (y === floor2 + 1 || y === roofY - 1) {
      put(x, y, z, "white_concrete"); // sill and head
    } else {
      put(x, y, z, "light_blue_stained_glass_pane");
      if ((a + y) % 4 === 0 && insideFree) put(ix, y, iz, "glowstone");
    }
  }

  // Fascia / belt course at floor2 and cornice at roofY already set above.

  // Ground storey (rows base+1 .. base+S-1).
  const isEntrance = x === entrance.x && z === entrance.z && f === entranceFacing;
  if (isEntrance) {
    put(x, base + 1, z, "oak_door", {
      facing: f,
      half: "lower",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(x, base + 2, z, "oak_door", {
      facing: f,
      half: "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(x, base + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    for (let y = base + 1; y <= base + 3; y++) {
      if (isWindow) {
        put(x, y, z, "black_stained_glass_pane");
        if ((a + y) % 3 === 0 && insideFree && y === base + 2) put(ix, y, iz, "glowstone");
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }
  // Ground-floor lintel / fascia.
  put(x, base + S - 1, z, "light_gray_concrete");
  // Storey-1 belt course at floor2 (level base+S) for wall cells.
  put(x, floor2, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
