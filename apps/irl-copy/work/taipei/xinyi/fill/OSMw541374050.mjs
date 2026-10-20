import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541374050";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 11, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, Math.round(gr));
const inF = (x, z) => foot.has(`${x},${z}`);

// Which sides (outward) of a cell touch open ground
function missingSides(x, z) {
  const m = [];
  if (!inF(x, z - 1)) m.push("N");
  if (!inF(x, z + 1)) m.push("S");
  if (!inF(x - 1, z)) m.push("W");
  if (!inF(x + 1, z)) m.push("E");
  return m;
}
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const outwardFacing = { N: "north", S: "south", W: "west", E: "east" };

// Pass 1: foundations, floors, roof deck for every footprint cell
for (const [x, z, gr] of cells.map(([a, b, c]) => [a, b, Math.round(c)])) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  const miss = missingSides(x, z);
  if (miss.length === 0) {
    // interior cell: floor slabs and roof deck, air between
    g.set(x, gr, z, "smooth_stone");
    if (gr < 5) g.set(x, 5, z, "smooth_stone");
    g.set(x, 9, z, "light_gray_concrete");
  }
}

// Pass 2: perimeter walls, base course, storey lines, cornice, parapet, windows
const entranceCandidates = [];
for (const [x, z, gr0] of cells.map(([a, b, c]) => [a, b, Math.round(c)])) {
  const miss = missingSides(x, z);
  if (miss.length === 0) continue;
  if (miss.includes("N")) entranceCandidates.push([x, z, gr0]);
}
// Entrance: north-facing edge cell nearest the middle of the frontage
let entrance = null;
if (entranceCandidates.length) {
  const xs = entranceCandidates.map((c) => c[0]).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  entrance = entranceCandidates.reduce((best, c) =>
    Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best);
}

const lampCells = [];
for (const [x, z, gr0] of cells.map(([a, b, c]) => [a, b, Math.round(c)])) {
  const miss = missingSides(x, z);
  if (miss.length === 0) continue;
  const corner = miss.length >= 2;
  // position along the wall for window rhythm
  const t = miss.includes("N") || miss.includes("S") ? x : z;
  const pillar = corner || t % 2 === 0;

  for (let y = gr0; y <= 10; y++) {
    let b;
    if (y === gr0) b = "stone_bricks";                       // base course
    else if (y === 5) b = "smooth_stone";                    // storey line
    else if (y === 9) b = "stone_bricks";                    // cornice
    else if (y === 10) b = "smooth_stone_slab";              // parapet cap
    else if (y >= 1 && y <= 3 + 1 && y > gr0) {              // ground floor 1..4
      b = (!pillar && y >= gr0 + 1 && y <= gr0 + 3) ? "glass" : "white_concrete";
    } else if (y >= 6 && y <= 8) {                           // upper floor 6..8
      b = pillar ? "white_concrete" : "glass";
    } else {
      b = "white_concrete";
    }
    if (b === "smooth_stone_slab") {
      g.set(x, y, z, b, { type: "bottom", waterlogged: "false" });
    } else {
      g.set(x, y, z, b);
    }
  }

  // window frames: warm lamps behind some upper-floor glass
  if (!pillar && t % 4 === 1) {
    const side = miss[0];
    const [dx, dz] = inward[side];
    const ix = x + dx, iz = z + dz;
    if (inF(ix, iz) && missingSides(ix, iz).length === 0) {
      lampCells.push([ix, iz, 7]);
    }
  }
}

// Entrance: door on the north frontage with a transom and lintel above
if (entrance) {
  const [ex, ez, egr] = entrance;
  const f = outwardFacing.N;
  g.set(ex, egr + 1, ez, "oak_door", {
    facing: f, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(ex, egr + 2, ez, "oak_door", {
    facing: f, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  g.set(ex, egr + 3, ez, "smooth_stone");
}

// Warm lights behind glass
for (const [x, y, z] of lampCells) g.set(x, y, z, "glowstone");

// Rooftop plant: a small AC block on the roof deck, near the centre
for (let x = 4; x <= 6; x++) {
  for (let z = 7; z <= 9; z++) {
    if (inF(x, z) && missingSides(x, z).length === 0) {
      g.set(x, 10, z, "iron_block");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
