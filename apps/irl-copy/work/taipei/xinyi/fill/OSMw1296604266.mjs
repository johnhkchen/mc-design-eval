import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record for this footprint. The lidar roof height (~11 blocks) reads as a
// two-storey low-rise: a 5-block storey, a 5-block storey, and a stone cornice.
// Taipei mid-century shophouse language: white concrete piers, glass bays,
// a stone string course and cap, and a shopfront on the street (south) face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1296604266";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, y]) => [key(x, z), y]));
const inFp = (x, z) => ground.has(key(x, z));

const SIDES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function setb(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inFp(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function edgesOf(x, z) {
  return Object.keys(SIDES).filter(s => {
    const [dx, dz] = SIDES[s];
    return !inFp(x + dx, z + dz);
  });
}

function paneProps(side) {
  const along = side === "north" || side === "south";
  return along
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
}

// Facade spec for an edge cell: side, p = index along the wall, yRel = height above ground.
function facade(side, p, yRel) {
  const front = side === "south";
  const pane = paneProps(side);

  // Storey lines: string course at yRel 5 and cap at 10 are handled by the caller.
  if (yRel === 6 || yRel === 9) return { id: "quartz_block" };

  // Storey 1 (yRel 1..4): shopfront with door and glazed bays.
  if (yRel >= 1 && yRel <= 4) {
    if (front && p === 10) {
      if (yRel <= 2) {
        return {
          id: "oak_door",
          props: {
            facing: "south",
            half: yRel === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          },
        };
      }
      if (yRel === 3) return { id: "stone_bricks" };
    }
    if (yRel === 4) return { id: "smooth_stone" };
    if (p % 4 === 0) return { id: "white_concrete" };
    return { id: "glass_pane", props: pane };
  }

  // Storey 2 (yRel 7..8): window bays with white concrete piers.
  if (yRel === 7 || yRel === 8) {
    if (p % 3 === 0) return { id: "white_concrete" };
    return { id: "glass_pane", props: pane };
  }

  return { id: "white_concrete" };
}

// Pass 1: foundations, floor slabs, roof deck and facade on every cell.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) setb(x, y, z, "stone_bricks");

  // Base course / ground floor slab.
  setb(x, gr, z, "smooth_stone");

  const edges = edgesOf(x, z);
  const edgeCell = edges.length > 0;

  // Storey line (floor 2) and roof cornice / deck.
  setb(x, gr + 5, z, edgeCell ? "stone_bricks" : "light_gray_concrete");
  setb(x, gr + 10, z, edgeCell ? "stone_bricks" : "light_gray_concrete");

  // Facades on exposed sides.
  for (const side of edges) {
    const along = side === "north" || side === "south";
    const p = along ? x : z;
    for (let yRel = 1; yRel <= 9; yRel++) {
      if (yRel === 5) continue; // string course already placed
      const spec = facade(side, p, yRel);
      setb(x, gr + yRel, z, spec.id, spec.props);
    }
  }
}

// Pass 2: warm lights behind some glass (glowstone in the interior, one cell in).
for (const [x, z, gr] of cells) {
  const edges = edgesOf(x, z);
  for (const side of edges) {
    const along = side === "north" || side === "south";
    const p = along ? x : z;
    const [dx, dz] = SIDES[side];
    const xi = x - dx, zi = z - dz;
    if (!inFp(xi, zi)) continue;
    if (edgesOf(xi, zi).length > 0) continue;
    const gi = ground.get(key(xi, zi));
    if (p % 6 === 2) setb(xi, gi + 2, zi, "glowstone");
    if (p % 6 === 1) setb(xi, gi + 7, zi, "glowstone");
  }
}

// Pass 3: one rooftop plant box (2x2) on the deck, on a level patch of footprint.
let placedTank = false;
for (let x = 2; x <= W - 4 && !placedTank; x++) {
  for (let z = 2; z <= D - 4 && !placedTank; z++) {
    const pts = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (!pts.every(([a, b]) => inFp(a, b))) continue;
    const gs = pts.map(([a, b]) => ground.get(key(a, b)));
    if (!gs.every(v => v === gs[0])) continue;
    const base = gs[0];
    for (const [a, b] of pts) {
      setb(a, base + 11, b, "white_concrete");
      setb(a, base + 12, b, "iron_block");
    }
    placedTank = true;
  }
}

g.save(`${DIR}/${ID}.nbt`);
