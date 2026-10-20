import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374055";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Levels (absolute, relative to lowest ground y=0):
// storey 1: y 0..4 (shopfront), storey line y=5, storey 2: y 6..9, cornice/roof cap y=10, roof kit y=11.
const STOREY_LINE = 5;
const CORNICE = 10;
const ROOF_KIT = 11;

const key = (x, z) => `${x},${z}`;
const S = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  S.set(key(x, z), Math.max(0, Math.floor(gr)));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => S.has(key(x, z));
const groundAt = (x, z) => S.get(key(x, z));

const miss = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isB = (x, z) => {
  if (!has(x, z)) return false;
  const m = miss(x, z);
  return m.n || m.s || m.w || m.e;
};

// Classify each boundary cell: corner pillar, or a facade cell on one face.
function classify(x, z) {
  const m = miss(x, z);
  const corner = (m.n || m.s) && (m.w || m.e);
  let face = null;
  if (!corner) face = m.n ? "n" : m.s ? "s" : m.w ? "w" : "e";
  const alongZ = face === "n" || face === "s";
  const t = alongZ ? x - minX : z - minZ;
  const run = alongZ ? maxX - minX : maxZ - minZ;
  const pier = corner || t % 3 === 0 || t === run;
  return { corner, face, t, run, pier };
}

// Outward normals and facing names.
const OUT = {
  n: { dx: 0, dz: -1, facing: "north" },
  s: { dx: 0, dz: 1, facing: "south" },
  w: { dx: -1, dz: 0, facing: "west" },
  e: { dx: 1, dz: 0, facing: "east" },
};

// Pick the front (entrance) face: the face carrying the most facade cells.
const faceCount = { n: 0, s: 0, w: 0, e: 0 };
for (const [k, gr] of S) {
  const [x, z] = k.split(",").map(Number);
  if (!isB(x, z)) continue;
  const c = classify(x, z);
  if (c.face && !c.corner) faceCount[c.face]++;
}
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

// Door candidate: non-pier facade cell on the front face nearest the middle.
let doorCell = null;
{
  let best = Infinity;
  for (const [k] of S) {
    const [x, z] = k.split(",").map(Number);
    if (!isB(x, z)) continue;
    const c = classify(x, z);
    if (c.corner || c.face !== front || c.pier) continue;
    const d = Math.abs(c.t - c.run / 2);
    if (d < best) { best = d; doorCell = { x, z }; }
  }
}

// ---- Build ----
for (const [k, gr] of S) {
  const [x, z] = k.split(",").map(Number);

  // Foundation under sloped ground, then base course / floor slab at ground level.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const boundary = isB(x, z);

  if (!boundary) {
    g.set(x, gr, z, "smooth_stone");                       // ground floor slab
    if (gr < STOREY_LINE) g.set(x, STOREY_LINE, z, "smooth_stone"); // storey-2 floor slab
    g.set(x, CORNICE, z, "light_gray_concrete");           // flat roof deck
    continue;
  }

  const c = classify(x, z);
  const alongZ = c.face === "n" || c.face === "s";

  // Base course at ground level on the perimeter.
  g.set(x, gr, z, "stone_bricks");

  for (let y = gr + 1; y <= 9; y++) {
    if (y === STOREY_LINE) {
      g.set(x, y, z, "smooth_quartz");                     // storey line band
    } else if (c.pier) {
      g.set(x, y, z, "white_concrete");                    // structural pier / corner
    } else {
      // Glass pane window, connected along the wall line.
      const state = alongZ
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", state);
    }
  }

  // Cornice: half-slab cap on the parapet line.
  g.set(x, CORNICE, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  // Warm light behind some storey-2 windows (in the air gap, dusk glow).
  if (!c.corner && !c.pier && c.face && c.t % 6 === 1) {
    const o = OUT[c.face];
    const ix = x - o.dx, iz = z - o.dz;
    if (has(ix, iz) && !isB(ix, iz)) {
      g.set(ix, 7, iz, "glowstone");
    }
  }
}

// Entrance on the front face: door in the glass bay, lower and upper halves.
if (doorCell) {
  const { x, z } = doorCell;
  const gr = groundAt(x, z);
  const facing = OUT[front].facing;
  g.set(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof plant: small air-handling units on the interior roof deck.
for (const [k] of S) {
  const [x, z] = k.split(",").map(Number);
  if (isB(x, z)) continue;
  if (x % 4 === 2 && z % 4 === 2) {
    g.set(x, ROOF_KIT, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
