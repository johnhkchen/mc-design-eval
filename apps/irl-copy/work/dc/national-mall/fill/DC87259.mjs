import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87259";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 27, D = 14;
const STOREY = 3;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { ground: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// One smoothed roof level for the whole block (lidar noise removed), quantised to storeys.
const roofs = cells.map(([, , , r]) => Math.round(r)).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const roofLevel = Math.round(medRoof / STOREY) * STOREY;

const info = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = map.get(`${x},${z}`);
  const ground = clamp(c.ground, 0, H - 10);
  const top = clamp(roofLevel, ground + 4 * STOREY - 3, H - 5);
  info.set(`${x},${z}`, { ground, top });
}

// Find the entrance: north face (lowest z), nearest the centre line.
const doorCandidates = cells
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
const [dx, dz] = doorCandidates[0] ?? [-1, -1];

// Penthouse: one set-back mechanical volume on the roof deck, centred.
const penthouse = (x, z) => x >= 7 && x <= 12 && z >= 4 && z <= 9;

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { ground, top } = info.get(`${x},${z}`);
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);
  const pilaster = perim && (x % 4 === 0 || z % 4 === 0 || x === 0 || x === W - 1 || z === 0 || z === D - 1);

  // Foundation under the cell up to its ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < top; y++) {
    if (!perim) {
      if (y === ground || (y % STOREY === 0 && y < top - 1) || y === top - 1) {
        g.set(x, y, z, "smooth_stone");
      } else if (y > ground && y % STOREY === 1 && y < top - 2 && (x + z) % 4 === 0) {
        g.set(x, y, z, "lantern", { hanging: "false" });
      }
      continue;
    }

    // Perimeter facade.
    if (y === top - 1) {
      g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // cornice cap
    } else if (y === top - 2) {
      g.set(x, y, z, "calcite");                                             // parapet band
    } else if (y === ground) {
      g.set(x, y, z, "polished_granite");                                    // base course
    } else if (y % STOREY === 0) {
      g.set(x, y, z, "calcite");                                             // storey line
    } else if (corner || pilaster) {
      g.set(x, y, z, "calcite");                                             // pilasters and piers
    } else {
      g.set(x, y, z, "glass_pane");                                          // window bays
    }
  }
}

// Penthouse on the interior roof deck (stands on the roof slab, no floating).
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (isPerim(x, z) || !penthouse(x, z)) continue;
  const { top } = info.get(`${x},${z}`);
  for (let k = 0; k < 3; k++) g.set(x, top + k, z, "stone_bricks");
  g.set(x, top + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance: framed opening with calcite piers and a lintel.
if (dx >= 0) {
  const { ground } = info.get(`${dx},${dz}`);
  for (const ox of [-1, 1]) {
    if (has(dx + ox, dz)) {
      g.set(dx + ox, ground, dz, "polished_granite");
      g.set(dx + ox, ground + 1, dz, "calcite");
      g.set(dx + ox, ground + 2, dz, "calcite");
    }
  }
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  g.set(dx, ground, dz, "oak_door", doorProps("lower"));
  g.set(dx, ground + 1, dz, "oak_door", doorProps("upper"));
  g.set(dx, ground + 2, dz, "calcite");
  if (has(dx + 1, dz) && has(dx - 1, dz)) {
    g.set(dx, ground + 2, dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
