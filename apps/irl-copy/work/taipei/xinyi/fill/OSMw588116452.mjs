import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s commercial block on the Xinyi frontage: white tiled concrete
// piers, tinted glass bays, granite shopfront, four storeys, parapet, and a
// rooftop plant box. Roof top at y 22 (blocks to y 21), plant to y 23.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588116452";
const W = 40, D = 12, H = 34;
const ROOF = 20;      // roof slab
const TOP = 21;       // parapet course
const FLOORS = [5, 10, 15, 20];

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}

const has = (x, z) => ground.has(`${x},${z}`);
const isExt = (x, z) => faces(x, z).length > 0;

// Exterior faces of a footprint cell: N = missing z-1, S = missing z+1,
// W = missing x-1, E = missing x+1.
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Pass 1: foundations, shell, floors, facade, roof
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const fc = faces(x, z);
  const ext = fc.length > 0;
  const corner = fc.length > 1;
  const along = fc.includes("N") || fc.includes("S") ? x : z;
  const pier = corner || along % 4 === 0;

  // Foundation under grade
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Main entrance: one bay on the long (N/S) faces, centred on x = 20
  const door = ext && fc.length === 1 && (fc[0] === "N" || fc[0] === "S")
    && x === 20 && gr <= 2;

  for (let y = gr; y <= TOP; y++) {
    if (door && y === gr) {
      put(x, y, z, "dark_oak_door", {
        facing: fc[0] === "N" ? "north" : "south",
        half: "lower", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (door && y === gr + 1) {
      put(x, y, z, "dark_oak_door", {
        facing: fc[0] === "N" ? "north" : "south",
        half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (y === gr) {
      put(x, y, z, ext ? "polished_granite" : "smooth_stone");
      continue;
    }
    if (y === ROOF) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (y === TOP) {
      if (ext) put(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (FLOORS.includes(y)) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (!ext) continue;

    // Facade bands: ground 0-4, storeys 5-9, 10-14, 15-19
    const bb = y < 5 ? 0 : y < 10 ? 5 : y < 15 ? 10 : 15;
    const rel = y - bb;
    const groundBand = bb === 0;

    if (rel === 4) {
      // spandrel / fascia course
      put(x, y, z, pier ? (groundBand ? "polished_granite" : "white_concrete") : "light_gray_concrete");
    } else if (rel >= 1 && rel <= 3) {
      if (pier) {
        put(x, y, z, groundBand ? "polished_granite" : "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }
}

// Pass 2: warm lanterns just inside some window bays
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const fc = faces(x, z);
  if (fc.length !== 1) continue;
  const f = fc[0];
  const along = f === "N" || f === "S" ? x : z;
  if (along % 4 === 0) continue; // pier column

  let dx = 0, dz = 0;
  if (f === "N") dz = 1;
  if (f === "S") dz = -1;
  if (f === "W") dx = 1;
  if (f === "E") dx = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isExt(ix, iz)) continue;

  for (const bb of [0, 5, 10, 15]) {
    if (bb === 0 && gr > 2) continue;
    if (bb > 0 && bb < gr) continue;
    if ((along + bb) % 3 !== 0) continue;
    const floorY = bb === 0 ? gr : bb;
    const yL = floorY + 1;
    put(ix, yL, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: rooftop plant box (sits on the roof slab at y 20)
for (let x = 14; x <= 25; x++) {
  for (let z = 3; z <= 8; z++) {
    if (!has(x, z)) continue;
    put(x, 21, z, "light_gray_concrete");
    put(x, 22, z, "light_gray_concrete");
    put(x, 23, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
