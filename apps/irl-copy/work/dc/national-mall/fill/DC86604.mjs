import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1680 K Street NW: late-20th-century Downtown office block.
// Light precast-concrete piers and spandrels, quartz floor bands, tinted glazing,
// granite base, cornice parapet, rooftop mechanical penthouse on the central roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86604";
const W = 24, D = 19, H = 32;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const row of raw) {
  const [x, z, gr, rf] = row;
  cells.set(`${x},${z}`, { x, z, g: Math.round(gr), r: Math.round(rf) });
}
const key = (x, z) => `${x},${z}`;
const inF = (x, z) => cells.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Depth from the footprint edge: 1 = facade, 2 = air gap behind glass, 3+ = solid core.
const depth = new Map();
let frontier = [];
for (const c of cells.values()) {
  if (DIRS.some(([dx, dz]) => !inF(c.x + dx, c.z + dz))) {
    depth.set(key(c.x, c.z), 1);
    frontier.push(c);
  }
}
let dd = 1;
while (frontier.length) {
  const next = [];
  for (const c of frontier) {
    for (const [dx, dz] of DIRS) {
      const nx = c.x + dx, nz = c.z + dz;
      if (inF(nx, nz) && !depth.has(key(nx, nz))) {
        depth.set(key(nx, nz), dd + 1);
        next.push(cells.get(key(nx, nz)));
      }
    }
  }
  frontier = next;
  dd++;
}
const depthOf = (c) => depth.get(key(c.x, c.z)) ?? 3;

// Central penthouse box (only here may the roof rise above the main tier).
const inPenthouseBox = (c) => c.x >= 6 && c.x <= 17 && c.z >= 4 && c.z <= 14 && depthOf(c) >= 2;

// Roof tiers: clamp to storeys, then snap lidar noise and stray bumps onto the main roof.
for (const c of cells.values()) {
  c.t = Math.min(28, Math.max(c.g + 4, c.r));
}
const hist = new Map();
for (const c of cells.values()) hist.set(c.t, (hist.get(c.t) || 0) + 1);
const mainTop = [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0];
for (const c of cells.values()) {
  if (inPenthouseBox(c) && c.t > mainTop + 1) continue; // genuine rooftop core
  if (c.t > mainTop + 1 || Math.abs(c.t - mainTop) <= 1) c.t = mainTop;
}
// Penthouse core rises to its own level, which is at least two above the main roof.
let penTop = mainTop;
for (const c of cells.values()) {
  if (inPenthouseBox(c) && c.r > mainTop + 1) penTop = Math.max(penTop, Math.min(26, c.r));
}
for (const c of cells.values()) {
  if (inPenthouseBox(c) && c.r > mainTop + 1) c.t = penTop;
}
const maxT = Math.max(...[...cells.values()].map((c) => c.t));

// A pier sits on the corners and on every third bay of each facade.
const isPier = (c) => {
  const exX = !inF(c.x - 1, c.z) || !inF(c.x + 1, c.z); // east/west face, indexed along z
  const exZ = !inF(c.x, c.z - 1) || !inF(c.x, c.z + 1); // north/south face, indexed along x
  if (exX && exZ) return true;
  if (exZ) return c.x % 3 === 0;
  if (exX) return c.z % 3 === 0;
  return false;
};

const paneProps = (c) => {
  const conn = (dx, dz) => {
    const n = cells.get(key(c.x + dx, c.z + dz));
    return !!n && depth.get(key(n.x, n.z)) === 1;
  };
  return {
    north: String(conn(0, -1)),
    south: String(conn(0, 1)),
    east: String(conn(1, 0)),
    west: String(conn(-1, 0)),
    waterlogged: "false",
  };
};

const vox = new Voxels([W, H, D]);

for (const c of cells.values()) {
  const { x, z, g, t } = c;
  const dep = depthOf(c);

  // Foundation / plinth below ground.
  for (let y = 0; y < g; y++) vox.set(x, y, z, "polished_andesite");

  for (let y = g; y < t; y++) {
    const r = y - g;

    // Roof: cornice cap on facades, pale roof membrane inside.
    if (y === t - 1) {
      vox.set(x, y, z, dep === 1 ? "smooth_quartz" : "stone");
      continue;
    }

    // Storey position: ground storey rows 0..3, then 4-row storeys.
    const kk = r <= 3 ? r : (r - 4) % 4; // 0 slab/base, 1-2 glass, 3 spandrel/lintel
    const glassRow = kk === 1 || kk === 2;

    if (dep === 1) {
      if (y === t - 2) { vox.set(x, y, z, "white_concrete"); continue; } // parapet course
      if (r === 0) { vox.set(x, y, z, "polished_granite"); continue; }   // base course
      if (r === 3 || kk === 0) { vox.set(x, y, z, "smooth_quartz"); continue; } // storey band
      if (kk === 3) { vox.set(x, y, z, "white_concrete"); continue; }    // spandrel
      if (isPier(c)) vox.set(x, y, z, "white_concrete");
      else vox.set(x, y, z, "light_blue_stained_glass_pane", paneProps(c));
      continue;
    }

    if (dep === 2) {
      if (r === 0 || r === 3 || kk === 0) {
        vox.set(x, y, z, "smooth_quartz"); // floor slab
      } else if (glassRow && ((x * 7 + z * 5 + y * 3) % 11 === 0)) {
        vox.set(x, y, z, "shroomlight"); // warm light behind the glass
      }
      continue;
    }

    vox.set(x, y, z, "light_gray_concrete"); // solid core, no interior
  }
}

// Entrance on the north (low-z) facade, nearest the centre, with a stone surround.
const d1 = [...cells.values()].filter((c) => depthOf(c) === 1);
const minZ = Math.min(...d1.map((c) => c.z));
const front = d1.filter((c) => c.z === minZ).sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2));
if (front.length) {
  const e = front[0];
  // Stone surround on either side of the door.
  for (const dx of [-1, 1]) {
    const sx = e.x + dx;
    if (inF(sx, minZ)) {
      vox.set(sx, e.g, minZ, "polished_granite");
      vox.set(sx, e.g + 1, minZ, "polished_granite");
      vox.set(sx, e.g + 2, minZ, "polished_granite");
    }
  }
  vox.set(e.x, e.g, e.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(e.x, e.g + 1, e.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  vox.set(e.x, e.g + 2, e.z, "lantern", { hanging: "true", waterlogged: "false" });
  // Canopy over the entrance bay, carried on the surround.
  for (let dx = -1; dx <= 1; dx++) {
    const cx = e.x + dx;
    if (inF(cx, minZ)) {
      vox.set(cx, e.g + 3, minZ, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Rooftop mechanical penthouse on the central high roof, with a cornice cap.
for (const c of cells.values()) {
  if (c.t !== maxT) continue;
  if (!inPenthouseBox(c)) continue;
  for (let y = c.t; y < c.t + 2; y++) vox.set(c.x, y, c.z, "light_gray_concrete");
  vox.set(c.x, c.t + 2, c.z, "smooth_quartz");
}

vox.save(`${DIR}/${ID}.nbt`);
