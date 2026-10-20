import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// CPC Building, Xinyi, Taipei. 1990s-era office block: five storeys of
// white and light-grey concrete with blue-tinted glazing, a stone-faced base,
// a continuous parapet, a recessed street lobby and a central rooftop plant room.
// Roof top sits at y 25 (26 blocks above the lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309155289";
const W = 133, H = 38, D = 170;
const ROOF = 25;                    // top course of the main block
const SLABS = [0, 5, 10, 15, 20];   // floor lines (storey k spans rows 5k..5k+4)
const CX = 66, CZ = 85;             // plan centre for entrance and plant room

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
  }
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Pass 1: foundations, facades, floors, roof.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = groundAt(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  const edge = missX || missZ;
  const corner = missX && missZ;
  const along = missX ? z : x;               // index along the facade for mullion rhythm
  const streetFacade = !has(x, z - 1);       // min-z facade carries the lobby
  const lobby = streetFacade && Math.abs(x - CX) <= 4;

  if (edge) {
    for (let y = gr; y <= ROOF; y++) {
      const k = Math.floor(y / 5);
      const r = y % 5;
      const rel = y - gr;

      // Recessed street lobby: glazed opening, lintel above.
      if (lobby) {
        if (rel <= 2) {
          // doorway: glass doors on the lower two rows, open glazing above
          g.set(x, y, z, Math.abs(x - CX) <= 1 && rel <= 1 ? "air" : "tinted_glass");
          continue;
        }
        if (rel === 3) { g.set(x, y, z, "white_concrete"); continue; } // lintel
      }

      // Base course: stone-faced plinth.
      if (rel < 2 && y < 5) { g.set(x, y, z, "polished_andesite"); continue; }

      if (corner) { g.set(x, y, z, "white_concrete"); continue; }
      if (y === ROOF) { g.set(x, y, z, "white_concrete"); continue; } // parapet
      if (r === 0) { g.set(x, y, z, "white_concrete"); continue; }    // slab band
      if (r === 4) { g.set(x, y, z, "light_gray_concrete"); continue; } // spandrel

      // Window rows 1..3 of each storey.
      if (along % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; } // mullion
      if ((along * 7 + k * 3) % 11 === 0) {
        g.set(x, y, z, "glowstone");             // warm lit office
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Interior floors and roof (solid slabs; air between, no interiors).
  if (!edge) {
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF) g.set(x, y, z, "light_gray_concrete");
      else if (SLABS.includes(y)) g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// Pass 2: lobby light behind the street glazing, one cell in from the facade.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = groundAt(x, z);
  if (!has(x, z - 1) && Math.abs(x - CX) <= 4 && has(x, z + 1)) {
    const y = gr + 1;
    if (Math.abs(x - CX) === 2) g.set(x, y, z + 1, "sea_lantern");
  }
}

// Pass 3: rooftop plant room on the roof slab (rows 26..28), inside the footprint.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const inPlant = Math.abs(x - CX) <= 18 && Math.abs(z - CZ) <= 24;
  if (!inPlant) continue;
  const interior = has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
  if (!interior) continue;
  const rim = Math.abs(x - CX) === 18 || Math.abs(z - CZ) === 24;
  g.set(x, 26, z, rim ? "white_concrete" : "gray_concrete");
  g.set(x, 27, z, rim ? "white_concrete" : "gray_concrete");
  g.set(x, 28, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
