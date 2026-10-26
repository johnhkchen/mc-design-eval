// DC65854: a 1920s-30s Classical limestone office block on a 9 x 17 footprint, 3 storeys over a plinth,
// a flat parapeted roof and a stepped tower corner (lidar 8 blocks). Built from the cells file.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65854.cells.json", "utf8"));

// Lidar roof per cell, smoothed over its 3x3 neighbourhood and snapped to three flat tiers (6, 7, 8).
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const at = (x, z) => raw.get(`${x},${z}`);
const plan = new Map();
for (const [x, z, g] of cells) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = at(x + dx, z + dz); if (c) { s += c.r; n++; } }
  const m = s / n;
  plan.set(`${x},${z}`, { g, T: m >= 7.5 ? 8 : m >= 6.5 ? 7 : 6 });   // T = top of the body (exclusive), so the roof surface is T
}
const inside = (x, z) => plan.has(`${x},${z}`);
const top = (x, z) => plan.get(`${x},${z}`)?.T ?? 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// A cell's shell faces: the sides open to the street or to a lower neighbour at this height.
const exposed = (x, y, z) => Object.keys(DIRS).filter(d => {
  const [dx, dz] = DIRS[d]; const nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || top(nx, nz) <= y;
});

// Front: the north face of (7,0), the entrance on the most open part of the building.
const DOOR = { x: 7, z: 0, face: "N" };

const W = 9, Hh = 20, D = 17;
const g = new Voxels([W, Hh, D]);

const isCorner = f => f.length > 1 && !(f.includes("N") && f.includes("S")) && !(f.includes("E") && f.includes("W"));

for (const [x, z] of Array.from(plan.keys(), k => k.split(",").map(Number))) {
  const { T } = plan.get(`${x},${z}`);
  // foundation: solid under every footprint cell
  g.set(x, 0, z, "polished_andesite");
  for (let y = 1; y < T; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length && y < T - 1) {
      // interior: air, a floor slab at each storey line, a roof deck on top
      if (y === T - 1) g.set(x, y, z, "smooth_stone");
      else if (y % 2 === 0) g.set(x, y, z, "oak_planks");
      continue;
    }
    if (y === T - 1) { g.set(x, y, z, "smooth_stone"); if (faces.length) g.set(x, y, z, "smooth_quartz"); continue; }  // parapet / roof deck
    if (!faces.length) continue;
    const corner = isCorner(faces);
    const u = faces.includes("N") || faces.includes("S") ? x : z;
    const door = DOOR.x === x && DOOR.z === z && faces.includes(DOOR.face) && (y === 1 || y === 2);
    if (door) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 0) continue;
    if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }                // quoins
    if (y % 2 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }           // storey belt courses
    // window rows: calcite piers every third bay, glass panes between
    if (u % 3 === 0) { g.set(x, y, z, "calcite"); continue; }
    const f = faces[0];
    const state = (f === "N" || f === "S")
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", state);
  }
}

// Warm light: glowstone just behind some front-facing glass, inside the empty storey rows
for (const [x, z] of Array.from(plan.keys(), k => k.split(",").map(Number))) {
  const { T } = plan.get(`${x},${z}`);
  for (let y = 1; y < T - 1; y += 2) {
    for (const f of exposed(x, y, z)) {
      const u = f === "N" || f === "S" ? x : z;
      if (u % 3 === 0 || (x === DOOR.x && z === DOOR.z)) continue;
      if ((u + y) % 4 !== 1) continue;
      const [dx, dz] = DIRS[f];
      const ix = x - dx, iz = z - dz;                                       // one step inward
      if (inside(ix, iz) && !exposed(ix, y, iz).length && top(ix, iz) > y + 1) { g.set(ix, y, iz, "glowstone"); break; }
    }
  }
}

// Roof plant: three ventilator stacks on the upper roof, clear of the parapet (each stands on the roof deck below)
const stacks = [];
for (const [x, z] of Array.from(plan.keys(), k => k.split(",").map(Number))) {
  const { T } = plan.get(`${x},${z}`);
  if (T < 7 || exposed(x, T - 1, z).length) continue;
  if (stacks.every(([a, b]) => Math.abs(a - x) + Math.abs(b - z) >= 3)) stacks.push([x, z, T]);
  if (stacks.length === 3) break;
}
for (const [x, z, T] of stacks) { g.set(x, T, z, "stone_bricks"); g.set(x, T + 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); }

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65854.nbt";
const r = g.save(out);
console.log(JSON.stringify(r));
