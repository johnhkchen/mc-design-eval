import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 162154402: a mid-century (1960s-70s) concrete-frame commercial block, the kind that fills the Newton and Grafton
// edge of the CBD. Four storeys of white-band piers and blue-glass panes over a stone plinth on the main tower (lidar
// roof 22), a two-storey podium wing to the south (roof 15) with a planted roof, a basement shown on the downhill side,
// shopfronts on the ground floor and a recessed entrance with a canopy on the north face (the street).

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162154402.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162154402.nbt";

const W = 25, H = 35, D = 33;
const TOP = [15, 22];          // roof above y 0 by tier: 0 = podium wing, 1 = main tower (lidar)
const DECK = [12, 20];         // the last storey's floor slab; the cap (roof slab + parapet) runs above it to TOP
const BASE = 4;                // y 0..3 is the basement (solid), y 4 is the ground-floor deck and plinth course
const floorsOf = (t) => (t ? [4, 8, 12, 16] : [4, 8]);   // storey slabs: each storey is 4 blocks (slab, 2 window rows, spandrel)
const DOOR = [13, 0];          // the entrance, on the north (street) face
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];         // N, S, E, W: N is -z

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, ground, roof] of JSON.parse(readFileSync(CELLS, "utf8"))) fp.set(key(x, z), { g: ground, t: roof >= 19 ? 1 : 0 });
const at = (x, z) => fp.get(key(x, z));

// lidar noise: a cell whose footprint neighbours all sit on the other tier joins them (clean tiers, no stray notches)
const flip = [...fp].filter(([k, c]) => {
  const [x, z] = k.split(",").map(Number);
  const nb = DIRS.map(([dx, dz]) => at(x + dx, z + dz)).filter(Boolean);
  return nb.length >= 2 && nb.every((n) => n.t !== c.t);
}).map(([, c]) => c);
for (const c of flip) c.t = 1 - c.t;

// the faces of a cell open to the air at height y: outside the footprint, or above a lower neighbour's roof (a podium face)
function openFaces(x, z, y) {
  const open = [];
  DIRS.forEach(([dx, dz], d) => {
    const n = at(x + dx, z + dz);
    if (!n || y >= TOP[n.t]) open.push(d);
  });
  return open;
}

// what a row of a cell is: basement, plinth, slab, window rows, spandrel, or the cap above the last deck
function roleOf(y, t) {
  if (y < BASE) return "base";
  if (y === BASE) return "plinth";
  if (y >= TOP[t]) return "air";
  if (y > DECK[t]) return "cap";
  if (y === DECK[t]) return "slab";
  for (const b of floorsOf(t)) {
    if (y === b) return "slab";
    if (y === b + 1 || y === b + 2) return "win";
    if (y === b + 3) return "spand";
  }
  return "air";
}

const g = new Voxels([W, H, D]);
const panes = [];
const PANE = "light_blue_stained_glass_pane";
const CANOPY_X = [12, 13, 14];

for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < TOP[c.t]; y++) {
    const role = roleOf(y, c.t);
    const open = openFaces(x, z, y);
    const outer = open.length > 0;
    const lowerRow = (y - BASE) % 4 === 1;   // the first window row of each storey, the one a lamp can stand on
    const onStreet = z === 0 && open.includes(0);

    // entrance, canopy and lanterns on the street face
    if (onStreet && x === DOOR[0] && (y === 5 || y === 6)) {
      g.set(x, y, z, "iron_door", { facing: "south", half: y === 5 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (onStreet && y === 7 && CANOPY_X.includes(x)) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (onStreet && y === 6 && (x === 12 || x === 14)) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }

    switch (role) {
      case "base":
        if (outer) g.set(x, y, z, y === 0 ? "mossy_stone_bricks" : "stone_bricks");
        else g.set(x, y, z, "stone_bricks");
        break;
      case "plinth":
        g.set(x, y, z, outer ? "stone_bricks" : "light_gray_concrete");
        break;
      case "slab":
      case "cap":
        g.set(x, y, z, outer ? "white_concrete" : "light_gray_concrete");
        break;
      case "spand":
        if (outer) g.set(x, y, z, "light_gray_concrete");
        break;
      case "win": {
        if (!outer) break;
        if (open.length >= 2) { g.set(x, y, z, "white_concrete"); break; }   // corners are piers
        const idx = open[0] < 2 ? x : z;                                       // along a N/S face the bays run by x, along E/W by z
        if (idx % 3 === 0) { g.set(x, y, z, "white_concrete"); break; }        // a pier every third cell
        g.set(x, y, z, PANE, {});
        panes.push([x, y, z]);
        // warm light behind some panes; the lamp stands on the floor slab, so only on the lower row
        const lit = y <= 6 ? idx % 2 === 0 : (idx + y) % 3 === 0;
        if (lit && lowerRow) {
          const [dx, dz] = DIRS[open[0]];
          const ix = x - dx, iz = z - dz;
          const inner = at(ix, iz);
          if (inner && roleOf(y, inner.t) === "win" && openFaces(ix, iz, y).length === 0) g.set(ix, y, iz, "glowstone");
        }
        break;
      }
      default:
        break;
    }
  }
}

// panes join their neighbours in the wall plane (other panes, piers, bands and stone), so the glazing reads as a grid
const LINK = new Set([PANE, "white_concrete", "light_gray_concrete", "stone_bricks", "mossy_stone_bricks"]);
for (const [x, y, z] of panes) {
  const link = (dx, dz) => { const b = g.get(x + dx, y, z + dz); return !!b && LINK.has(b.block.replace("minecraft:", "")); };
  g.set(x, y, z, PANE, { north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)), waterlogged: "false" });
}

// roof plant on the tower's cap, and a planted terrace on the podium roof
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const interior = DIRS.every(([dx, dz]) => at(x + dx, z + dz));
  if (!interior) continue;
  if (c.t === 1 && x >= 8 && x <= 11 && z >= 11 && z <= 13) g.set(x, 22, z, "iron_block");
  if (c.t === 0 && (x + z) % 2 === 0) g.set(x, TOP[0], z, "moss_carpet");
}

const info = g.save(OUT);
console.log(`way_162154402: ${info.blocks} blocks, ${info.palette} palette entries, ${panes.length} panes`);
