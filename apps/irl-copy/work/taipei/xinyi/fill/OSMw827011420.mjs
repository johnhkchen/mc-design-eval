import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011420";
const W = 26, H = 38, D = 11;

// Record: no name, no era. Read as a 1990s Taipei mid-rise office/commercial block:
// five storeys of 5 blocks, pale quartz and white concrete frame, blue-tinted glazing,
// a shopfront ground floor with a central entrance, a cornice, a parapet and a
// rooftop mechanical penthouse with a mast.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const Bg = Math.min(...cells.map((c) => c[2]));   // lowest ground; storeys are keyed to it

const g = new Voxels([W, H, D]);

function put(x, y, z, spec) {
  if (!spec || y < 0 || y >= H) return;
  const [id, p] = spec;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Edge cell = touches the outside of the footprint.
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Glass pane connection: a pane on a z-boundary wall runs along x.
const pane = (x, z) => {
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  return alongX
    ? ["light_blue_stained_glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }]
    : ["light_blue_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
};

function spec(x, y, z, gr) {
  // Foundation: solid from y 0 up to this cell's ground.
  if (y < gr) return ["stone_bricks"];

  const rel = y - Bg;                 // height above lowest ground
  const edge = isEdge(x, z);
  const s = Math.floor(rel / 5);      // storey index (0..4)
  const l = rel % 5;                  // layer within storey

  // Roof deck at rel 25 over every footprint cell.
  if (rel === 25) return ["smooth_quartz"];

  // Parapet on the perimeter at rel 26.
  if (rel === 26 && edge) return ["white_concrete"];

  // Rooftop mechanical penthouse, x 8..17, z 3..7, rel 26..29, cap at 29.
  const inPH = x >= 8 && x <= 17 && z >= 3 && z <= 7;
  if (inPH && rel >= 26 && rel <= 29) {
    if (rel === 29) return ["smooth_quartz"];
    const ring = x === 8 || x === 17 || z === 3 || z === 7;
    return ring ? ["white_concrete"] : null;
  }

  // Mast on the penthouse cap.
  if (x === 12 && z === 5 && rel >= 30 && rel <= 32) {
    return ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }];
  }

  if (rel >= 26) return null;

  // Interior cells: floor slab per storey, air between, a few warm lights behind the glass.
  if (!edge) {
    if (l === 0) return ["smooth_quartz"];
    if (l === 2 && (z === 1 || z === 9) && (s === 1 || s === 3) && x % 6 === 1) {
      return ["shroomlight"];
    }
    return null;
  }

  // Exterior shell.
  if (rel === 24) return ["smooth_quartz"];                 // cornice
  if (l === 0) return s === 0 ? ["polished_andesite"] : ["smooth_quartz"]; // floor line / base course
  if (l === 4) return ["white_concrete"];                   // spandrel

  // Layers 1..3: window zone.
  const pier = x % 3 === 0 || x === 25;
  const front = z === 0 && !has(x, -1);

  if (s === 0 && front && x === 13) {
    // Central entrance: dark oak door, lantern on the lintel.
    const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
    if (l === 1) return ["dark_oak_door", { ...base, half: "lower" }];
    if (l === 2) return ["dark_oak_door", { ...base, half: "upper" }];
    if (l === 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
  }

  if (pier) return ["smooth_quartz"];
  return pane(x, z);
}

for (const [x, z, gr] of cells) {
  for (let y = 0; y < H; y++) {
    put(x, y, z, spec(x, y, z, gr));
  }
}

g.save(`${DIR}/${ID}.nbt`);
