import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mixed-use 2-storey Taipei commercial block (1970s-80s): stone-base shopfronts,
// white tiled concrete piers, punched glass windows, parapet roof with rooftop housing.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833559";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 21;
const FL1 = 6;      // storey-1 top slab
const FL2 = 11;     // roof slab (roof surface ~11 above lowest ground)
const PARAPET = 12; // parapet course

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g0] of cells) ground.set(key(x, z), Math.round(g0));
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);

const glassProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y <= gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  // Storey slabs across the whole footprint (floor 1, roof).
  for (const fy of [FL1, FL2]) if (fy > gr) g.set(x, fy, z, "smooth_stone");

  const faces = [];
  if (!has(x - 1, z)) faces.push("west");
  if (!has(x + 1, z)) faces.push("east");
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");

  // Interior cells: slabs only, air behind the glass.
  if (faces.length === 0) continue;

  const face = faces[0];
  const t = (face === "west" || face === "east") ? z : x; // position along the facade
  const pier = t % 3 === 0;
  const onSouth = faces.includes("south");
  const doorCell = onSouth && t === 10;

  for (let y = gr + 1; y <= PARAPET && y < H; y++) {
    if (y === FL1 || y === FL2) continue; // already placed as slab

    if (y <= 5) {
      if (y === 5) {
        // Ground-storey fascia: colour stripe above the entrance, plain elsewhere.
        const stripe = onSouth && t >= 8 && t <= 11;
        g.set(x, y, z, stripe ? "red_concrete" : "light_gray_concrete");
      } else if (y === gr + 1 && y <= 4) {
        g.set(x, y, z, "polished_andesite"); // base course
      } else if (doorCell && (y === gr + 1 || y === gr + 2)) {
        g.set(x, y, z, "dark_oak_door", doorProps(y === gr + 1 ? "lower" : "upper"));
      } else if (pier) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass_pane", glassProps);
      }
    } else if (y >= 7 && y <= 10) {
      if (y === 7 || y === 10) g.set(x, y, z, "light_gray_concrete"); // sill / lintel
      else if (pier) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass_pane", glassProps);
    } else if (y === PARAPET) {
      // Parapet with rhythm of light and white blocks.
      g.set(x, y, z, t % 2 === 0 ? "light_gray_concrete" : "white_concrete");
    }
  }
}

// Warm lights behind some windows (glowstone on ground storey, shroomlight upstairs).
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (!isEdge(x, z)) continue;
  const faces = [];
  if (!has(x - 1, z)) faces.push("west");
  if (!has(x + 1, z)) faces.push("east");
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");
  if (faces.length === 0) continue;
  const face = faces[0];
  const t = (face === "west" || face === "east") ? z : x;
  if (t % 6 !== 1 && t % 6 !== 4) continue;

  const [ix, iz] = {
    west: [x + 1, z], east: [x - 1, z], north: [x, z + 1], south: [x, z - 1],
  }[face];
  if (!has(ix, iz) || isEdge(ix, iz)) continue;

  if (t % 6 === 1) {
    if (8 > gnd(ix, iz)) g.set(ix, 8, iz, "shroomlight");
  } else {
    if (3 > gnd(ix, iz)) g.set(ix, 3, iz, "glowstone");
  }
}

// Rooftop housing: a gray plant box with a taller cap, on interior roof cells.
for (let x = 7; x <= 12; x++) {
  for (let z = 8; z <= 12; z++) {
    if (!has(x, z) || isEdge(x, z) || gnd(x, z) >= FL2) continue;
    g.set(x, PARAPET, z, "gray_concrete");
    if (x >= 8 && x <= 11 && z >= 9 && z <= 11) g.set(x, PARAPET + 1, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
