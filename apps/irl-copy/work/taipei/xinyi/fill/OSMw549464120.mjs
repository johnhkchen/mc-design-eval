import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549464120";

const W = 29, H = 33, D = 16;
const TOP = 21;          // parapet top; roof about 21 blocks above lowest ground
const ROOF = 20;         // roof slab / cornice course
const FLOOR_LINES = [5, 10, 15];

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Footprint: cell -> ground (foundation top)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(key(x, z), clamp(Math.round(gr), 0, ROOF - 1));
  }
}
const inFp = (x, z) => ground.has(key(x, z));

// Facade classification
function info(x, z) {
  const west = !inFp(x - 1, z);
  const east = !inFp(x + 1, z);
  const north = !inFp(x, z - 1);
  const south = !inFp(x, z + 1);
  const facade = west || east || north || south;
  const corner = (west || east) && (north || south);
  // Which way the facade runs: along z for x-facing walls, along x otherwise
  const alongZ = west || east;
  const along = alongZ ? z : x;
  const paneNS = alongZ; // panes connect north-south on walls running along z
  // Direction into the building for light placement
  let inward = null;
  if (west) inward = [x + 1, z];
  else if (east) inward = [x - 1, z];
  else if (north) inward = [x, z + 1];
  else if (south) inward = [x, z - 1];
  if (inward && !inFp(inward[0], inward[1])) inward = null;
  return { facade, corner, along, paneNS, inward };
}

// Entrance: facade cells on the minimum-z edge, centred on their median x
const facadeCells = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (info(x, z).facade) facadeCells.push([x, z]);
}
let entrance = new Set();
if (facadeCells.length) {
  const minZ = Math.min(...facadeCells.map(([, z]) => z));
  const cand = facadeCells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
  const midX = cand[Math.floor(cand.length / 2)];
  for (const x of cand) if (Math.abs(x - midX) <= 1) entrance.add(key(x, minZ));
}

const g = new Voxels([W, H, D]);

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const meta = info(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (!meta.facade) {
    // Interior: floor slabs per storey and roof, air between (no interiors)
    for (const y of [...FLOOR_LINES, ROOF]) {
      if (y >= gr) g.set(x, y, z, "smooth_stone");
    }
    // Rooftop plant box on the roof, centred
    if (x >= 9 && x <= 19 && z >= 5 && z <= 10) {
      for (let y = ROOF + 1; y <= ROOF + 2; y++) g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const isEntrance = entrance.has(key(x, z));
  const pier = meta.corner || meta.along % 3 === 0;

  for (let y = gr; y <= TOP; y++) {
    // Entrance opening at ground floor
    if (isEntrance && y <= 3) {
      if (y === 3) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    if (y === gr) {
      g.set(x, y, z, "stone_bricks");                      // base course
    } else if (y === ROOF) {
      g.set(x, y, z, "light_gray_concrete");               // cornice
    } else if (y === TOP) {
      g.set(x, y, z, "white_concrete");                    // parapet
    } else if (y < 5) {
      // Ground floor shopfront (y gr+1..4)
      if (pier) {
        g.set(x, y, z, "stone_bricks");
      } else if (y === 4) {
        g.set(x, y, z, "light_gray_concrete");             // lintel / sign band
      } else {
        g.set(x, y, z, "glass");
      }
    } else {
      const r = y % 5;
      if (r === 0) {
        g.set(x, y, z, "white_concrete");                  // storey line
      } else if (r === 4) {
        g.set(x, y, z, "light_gray_concrete");             // spandrel
      } else if (pier) {
        g.set(x, y, z, "white_concrete");                  // pier
      } else {
        const props = meta.paneNS
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        g.set(x, y, z, "glass_pane", props);
      }
    }
  }

  // Warm light behind some windows / shopfront glass
  if (meta.inward) {
    const [ix, iz] = meta.inward;
    const k2 = Math.floor(5 / 5);
    // Ground floor: shopfront glow
    if (!pier && gr + 2 <= 3 && (meta.along % 3 === 1)) {
      g.set(ix, gr + 2, iz, "glowstone");
    }
    // Upper storeys: a subset of windows lit
    for (let s = 1; s <= 3; s++) {
      const wy = s * 5 + 2;
      if (!pier && wy >= gr && (meta.along + s) % 3 === 0) {
        g.set(ix, wy, iz, "glowstone");
      }
    }
  }

  // Warm glow inside the entrance
  if (isEntrance && meta.inward) {
    const [ix, iz] = meta.inward;
    if (gr <= 2) g.set(ix, 2, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
