// The Quadrant Hotel and Suites, Mt Eden: a late-1980s concrete-and-glass hotel. A 20-storey tower (lidar roof 81
// blocks) on a three-storey basalt podium, with stepped wings running down the slope to the south-west. Every column
// stands on its own foundation from y 0 to its floor; floor slabs every 4 blocks; the facade is the exposed outer ring
// (panes in frames, spandrels, a string course per storey); the inside is air with a lit pane here and there.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_102546424.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_102546424.nbt`;

const W = 78, D = 106, H = 94;
// the lidar roofs snap to clean tiers: tower, a setback, the wings, the low wing, the lowest corner
const TIERS = [6, 20, 29, 41, 73, 81];
const snap = (r) => TIERS.reduce((a, t) => (Math.abs(t - r) < Math.abs(a - r) ? t : a));

// one column per footprint cell: g = lidar ground, L0 = ground floor (the next 4-block storey line above g),
// top = roof (cells y < top are the building; top itself is the parapet line)
const col = new Map();
for (const [x, z, g, r] of cells) {
  const L0 = Math.ceil(g / 4) * 4;
  col.set(`${x},${z}`, { x, z, g, L0, top: Math.max(snap(r), L0 + 4) });
}
const at = (x, z) => col.get(`${x},${z}`);
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const FACING = { W: "west", E: "east", N: "north", S: "south" };

// a neighbour is outdoors at height y when it is off the footprint or y is above its roof
const outdoor = (x, z, y) => { const n = at(x, z); return !n || y >= n.top; };
const exposure = (c, y) => Object.keys(DIRS).filter((d) => outdoor(c.x + DIRS[d][0], c.z + DIRS[d][1], y));
// the parapet runs only where the roof ends or steps down, not across the flat tiers
const rim = (c) => Object.keys(DIRS).some((d) => { const n = at(c.x + DIRS[d][0], c.z + DIRS[d][1]); return !n || n.top < c.top; });

// the entrance: a three-cell bay on the downhill (lowest ground) street face, recessed under its own lintel
const onlyFace = (c, y) => { const e = exposure(c, y); return e.length === 1 ? e[0] : null; };
let bay = null;
for (const c of col.values()) {
  const d = onlyFace(c, c.L0 + 1); if (!d) continue;
  const t = DIRS[d][0] === 0 ? [1, 0] : [0, 1];
  const cs = [-1, 0, 1].map((k) => at(c.x + t[0] * k, c.z + t[1] * k));
  if (cs.every((b) => b && b.L0 === c.L0 && onlyFace(b, c.L0 + 1) === d && onlyFace(b, c.L0 + 2) === d)) {
    if (!bay || c.g < bay.c.g) bay = { d, c, cells: cs };
  }
}

const M = {
  found: "stone", plinth: "polished_basalt", string: "smooth_quartz", floor: "light_gray_concrete",
  spandrel: "gray_concrete", shop: "glass", frame: "white_concrete", roof: "gray_concrete",
  plant: "light_gray_concrete", lamp: "glowstone",
};
const PANE = "light_blue_stained_glass_pane";

const g = new Voxels([W, H, D]);
for (const c of col.values()) {
  const { x, z, g: gr, L0, top } = c;
  for (let y = 0; y <= top; y++) {
    if (y < gr) { g.set(x, y, z, M.found); continue; }
    if (y < L0) { g.set(x, y, z, M.plinth); continue; }
    if (y === top) { if (rim(c)) g.set(x, y, z, M.string); continue; }
    if (y === top - 1) { g.set(x, y, z, exposure(c, y).length ? M.string : M.roof); continue; }
    const k = (y - L0) % 4, ex = exposure(c, y);
    if (k === 0) { g.set(x, y, z, ex.length ? M.string : M.floor); continue; }
    if (!ex.length) continue;                                   // interior air
    if (k === 3) { g.set(x, y, z, y < L0 + 12 ? M.plinth : M.spandrel); continue; }
    if (bay && bay.cells.includes(c)) {                         // the entrance bay: door in the middle, lanterns hung either side
      if (c === bay.c) g.set(x, y, z, "dark_oak_door", { facing: FACING[bay.d], half: k === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (k === 2) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (ex.length > 1) { g.set(x, y, z, M.frame); continue; }  // a corner column reads as a mullion
    const d = ex[0], t = d === "E" || d === "W" ? z : x;
    if (y < L0 + 4 || t % 3 === 0) { g.set(x, y, z, y < L0 + 4 && t % 3 !== 0 ? M.shop : M.frame); continue; }
    const along = d === "E" || d === "W" ? { north: "true", south: "true", east: "false", west: "false" }
                                         : { north: "false", south: "false", east: "true", west: "true" };
    g.set(x, y, z, PANE, { ...along, waterlogged: "false" });
  }
}

// warm light standing on the floor, just behind some panes and shopfronts (the cell inside the glass is air)
for (const c of col.values()) {
  for (let y = c.L0 + 1; y < c.top - 1; y += 4) {
    const ex = exposure(c, y), t = ex.length === 1 && (ex[0] === "E" || ex[0] === "W") ? c.z : c.x;
    if (ex.length !== 1 || t % 3 === 0 || (bay && bay.cells.includes(c))) continue;
    if (((c.x * 13 + c.z * 7 + y) % 9) !== 0) continue;
    const [dx, dz] = DIRS[ex[0]], n = at(c.x - dx, c.z - dz);
    if (!n || y < n.L0 || y >= n.top - 1 || g.get(n.x, y, n.z)) continue;
    g.set(n.x, y, n.z, M.lamp);
  }
}

// roof plant: 3 x 3 x 2 boxes on the flat tower roof, away from the parapet
for (let x = 1; x < W - 1; x += 9) for (let z = 1; z < D - 1; z += 9) {
  const ring = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) ring.push(at(x + dx, z + dz));
  if (!ring.every((n) => n && n.top === 81 && !rim(n))) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = 81; y <= 82; y++) g.set(x + dx, y, z + dz, M.plant);
}

const r = g.save(OUT);
console.log(`way_102546424: ${r.blocks} blocks, ${r.palette} palette entries, entrance on the ${bay ? FACING[bay.d] : "none"} face`);
