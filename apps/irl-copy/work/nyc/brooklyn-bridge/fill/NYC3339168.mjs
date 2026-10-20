import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3339168";
const W = 10, H = 17, D = 5;

// ---- read footprint -------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const cells = new Map();
for (const c of list) {
  const [x, z, gr, roof] = c;
  cells.set(`${x},${z}`, { g: Math.round(gr), roof: Math.round(roof) });
}
// y 0 = lowest ground under the footprint
const y0 = Math.min(...[...cells.values()].map((c) => c.g));
for (const c of cells.values()) {
  c.g = Math.max(0, c.g - y0);
  c.roof = Math.max(0, c.roof - y0);
}

// Even ground rows so every storey line sits on the same absolute rows.
for (const c of cells.values()) {
  c.g = Math.min(12, 2 * Math.ceil(c.g / 2));
}

// One roof height for the whole building (lidar noise smoothed away).
const roofs = [...cells.values()].map((c) => c.roof).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const maxG = Math.max(...[...cells.values()].map((c) => c.g));
let P = 2 * Math.round((medianRoof - 1) / 2);     // top block row of the parapet
P = Math.max(P, maxG + 4);
P = Math.min(P, 14);                               // keeps the bulkhead inside H

const has = (x, z) => cells.has(`${x},${z}`);
const exposures = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- massing: two storeys of 2 blocks, one flat parapeted roof -------------
for (const [key, c] of cells) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposures(x, z);
  const perim = ex.length > 0;
  const corner = ex.length >= 2;
  const base = c.g;

  // foundation up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone");

  for (let y = base; y <= P; y++) {
    const r = y - base;

    // roof deck / parapet coping
    if (y === P) {
      put(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // interior: floor slabs on even rows, air gap otherwise
    if (!perim) {
      if (r % 2 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // exterior
    if (r === 0) {
      if (ex.includes("n") && x === 4 && z === 0) {
        put(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "polished_granite");
      }
      continue;
    }

    // spandrel / stringcourse bands on even rows
    if (r % 2 === 0) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // odd rows: window row, or brick piers
    if (ex.includes("n") && x === 4 && z === 0 && r === 1) {
      put(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    const face = ex[0];
    const along = face === "n" || face === "s" ? x : z;
    const pier = corner || along % 2 === 0;
    if (pier) {
      put(x, y, z, "bricks");
      continue;
    }

    // entrance lanterns flanking the door, standing on the granite base
    if (ex.includes("n") && z === 0 && (x === 3 || x === 5) && r === 1) {
      put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }

    // glass pane; orientation follows the wall plane
    const alongX = face === "n" || face === "s";
    put(x, y, z, "glass_pane", {
      north: alongX ? "false" : "true",
      south: alongX ? "false" : "true",
      east: alongX ? "true" : "false",
      west: alongX ? "true" : "false",
      waterlogged: "false",
    });

    // warm light in the air gap behind some front windows
    if (ex.includes("n") && z === 0 && x % 2 === 1 && ((x + 1) / 2 + (r - 1) / 2) % 2 === 0) {
      if (has(x, 1) && exposures(x, 1).length === 0) put(x, y, 1, "glowstone");
    }
  }
}

// ---- roof: elevator machine bulkhead and a water tank ----------------------
for (const x of [6, 7]) {
  for (const z of [1, 2]) {
    if (!has(x, z) || exposures(x, z).length) continue;
    put(x, P + 1, z, "bricks");
    put(x, P + 2, z, "stone_bricks");
  }
}
if (has(2, 2) && exposures(2, 2).length === 0) {
  put(2, P + 1, 2, "barrel", { facing: "up", open: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
