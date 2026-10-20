import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3421721.cells.json`, "utf8"));

const W = 7, H = 16, D = 7;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const info = new Map();
for (const [x, z, gyRaw, roofRaw] of cells) {
  info.set(`${x},${z}`, { x, z, gy: Math.round(gyRaw), roof: roofRaw });
}
const has = (x, z) => info.has(`${x},${z}`);

// Flat roof tier from the median lidar roof, clamped to a sensible range
const roofVals = cells.map((c) => c[3]).sort((a, b) => a - b);
const medianRoof = roofVals[Math.floor(roofVals.length / 2)];
const R = Math.min(13, Math.max(4, Math.round(medianRoof)));

const DIRS = {
  N: [0, -1, "north"],
  S: [0, 1, "south"],
  W: [-1, 0, "west"],
  E: [1, 0, "east"],
};

const paneProps = (axisAlongX) =>
  axisAlongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const meta = new Map();

// ---- pass 1: foundation, walls, storey slabs, roof ----
for (const c of info.values()) {
  const { x, z } = c;
  const gy = c.gy;
  const top = Math.min(13, Math.max(R, gy + 4));
  const exposed = {};
  for (const [k, [dx, dz]] of Object.entries(DIRS)) {
    exposed[k] = !has(x + dx, z + dz);
  }
  const count = Object.values(exposed).filter(Boolean).length;
  const perim = count > 0;
  const corner = count >= 2;
  const axisX = exposed.N || exposed.S;
  meta.set(`${x},${z}`, { gy, top, exposed, count, perim, corner, axisX });

  // solid foundation up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone");

  for (let y = gy; y < top; y++) {
    if (!perim) {
      // interior: a floor slab at each storey line, air in between
      if (y === gy || y === gy + 2) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (corner) {
      // corner piers: continuous brick with a stone base
      g.set(x, y, z, y === gy ? "stone_bricks" : "bricks");
      continue;
    }
    // face cells
    if (y === gy) {
      g.set(x, y, z, "stone_bricks");                 // base course
    } else if (y === gy + 1) {
      // shopfront: glass with brick mullions every other cell
      const mullion = (x + z) % 2 === 0;
      g.set(x, y, z, mullion ? "bricks" : "glass");
    } else if (y === gy + 2) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // storey sill band
    } else {
      // upper storey: window glass with frames
      g.set(x, y, z, "glass_pane", paneProps(axisX));
    }
  }

  // roof: cornice ledge on the perimeter, flat deck inside
  if (perim) {
    g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, top, z, "smooth_stone");
  }
}

// ---- pass 2: entrance on a face cell near the middle ----
const faceCandidates = [...meta.entries()]
  .filter(([, m]) => m.perim && !m.corner)
  .map(([k, m]) => ({ ...m, pos: k.split(",").map(Number) }));
faceCandidates.sort((a, b) => {
  const ma = a.pos[0] === 3 || a.pos[1] === 3 ? 0 : 1;
  const mb = b.pos[0] === 3 || b.pos[1] === 3 ? 0 : 1;
  return ma - mb || a.pos[0] - b.pos[0] || a.pos[1] - b.pos[1];
});
if (faceCandidates.length) {
  const f = faceCandidates[0];
  const [x, z] = f.pos;
  const outward = Object.keys(DIRS).find((k) => f.exposed[k]);
  const facing = DIRS[outward][2];
  const hinge = "left";
  const gy = f.gy;
  // door two blocks tall, replacing the shopfront glass and sill
  g.set(x, gy + 1, z, "oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, gy + 2, z, "oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
  // small stone canopy projecting over the door (on the outside cell row)
  const [odx, odz] = [DIRS[outward][0], DIRS[outward][1]];
  const cx = x + odx, cz = z + odz;
  if (!has(cx, cz)) {
    // sits outside the footprint: place it on the top of the door's own cell instead
    g.set(x, gy + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, gy + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- pass 3: warm lights behind some upper windows ----
for (const [k, m] of meta.entries()) {
  if (!m.perim || m.corner) continue;
  const [x, z] = k.split(",").map(Number);
  const outward = Object.keys(DIRS).find((d) => m.exposed[d]);
  const [dx, dz] = [DIRS[outward][0], DIRS[outward][1]];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz)) continue;
  for (let y = m.gy + 3; y <= m.top - 1; y++) {
    if ((x + z + y) % 3 === 0) g.set(ix, y, iz, "shroomlight");
  }
}

// ---- pass 4: rooftop mechanical box on the interior deck ----
for (const [k, m] of meta.entries()) {
  if (m.perim) continue;
  const [x, z] = k.split(",").map(Number);
  if ((x === 2 || x === 3) && z === 3 && m.top + 2 <= H - 1) {
    g.set(x, m.top + 1, z, "light_gray_concrete");
    g.set(x, m.top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC3421721.nbt`);
