import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE90-0125-13F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 76, D = 23;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup, lowest ground, and z-min row
const ground = new Map();
let minG = Infinity;
let minZ = Infinity;
for (const [x, z, gy] of cells) {
  ground.set(x + "," + z, gy);
  minG = Math.min(minG, gy);
  minZ = Math.min(minZ, z);
}
const has = (x, z) => ground.has(x + "," + z);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance in cells from the outside edge (d=1 is the lower facade ring)
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  const edge = NB.some(([dx, dz]) => !has(x + dx, z + dz));
  if (edge) {
    dist.set(x + "," + z, 1);
    queue.push([x, z]);
  }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = dist.get(x + "," + z);
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    const k = nx + "," + nz;
    if (has(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Roof about 64 blocks above lowest ground, capped so penthouse and mast fit under H
const top = Math.min(minG + 63, 70);
const topRel = top - minG;
const topStorey = Math.floor(topRel / 5);

// Setback: from storey 8 up the facade steps in one cell (ring d=2)
const SETBACK = 8;
const facadeD = (n) => (n >= SETBACK ? 2 : 1);

// Entrance on the z-min face, centred on that row
const entryRow = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const mid = entryRow.length ? entryRow[Math.floor(entryRow.length / 2)] : -99;
const doorXs = [mid, mid + 1].filter((x) => has(x, minZ));

// Mast cell: innermost cell
let maxD = 0, mastCell = null;
for (const [x, z] of cells) {
  const d = dist.get(x + "," + z);
  if (d > maxD) { maxD = d; mastCell = [x, z]; }
}

const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

for (const [x, z, gy] of cells) {
  const d = dist.get(x + "," + z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "gray_concrete");

  for (let y = gy; y <= top; y++) {
    const rel = y - minG;
    const n = Math.floor(rel / 5);
    const k = rel % 5;
    const fd = facadeD(n);

    // Roof level
    if (y === top) {
      if (d === fd) put(x, y, z, "white_concrete");     // parapet
      else if (d >= 3) put(x, y, z, "light_gray_concrete"); // roof deck
      continue;
    }

    // Mechanical floor under the roof: solid for inner cells, so the roof deck is supported
    if (n === topStorey && d >= 3) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Structural core columns in the interior, full height
    if (d >= 3 && x % 4 === 2 && z % 4 === 2) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (n === 0 && d === 1) {
      // Ground-floor shopfront
      if (k === 0) { put(x, y, z, "polished_granite"); continue; }
      if (k === 4) { put(x, y, z, "white_concrete"); continue; }
      const onEntryFace = z === minZ;
      if (onEntryFace && doorXs.includes(x) && (k === 1 || k === 2)) {
        put(x, y, z, "iron_door", {
          facing: "south",
          half: k === 1 ? "lower" : "upper",
          hinge: x === doorXs[0] ? "left" : "right",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (onEntryFace && k === 3 && x >= mid - 2 && x <= mid + 3) {
        put(x, y, z, "light_gray_concrete");   // entrance canopy
        continue;
      }
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Terrace ledge on the lower ring at the setback
    if (n === SETBACK && d === 1 && k === 0) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade of the current tier
    if (d === fd) {
      if (k === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // spandrel
      if (k === 4) { put(x, y, z, "white_concrete"); continue; }        // head band
      if (isCorner(x, z)) { put(x, y, z, "white_concrete"); continue; } // corner pilaster
      const frame = x % 3 === 0 || z % 3 === 0;
      if (frame) { put(x, y, z, "white_concrete"); continue; }
      if (k === 2 && (x * 7 + z * 3 + n * 5) % 23 === 0) {
        put(x, y, z, "glowstone");   // warm light behind a window
        continue;
      }
      put(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }

    // Lower ring above the setback is open to the terrace air
    if (d === 1) continue;

    // Interior: one floor slab per storey, air gap otherwise
    if (k === 0) put(x, y, z, "light_gray_concrete");
  }

  // Mechanical penthouse on the inner cells (d >= 3)
  if (d >= 3) {
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, "light_gray_concrete");
    put(x, top + 3, z, "white_concrete");
  }
}

// Mast on the innermost cell, standing on the penthouse or the roof deck
if (mastCell) {
  const [mx, mz] = mastCell;
  const d = dist.get(mx + "," + mz);
  const base = d >= 3 ? top + 4 : top + 1;
  const len = Math.max(0, Math.min(4, H - 1 - base));
  for (let i = 0; i < len; i++) {
    put(mx, base + i, mz, "lightning_rod", { facing: "up", powered: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
