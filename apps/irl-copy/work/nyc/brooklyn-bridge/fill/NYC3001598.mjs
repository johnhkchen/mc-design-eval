import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${SRC}/NYC3001598.cells.json`, "utf8"));

const W = 5, H = 26, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> { x, z, gr, top, rf }
const raw = new Map();
for (const [x, z, gr0, rf0] of cells) {
  raw.set(`${x},${z}`, { x, z, gr: Math.max(0, Math.round(gr0)), rf: Math.round(rf0) });
}

// Smooth lidar roof heights: average each cell with its footprint neighbours, then
// snap to whole blocks so the roof reads as clean tiers rather than noise.
const map = new Map();
for (const c of raw.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nb = raw.get(`${c.x + dx},${c.z + dz}`);
    if (nb) { sum += nb.rf; n++; }
  }
  let top = Math.round(sum / n);
  top = Math.min(H - 1, Math.max(c.gr + 6, top));
  map.set(`${c.x},${c.z}`, { x: c.x, z: c.z, gr: c.gr, top });
}

const has = (x, z) => map.has(`${x},${z}`);
const ds = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // dz=-1 is the street (front) side
const faces = (x, z) => ds.filter(([dx, dz]) => !has(x + dx, z + dz));
const isExt = (x, z) => faces(x, z).length > 0;

const minZ = Math.min(...cells.map(c => c[1]));
const doorX = Math.floor(W / 2);

const BRICK = "bricks";
const BAND = "smooth_sandstone";   // stone string courses and sills
const BASE = "stone_bricks";        // foundation and plinth
const CORNICE = "smooth_stone";
const ROOF = "stone";
const FLOOR = "spruce_planks";
const GLASS = "glass";
const TRIM = "stone_bricks";        // door surround
const LIGHT = "shroomlight";
const DOOR = "spruce_door";
const CANOPY = "black_concrete";

for (const { x, z, gr, top } of map.values()) {
  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  const Hc = top - gr;
  const ext = isExt(x, z);
  const fs = faces(x, z);
  const front = z === minZ;

  for (let o = 0; o < Hc; o++) {
    const y = gr + o;
    const k = Math.floor(o / 3);

    // Roof surface
    if (o === Hc - 1) {
      g.set(x, y, z, ext ? CORNICE : ROOF);
      continue;
    }
    // Interior: floor slabs only, otherwise air
    if (!ext) {
      if (o % 3 === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    // Cornice course under the roof
    if (o === Hc - 2) {
      g.set(x, y, z, CORNICE);
      continue;
    }
    // Ground-floor plinth band
    if (o === 0) {
      g.set(x, y, z, BASE);
      continue;
    }
    // Storey string courses
    if (o % 3 === 0) {
      // Entrance canopy over the door on the street face
      if (front && Math.abs(x - doorX) <= 1 && k === 1) {
        g.set(x, y, z, CANOPY);
      } else {
        g.set(x, y, z, BAND);
      }
      continue;
    }

    const [dx, dz] = fs[0];
    const a = dz !== 0 ? x : z; // position along the facade

    // Entrance: door on the street face at ground floor
    if (front && k === 0) {
      if (x === doorX && (o === 1 || o === 2)) {
        g.set(x, y, z, DOOR, {
          facing: "south",
          half: o === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (Math.abs(x - doorX) === 1) {
        g.set(x, y, z, TRIM);
        continue;
      }
    }

    // Windows on odd positions along the facade, brick piers between
    if (a % 2 === 1) {
      g.set(x, y, z, GLASS);
      // Warm light behind some panes, in the interior cell just inside
      const ix = x - dx, iz = z - dz;
      if (o % 3 === 2 && has(ix, iz) && !isExt(ix, iz) && (x + z + k) % 3 === 0) {
        g.set(ix, y, iz, LIGHT);
      }
    } else {
      g.set(x, y, z, BRICK);
    }
  }
}

g.save(`${SRC}/NYC3001598.nbt`);
