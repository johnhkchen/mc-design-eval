import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280231";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 33, D = 17;
const TOP = 21;          // parapet cap; roof deck at TOP-1
const DECK = TOP - 1;    // 20, roof slab and cornice band line

const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr ?? 0);
const inFp = (x, z) => ground.has(`${x},${z}`);
const gndOf = (x, z) => ground.get(`${x},${z}`) ?? 0;

// Footprint extents, used for the entrance position and roof plant centring
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}
const ex = Math.floor((xmin + xmax) / 2);      // south entrance, two cells wide (ex, ex+1)
const cx = Math.round((xmin + xmax) / 2);
const cz = Math.round((zmin + zmax) / 2);

// Which faces of a footprint cell are exposed
function faces(x, z) {
  return {
    N: !inFp(x, z - 1),
    S: !inFp(x, z + 1),
    W: !inFp(x - 1, z),
    E: !inFp(x + 1, z),
  };
}

const perimeterOf = (x, z) => {
  const f = faces(x, z);
  return f.N || f.S || f.W || f.E;
};

// Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr0] of cells) {
  const gr = gr0 ?? 0;
  for (let y = 0; y < gr && y < H; y++) {
    g.set(x, y, z, "stone_bricks");
  }
}

// Building shell, storeys, floor slabs, roof deck, parapet
for (const [x, z, gr0] of cells) {
  const gr = gr0 ?? 0;
  const f = faces(x, z);
  const exposed = f.N || f.S || f.W || f.E;
  const cornerCell = [f.N, f.S, f.W, f.E].filter(Boolean).length >= 2;
  const nsFace = f.N || f.S;           // along-axis is x for N/S faces, z for E/W faces

  for (let y = gr; y <= TOP && y < H; y++) {
    const r = y % 5;

    if (!exposed) {
      // Interior: floor slabs at storey lines and roof deck, air elsewhere
      if (y === DECK) g.set(x, y, z, "light_gray_concrete");
      else if (y === gr) g.set(x, y, z, "light_gray_concrete");
      else if (y % 5 === 0 && y > gr && y < DECK) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Perimeter / facade
    if (y === TOP) { g.set(x, y, z, "smooth_stone"); continue; }     // parapet cap
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }      // base course
    if (y === DECK || (r === 0 && y > gr)) {                         // cornice / storey line
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (r === 4) { g.set(x, y, z, "white_concrete"); continue; }     // spandrel
    if (y === DECK + 0) continue;

    const a = nsFace ? x : z;
    const groundStorey = y < 5;

    // Ground-floor entrance on the south face: two-cell opening
    if (f.S && !cornerCell && groundStorey && (x === ex || x === ex + 1) && y > gr && r >= 1 && r <= 3) {
      // Opening left as air, glazed doors read as an inset; canopy above (spandrel row) stays solid
      continue;
    }

    // Pillars / mullions every third cell, corners solid
    if (cornerCell || a % 3 === 0) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Window zone (glazing with white frames)
    if (r >= 1 && r <= 3) {
      g.set(x, y, z, "light_blue_stained_glass");
      continue;
    }
  }
}

// Warm light behind some windows (glowstone in the interior air gap)
for (const [x, z, gr0] of cells) {
  const gr = gr0 ?? 0;
  const f = faces(x, z);
  const exposed = f.N || f.S || f.W || f.E;
  const cornerCell = [f.N, f.S, f.W, f.E].filter(Boolean).length >= 2;
  if (!exposed || cornerCell) continue;
  const nsFace = f.N || f.S;
  const a = nsFace ? x : z;
  if (a % 6 !== 1) continue;

  // Inward neighbour, opposite the exposed face
  let dx = 0, dz = 0;
  if (f.N) dz = 1;
  else if (f.S) dz = -1;
  else if (f.W) dx = 1;
  else if (f.E) dx = -1;

  const ix = x + dx, iz = z + dz;
  if (!inFp(ix, iz) || perimeterOf(ix, iz)) continue;

  for (const storeyBase of [0, 5, 10, 15]) {
    const y = storeyBase + 2;
    if (y < gr + 1 || y > DECK - 1) continue;
    if (storeyBase === 0 && (x === ex || x === ex + 1) && f.S) continue; // keep entrance clear
    g.set(ix, y, iz, "glowstone");
  }
}

// Entrance canopy: lantern-lit soffit over the south opening, on the interior side
for (const dx of [ex, ex + 1]) {
  const z = zmax;
  if (!inFp(dx, z)) continue;
  const gr = gndOf(dx, z);
  const y = gr + 3;
  if (y < DECK && !perimeterOf(dx, z - 1)) {
    g.set(dx, y, z - 1, "lantern", { hanging: "true" });
  }
}

// Roof plant: a small mechanical block on the deck, centred on the footprint
for (const [x, z, gr0] of cells) {
  if (perimeterOf(x, z)) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
    g.set(x, TOP, z, "light_gray_concrete");
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
      g.set(x, TOP + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
