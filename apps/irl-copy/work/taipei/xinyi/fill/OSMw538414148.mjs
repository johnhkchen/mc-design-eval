import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538414148: low-rise two-storey commercial block, Xinyi, c. 1990s.
// Pale tiled concrete facade, stone plinth and storey bands, light-blue glass
// with pillar mullions, shopfront on the ground storey, a central entrance,
// a parapet with a cornice cap, and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414148";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const inside = (x, z) => gmap.has(`${x},${z}`);
const g0 = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const TOP = g0 + 10;                              // top block of parapet (roof = 11 blocks)

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !inside(x + dx, z + dz))
    .map(([n]) => n);

const perim = new Set();
for (const [x, z] of cells) if (outward(x, z).length > 0) perim.add(`${x},${z}`);
const isPerim = (x, z) => perim.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const glassProps = (face) =>
  face === "north" || face === "south"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Entrance: centre of the north-facing wall (non-corner cells).
const northCells = cells
  .filter(([x, z]) => {
    const o = outward(x, z);
    return o.length === 1 && o[0] === "north";
  })
  .sort((a, b) => a[0] - b[0]);
const doorCell = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;

// ---- Main shell ----
for (const [x, z, gc] of cells) {
  const out = outward(x, z);
  const perimeter = out.length > 0;
  const corner = out.length >= 2;
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone");

  for (let y = gc; y <= TOP; y++) {
    const rel = y - g0;

    // Interior: floor slabs and roof deck only (air gap behind glass).
    if (!perimeter) {
      if (y === gc) put(x, y, z, "smooth_stone");
      else if (rel === 5) put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      else if (y === TOP) put(x, y, z, "gray_concrete");
      continue;
    }

    // Corner columns.
    if (corner) {
      put(x, y, z, y === gc ? "stone_bricks" : "smooth_stone");
      continue;
    }

    const face = out[0];
    const ns = face === "north" || face === "south";
    const idx = ns ? x : z;
    const pillar = idx % 3 === 0;

    // Entrance door on the north face.
    if (isDoor && (y === gc || y === gc + 1)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gc ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (y === gc) { put(x, y, z, "stone_bricks"); continue; }     // base course
    if (y === TOP) { put(x, y, z, "smooth_stone"); continue; }    // parapet cap
    if (rel === 4 || rel === 5) { put(x, y, z, "smooth_stone"); continue; } // lintel + storey line

    if (rel >= 1 && rel <= 3) {
      // Ground-storey shopfront.
      if (pillar) put(x, y, z, "stone_bricks");
      else if (rel === 1) put(x, y, z, "gray_concrete");          // kickplate
      else put(x, y, z, "light_blue_stained_glass_pane", glassProps(face));
      continue;
    }

    if (rel >= 6 && rel <= 9) {
      // Upper storey window bays.
      if (pillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", glassProps(face));
      continue;
    }
  }
}

// ---- Warm lights behind some upper-storey windows ----
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const out = outward(x, z);
  if (out.length !== 1) continue;
  const face = out[0];
  const ns = face === "north" || face === "south";
  const idx = ns ? x : z;
  if (idx % 6 !== 2) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;   // inward cell
  if (!inside(ix, iz) || isPerim(ix, iz)) continue;
  const gi = gmap.get(`${ix},${iz}`);
  if (g0 + 6 <= TOP && g0 + 6 >= gi) put(ix, g0 + 6, iz, "glowstone");
}

// ---- Rooftop plant: a central block of AC units on the roof deck ----
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 2 && (x + z) % 3 !== 0) {
    put(x, TOP + 1, z, "light_gray_concrete");
    if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1 && TOP + 2 < H) {
      put(x, TOP + 2, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
