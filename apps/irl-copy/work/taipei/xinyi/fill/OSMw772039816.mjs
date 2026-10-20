import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw772039816: unrecorded low-rise, 14 x 16 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey Taipei shophouse of the 1970s-80s: white tiled facade,
// stone plinth, shopfront glazing on the street (z = 0) and a parapet with a rooftop tank.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw772039816.cells.json", "utf8"));

const W = 14, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const FOUND = "stone_bricks";      // foundation / plinth
const BASE = "smooth_stone";       // base course and cornice
const WALL = "white_terracotta";   // tiled facade
const PIER = "light_gray_concrete";// piers, spandrels, floor bands
const FLOOR = "smooth_stone";      // interior floor slabs
const ROOF = "light_gray_concrete";
const GLASS = "glass_pane";
const LIGHT = "glowstone";

const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Footprint map: "x,z" -> ground
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, gr);
const inFoot = (x, z) => foot.has(`${x},${z}`);

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const top = gr + 11;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, FOUND);

  // Perimeter test and which outside face it sits on
  const outE = !inFoot(x + 1, z), outW = !inFoot(x - 1, z);
  const outS = !inFoot(x, z + 1), outN = !inFoot(x, z - 1);
  const perim = outE || outW || outS || outN;
  const onZwall = outN || outS; // street-facing or rear facade running along X
  const idx = onZwall ? x : z;   // position along the wall
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const pierBay = corner || idx % 4 === 0 || idx % 4 === 3;

  // Inward cell for glowstone behind glass
  let ix = x, iz = z;
  if (outE) ix = x - 1; else if (outW) ix = x + 1;
  else if (outS) iz = z - 1; else if (outN) iz = z + 1;

  // Ground level: base course / floor
  set(x, gr, z, perim ? BASE : FLOOR);

  // Storey 1 (gr+1..gr+4): shopfront glazing, taller on the street
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (!perim) { set(x, y, z, "air"); continue; }
    if (y === gr + 4) { set(x, y, z, PIER); continue; } // storey line / lintel
    if (pierBay) { set(x, y, z, WALL); continue; }
    // Entrance on street wall at x = 6
    if (outN && x === 6 && y <= gr + 2) {
      if (y === gr + 1) set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    set(x, y, z, GLASS, onZwall
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }

  // Floor slab between storeys
  set(x, gr + 5, z, perim ? PIER : FLOOR);

  // Storey 2 (gr+6..gr+9): tiled facade with ribbon windows
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (!perim) { set(x, y, z, "air"); continue; }
    if (y === gr + 6 || y === gr + 9) { set(x, y, z, PIER); continue; } // spandrels
    if (pierBay) { set(x, y, z, WALL); continue; }
    const lit = idx % 8 === 1 && inFoot(ix, iz) && y === gr + 7;
    if (lit) {
      set(x, y, z, GLASS, onZwall
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      set(ix, y, iz, LIGHT); // warm light behind the glass
      continue;
    }
    set(x, y, z, GLASS, onZwall
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }

  // Roof slab / cornice at gr+10
  set(x, gr + 10, z, perim ? BASE : ROOF);

  // Parapet at gr+11 on the perimeter, roof deck inside
  if (perim) {
    set(x, gr + 11, z, pierBay ? PIER : WALL);
  }
}

// Rooftop water tank and plant, centred on the roof
for (let x = 5; x <= 8; x++) {
  for (let z = 6; z <= 9; z++) {
    if (!inFoot(x, z)) continue;
    const gr = foot.get(`${x},${z}`);
    const edge = x === 5 || x === 8 || z === 6 || z === 9;
    set(x, gr + 11, z, edge ? PIER : "stone_brick_slab", edge ? undefined : { type: "top", waterlogged: "false" });
    if (edge) set(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Street-side entrance lintel shelf (footprint only, at storey-1 top)
for (let x = 5; x <= 8; x++) {
  if (inFoot(x, 0)) {
    const gr = foot.get(`${x},0`);
    if (x !== 6) set(x, gr + 4, 0, BASE);
    else set(x, gr + 4, 0, BASE);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw772039816.nbt");
