import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001285";
const W = 20, H = 28, D = 6;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cells = new Map();
for (const c of raw) {
  const [x, z, gr, roof] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(key(x, z), {
    x, z,
    gr: Math.max(0, Math.min(H - 10, Math.round(gr))),
    roof: Math.max(0, Math.min(H - 1, Math.round(roof))),
  });
}
const has = (x, z) => cells.has(key(x, z));

// Flatten lidar roof into clean tiers (even-block steps, close to the median).
const roofs = [...cells.values()].map(c => c.roof).sort((a, b) => a - b);
const medRoof = roofs.length ? roofs[Math.floor(roofs.length / 2)] : 16;
for (const c of cells.values()) {
  let r = Math.round(c.roof / 2) * 2;
  r = Math.max(medRoof - 2, Math.min(medRoof + 2, r));
  c.top = Math.max(c.gr + 10, Math.min(H - 4, r));
}

// Facade classification.
for (const c of cells.values()) {
  const xm = !has(c.x - 1, c.z), xp = !has(c.x + 1, c.z);
  const zm = !has(c.x, c.z - 1), zp = !has(c.x, c.z + 1);
  c.perim = xm || xp || zm || zp;
  c.corner = (xm || xp) && (zm || zp);
  c.nrm = null;
  if (zm && !xm && !xp) c.nrm = { dx: 0, dz: -1, facing: "north" };
  else if (zp && !xm && !xp) c.nrm = { dx: 0, dz: 1, facing: "south" };
  else if (xm && !zm && !zp) c.nrm = { dx: -1, dz: 0, facing: "west" };
  else if (xp && !zm && !zp) c.nrm = { dx: 1, dz: 0, facing: "east" };
  else if (zm) c.nrm = { dx: 0, dz: -1, facing: "north" };
  else if (zp) c.nrm = { dx: 0, dz: 1, facing: "south" };
  else if (xm) c.nrm = { dx: -1, dz: 0, facing: "west" };
  else if (xp) c.nrm = { dx: 1, dz: 0, facing: "east" };
  c.along = (zm || zp) ? c.x : c.z;
  // Window bays: two windows then one brick pier; corners are quoins.
  c.window = c.perim && !c.corner && (c.along % 3 !== 0);
}

// Entrance on the z-min (street) face, near the middle.
const streetCells = [...cells.values()].filter(c => c.perim && !c.corner && c.nrm && c.nrm.facing === "north");
let entry = null;
if (streetCells.length) {
  const xs = streetCells.map(c => c.x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  entry = streetCells.reduce((best, c) => (Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best));
} else {
  entry = [...cells.values()].find(c => c.perim && c.nrm) || null;
}
// Cells flanking the entry along the same street face get granite pilasters and the canopy.
const flank = new Set();
if (entry) {
  for (const dx of [-1, 0, 1]) {
    const c = cells.get(key(entry.x + dx, entry.z));
    if (c && c.perim) flank.add(key(c.x, c.z));
  }
}

for (const c of cells.values()) {
  const { x, z, gr, top } = c;

  // Foundation.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!c.perim) {
    g.set(x, gr, z, "smooth_stone");
    for (let h = 4; gr + h < top; h += 2) g.set(x, gr + h, z, "smooth_stone");
    g.set(x, top, z, "smooth_stone");
    continue;
  }

  // Plinth.
  g.set(x, gr, z, "polished_granite");

  const isEntry = entry && entry.x === x && entry.z === z;
  const isFlank = flank.has(key(x, z)) && !isEntry;

  // Shopfront: granite base piers, glass bays, dark wood frames.
  for (let h = 1; h <= 2; h++) {
    const y = gr + h;
    if (isEntry && c.nrm) {
      g.set(x, y, z, "dark_oak_door", {
        facing: c.nrm.facing, half: h === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
      });
    } else if (isFlank) {
      g.set(x, y, z, "polished_granite");
    } else if (c.corner || !c.window) {
      g.set(x, y, z, "dark_oak_planks");
    } else {
      g.set(x, y, z, "glass");
    }
  }
  // Fascia / transom course.
  g.set(x, gr + 3, z, "stone_bricks");

  // Upper storeys: brick wall, smooth-stone sills, glass windows, quoins at corners.
  for (let h = 4; gr + h <= top - 2; h++) {
    const y = gr + h;
    const rel = (h - 4) % 2;
    if (c.corner) {
      g.set(x, y, z, "stone_bricks");
    } else if (c.window) {
      if (rel === 0) {
        g.set(x, y, z, "smooth_stone");
      } else {
        const lit = ((x * 7 + z * 13 + y * 3) % 11) === 0;
        g.set(x, y, z, lit ? "glowstone" : "glass");
      }
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Cornice: two courses stepped out in stone, then a smooth cap.
  g.set(x, top - 2, z, "stone_bricks");
  g.set(x, top - 1, z, "stone_bricks");
  g.set(x, top, z, "smooth_stone");
}

// Entrance canopy over the door and flanking bays, one storey above the shopfront.
if (entry) {
  for (const k of flank) {
    const [fx, fz] = k.split(",").map(Number);
    const c = cells.get(k);
    if (!c) continue;
    g.set(fx, c.gr + 4, fz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
  const ec = cells.get(key(entry.x, entry.z));
  if (ec) g.set(entry.x, ec.gr + 4, entry.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// Roof access bulkhead with a small coping.
const bulkCell = [...cells.values()].find(c => !c.perim && c.z === 2) || null;
if (bulkCell && bulkCell.top + 3 < H) {
  for (let y = bulkCell.top + 1; y <= bulkCell.top + 2; y++) {
    g.set(bulkCell.x, y, bulkCell.z, "bricks");
  }
  g.set(bulkCell.x, bulkCell.top + 3, bulkCell.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
