import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const raw = JSON.parse(readFileSync(`${DIR}/NYC1001286.cells.json`, "utf8"));
const cellsArr = Array.isArray(raw) ? raw : raw.cells;

const W = 20, H = 24, D = 6;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => x + "," + z;

// ---- footprint, with roofs quantised to 2-block storey tiers ---------------
const cells = new Map();
for (const [x, z, gr, roof] of cellsArr) {
  const ground = clamp(Math.round(gr), 0, H - 1);
  const tier = 2 * Math.round(Math.round(roof) / 2);
  cells.set(key(x, z), { g: ground, r: clamp(tier, ground + 4, 20) });
}
const inF = (x, z) => cells.has(key(x, z));
const edge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

// piers every 3 cells on the long faces; glass between; glazed ends
function windowCell(x, z) {
  if ((z === 0 || z === D - 1) && x > 0 && x < W - 1) return x % 3 !== 0;
  if ((x === 0 || x === W - 1) && z > 0 && z < D - 1) return true;
  return false;
}
// is this cell a recessed front window (opening set back one block, glass in the reveal)?
const recessFront = (x, z) => z === 0 && windowCell(x, z) && inF(x, 1) && !edge(x, 1);
const recessEnd = (x, z) => (x === 0 || x === W - 1) && windowCell(x, z) && inF(1, z) && !edge(1, z);

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// ---- build every footprint cell --------------------------------------------
for (const [k, { g: gr, r }] of cells) {
  const [x, z] = k.split(",").map(Number);
  const isEdge = edge(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < r; y++) {
    const top = y === r - 1;

    if (!isEdge) {
      if (top || y === gr || y % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue; // air behind glass
    }
    if (top) { g.set(x, y, z, "chiseled_stone_bricks"); continue; }      // cornice
    if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }      // base course
    if (y % 2 === 0) { g.set(x, y, z, "calcite"); continue; }            // spandrel band

    // window row (odd y)
    if (recessFront(x, z) || recessEnd(x, z)) {
      // opening left as a reveal; glass sits one block inside
      if (recessFront(x, z)) {
        g.set(x, y, 1, "glass_pane", GLASS_EW);
        if (x % 6 === 2 && y > gr && y < r - 1 && !edge(x, 2)) g.set(x, y, 2, "glowstone");
      }
      if (recessEnd(x, z)) {
        g.set(1, y, z, "glass_pane", GLASS_NS);
      }
    } else if (windowCell(x, z)) {
      // corner-side glazing that is on the perimeter of a short cell
      g.set(x, y, z, "glass_pane", (z === 0 || z === D - 1) ? GLASS_EW : GLASS_NS);
    } else {
      g.set(x, y, z, "calcite");
    }
  }

  if (isEdge && r < H) g.set(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- entrance on the street front (z = 0), centred on x = 9 ----------------
{
  const door = cells.get(key(9, 0));
  if (door) {
    const gr = door.g;
    // pilasters flanking the door, lintel over
    g.set(8, gr + 1, 0, "calcite");
    g.set(10, gr + 1, 0, "calcite");
    g.set(8, gr + 2, 0, "chiseled_stone_bricks");
    g.set(9, gr + 2, 0, "chiseled_stone_bricks");
    g.set(10, gr + 2, 0, "chiseled_stone_bricks");
    g.set(9, gr, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(9, gr + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// ---- roof equipment: cupola and mechanical box, each where the roof is level --
function levelAt(cs) {
  const rs = cs.map(([x, z]) => (cells.has(key(x, z)) ? cells.get(key(x, z)).r : null));
  return rs.every(v => v !== null && v === rs[0]) ? rs[0] : null;
}
{
  const cup = [[9, 2], [10, 2], [9, 3], [10, 3]];
  const Rc = levelAt(cup);
  if (Rc !== null && Rc + 3 < H) {
    for (const [x, z] of cup) {
      g.set(x, Rc, z, "calcite");
      g.set(x, Rc + 1, z, "calcite");
      g.set(x, Rc + 2, z, "chiseled_stone_bricks");
    }
    g.set(9, Rc + 3, 2, "lantern", LANTERN);
  }

  const box = [[14, 2], [15, 2], [14, 3], [15, 3]];
  const Rb = levelAt(box);
  if (Rb !== null && Rb + 1 < H) {
    for (const [x, z] of box) {
      g.set(x, Rb, z, "stone_bricks");
      g.set(x, Rb + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/NYC1001286.nbt`);
