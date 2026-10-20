import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833524.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833524.nbt";

// Footprint 16 x 12. Roof about 11 blocks above lowest ground.
// Read as a 1980s-90s Xinyi commercial low-rise: two storeys over a shopfront,
// white tiled piers, light-grey spandrels, a glazed shopfront with a single
// entrance on the north (z = 0) face, a cornice and parapet, and roof plant.
const W = 16, H = 23, D = 12;
const ROOF = 10;      // roof slab block (flat absolute roof)
const MID = 5;        // first-floor slab block
const PARAPET = 11;   // top of parapet

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const m = new Map();
for (const [x, z, gr] of cells) m.set(`${x},${z}`, gr);

const has = (x, z) => m.has(`${x},${z}`);
const outwardDirs = (x, z) => {
  const d = [];
  if (!has(x, z - 1)) d.push("N");
  if (!has(x, z + 1)) d.push("S");
  if (!has(x - 1, z)) d.push("W");
  if (!has(x + 1, z)) d.push("E");
  return d;
};
const isPerim = (x, z) => outwardDirs(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const glassFor = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Pass 1: foundation, floor slabs, roof, cornice.
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, 4)); // keep storeys below the first-floor slab
  const perim = isPerim(x, z);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation
  put(x, gr, z, "smooth_stone");                                // ground floor slab
  put(x, MID, z, perim ? "polished_andesite" : "smooth_stone"); // storey line / floor
  put(x, ROOF, z, perim ? "polished_andesite" : "gray_concrete"); // cornice / roof deck
}

// Pass 2: perimeter walls, piers, shopfront, windows, door, parapet.
const lightCells = [];
for (const [x, z, gr0] of cells) {
  const dirs = outwardDirs(x, z);
  if (dirs.length === 0) continue;

  const gr = Math.max(0, Math.min(gr0, 4));
  const corner = dirs.length >= 2;
  const face = dirs[0];
  const u = (face === "N" || face === "S" || corner) ? x : z;
  const pier = corner || (u % 4 === 0);
  const doorCell = face === "N" && z === 0 && x === 7 && !corner;

  // Ground storey: shopfront glass, lintel, door.
  for (let y = gr + 1; y <= 4; y++) {
    if (y === 4) {
      put(x, y, z, pier ? "white_concrete" : "polished_andesite");
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else if (doorCell && y <= gr + 2) {
      put(x, y, z, "oak_door", {
        facing: "south",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", glassFor(face));
    }
  }

  // Upper storey: windows 6..8, spandrel 9.
  for (let y = 6; y <= 9; y++) {
    if (y === 9) {
      put(x, y, z, pier ? "white_concrete" : "light_gray_concrete");
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", glassFor(face));
    }
  }

  // Cornice and parapet.
  put(x, PARAPET, z, "white_concrete");
  if (!pier && face) {
    // Upper window glass with warm light behind it, every few bays.
    if (u % 8 === 2) {
      const [dx, dz] = inward[face];
      lightCells.push([x + dx, 7, z + dz]);
    }
  }
}

// Pass 3: warm lights behind upper glass (in the air gap).
for (const [x, y, z] of lightCells) {
  if (has(x, z) && !isPerim(x, z)) put(x, y, z, "glowstone");
}

// Entrance lantern hanging from the first-floor slab, inside the door.
if (has(7, 1)) put(7, 4, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Pass 4: roof plant on the interior roof deck.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (isPerim(x, z)) continue;
  if (x % 5 === 2 && z % 4 === 2) {
    put(x, PARAPET, z, "light_gray_concrete");
  }
}

g.save(OUT);
